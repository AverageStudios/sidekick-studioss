import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchMetaAdAccounts,
  fetchMetaLeadForms,
  fetchMetaPages,
  fetchMetaPixels,
  fetchMetaTokenDebugInfo,
  fetchMetaUser,
  MetaAdAccount,
  MetaLeadForm,
  MetaPage,
  MetaPixel,
} from "@/lib/meta";
import { decryptMetaToken, encryptMetaToken } from "@/lib/meta-security";

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export type WorkspaceProviderConnectionRow = {
  id: string;
  workspace_id: string;
  provider: "meta";
  user_id: string;
  provider_user_id: string | null;
  provider_user_name: string | null;
  token_ciphertext: string | null;
  token_iv: string | null;
  token_tag: string | null;
  token_type: string | null;
  token_expires_at: string | null;
  scopes: string[];
  status: "connected" | "expired" | "revoked" | "disconnected" | "error";
  metadata_json: Record<string, unknown>;
  connected_at: string;
  disconnected_at: string | null;
  last_synced_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkspaceProviderAssetType =
  | "ad_account"
  | "page"
  | "instagram_actor"
  | "pixel"
  | "lead_form";

export type WorkspaceProviderAssetRow = {
  id: string;
  workspace_id: string;
  provider: "meta";
  connection_id: string | null;
  asset_type: WorkspaceProviderAssetType;
  asset_id: string;
  name: string | null;
  metadata_json: Record<string, unknown>;
  is_available: boolean;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMetaIntegrationState = {
  connection: WorkspaceProviderConnectionRow | null;
  tokenAvailable: boolean;
  selected: {
    adAccountId: string | null;
    pageId: string | null;
    pixelId: string | null;
    leadFormId: string | null;
    instagramActorId: string | null;
  };
  assets: {
    adAccounts: WorkspaceProviderAssetRow[];
    pages: WorkspaceProviderAssetRow[];
    pixels: WorkspaceProviderAssetRow[];
    leadForms: WorkspaceProviderAssetRow[];
    instagramActors: WorkspaceProviderAssetRow[];
  };
};

function formatAdAccountName(adAccount: MetaAdAccount) {
  return adAccount.name || (adAccount.account_id ? `Ad Account ${adAccount.account_id}` : adAccount.id);
}

function formatInstagramAssetName(instagram: { id: string; username?: string } | null | undefined) {
  if (!instagram) return null;
  return instagram.username ? `@${instagram.username}` : instagram.id;
}

function getMetaPageAvatarUrl(page: MetaPage) {
  const picture = page.picture;
  if (!picture || typeof picture !== "object") return null;
  const dataUrl =
    picture.data && typeof picture.data === "object" && typeof picture.data.url === "string"
      ? picture.data.url
      : null;
  const directUrl = typeof picture.url === "string" ? picture.url : null;
  return dataUrl || directUrl;
}

async function getActiveMetaConnection(admin: SupabaseAdmin, workspaceId: string) {
  const { data, error } = await admin
    .from("workspace_provider_connections")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as WorkspaceProviderConnectionRow | null) || null;
}

async function listMetaAssets(admin: SupabaseAdmin, workspaceId: string) {
  const { data, error } = await admin
    .from("workspace_provider_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta")
    .order("asset_type", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as WorkspaceProviderAssetRow[]).filter((asset) => asset.is_available);
}

function groupMetaAssets(assets: WorkspaceProviderAssetRow[]) {
  return {
    adAccounts: assets.filter((asset) => asset.asset_type === "ad_account"),
    pages: assets.filter((asset) => asset.asset_type === "page"),
    pixels: assets.filter((asset) => asset.asset_type === "pixel"),
    leadForms: assets.filter((asset) => asset.asset_type === "lead_form"),
    instagramActors: assets.filter((asset) => asset.asset_type === "instagram_actor"),
  };
}

function deriveSelectedAssets(assets: WorkspaceProviderAssetRow[]) {
  const selected = {
    adAccountId: null as string | null,
    pageId: null as string | null,
    pixelId: null as string | null,
    leadFormId: null as string | null,
    instagramActorId: null as string | null,
  };

  for (const asset of assets) {
    if (!asset.is_selected) continue;
    if (asset.asset_type === "ad_account") selected.adAccountId = asset.asset_id;
    if (asset.asset_type === "page") selected.pageId = asset.asset_id;
    if (asset.asset_type === "pixel") selected.pixelId = asset.asset_id;
    if (asset.asset_type === "lead_form") selected.leadFormId = asset.asset_id;
    if (asset.asset_type === "instagram_actor") selected.instagramActorId = asset.asset_id;
  }

  return selected;
}

async function replaceMetaAssetsByType({
  admin,
  workspaceId,
  connectionId,
  assetType,
  rows,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  connectionId: string;
  assetType: WorkspaceProviderAssetType;
  rows: Array<{
    asset_id: string;
    name: string | null;
    metadata_json: Record<string, unknown>;
    is_selected: boolean;
  }>;
}) {
  const { error: resetError } = await admin
    .from("workspace_provider_assets")
    .update({ is_available: false, is_selected: false })
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta")
    .eq("asset_type", assetType);

  if (resetError) {
    throw new Error(resetError.message);
  }

  const formattedRows = rows.map((row) => ({
    workspace_id: workspaceId,
    provider: "meta" as const,
    connection_id: connectionId,
    asset_type: assetType,
    asset_id: row.asset_id,
    name: row.name,
    metadata_json: row.metadata_json,
    is_available: true,
    is_selected: row.is_selected,
  }));

  if (formattedRows.length) {
    const { error } = await admin
      .from("workspace_provider_assets")
      .upsert(formattedRows, { onConflict: "workspace_id,provider,asset_type,asset_id" });
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function getWorkspaceMetaIntegrationState({
  admin,
  workspaceId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
}): Promise<WorkspaceMetaIntegrationState> {
  const [connection, assets] = await Promise.all([
    getActiveMetaConnection(admin, workspaceId),
    listMetaAssets(admin, workspaceId),
  ]);
  const grouped = groupMetaAssets(assets);
  const selected = deriveSelectedAssets(assets);

  return {
    connection,
    tokenAvailable: Boolean(connection && decryptMetaToken(connection)),
    selected,
    assets: grouped,
  };
}

export async function upsertWorkspaceMetaConnection({
  admin,
  workspaceId,
  userId,
  accessToken,
  tokenType,
  expiresAt,
  scopes,
  providerUserId,
  providerUserName,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  userId: string;
  accessToken: string;
  tokenType?: string | null;
  expiresAt?: string | null;
  scopes: string[];
  providerUserId?: string | null;
  providerUserName?: string | null;
}) {
  const encryptedToken = encryptMetaToken(accessToken);
  const existing = await getActiveMetaConnection(admin, workspaceId);

  if (existing) {
    const { error: deactivateError } = await admin
      .from("workspace_provider_connections")
      .update({
        is_active: false,
        status: "disconnected",
        disconnected_at: new Date().toISOString(),
        token_ciphertext: null,
        token_iv: null,
        token_tag: null,
        refresh_token_ciphertext: null,
        refresh_token_iv: null,
        refresh_token_tag: null,
      })
      .eq("id", existing.id);

    if (deactivateError) {
      throw new Error(deactivateError.message);
    }
  }

  const payload = {
    workspace_id: workspaceId,
    provider: "meta" as const,
    user_id: userId,
    provider_user_id: providerUserId || null,
    provider_user_name: providerUserName || null,
    token_ciphertext: encryptedToken.ciphertext,
    token_iv: encryptedToken.iv,
    token_tag: encryptedToken.tag,
    token_type: tokenType || null,
    token_expires_at: expiresAt || null,
    scopes,
    status: "connected" as const,
    metadata_json: existing
      ? {
          reconnected_from_connection_id: existing.id,
        }
      : {},
    connected_at: new Date().toISOString(),
    disconnected_at: null,
    is_active: true,
  };

  const { data, error } = await admin
    .from("workspace_provider_connections")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as WorkspaceProviderConnectionRow;
}

export async function disconnectWorkspaceMetaConnection({
  admin,
  workspaceId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
}) {
  const connection = await getActiveMetaConnection(admin, workspaceId);
  if (!connection) return;

  const { error: disconnectError } = await admin
    .from("workspace_provider_connections")
    .update({
      status: "disconnected",
      disconnected_at: new Date().toISOString(),
      is_active: false,
      token_ciphertext: null,
      token_iv: null,
      token_tag: null,
      refresh_token_ciphertext: null,
      refresh_token_iv: null,
      refresh_token_tag: null,
    })
    .eq("id", connection.id);
  if (disconnectError) {
    throw new Error(disconnectError.message);
  }

  const { error: assetsError } = await admin
    .from("workspace_provider_assets")
    .update({ is_selected: false, is_available: false })
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta");

  if (assetsError) {
    throw new Error(assetsError.message);
  }
}

export async function getWorkspaceMetaAccessToken({
  admin,
  workspaceId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
}) {
  const connection = await getActiveMetaConnection(admin, workspaceId);
  if (!connection) return null;
  const accessToken = decryptMetaToken(connection);
  return accessToken
    ? {
        connection,
        accessToken,
      }
    : null;
}

export async function syncWorkspaceMetaAssets({
  admin,
  workspaceId,
  userId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  userId: string;
}) {
  const tokenContext = await getWorkspaceMetaAccessToken({ admin, workspaceId });
  if (!tokenContext) {
    throw new Error("Connect Meta before syncing assets.");
  }

  const connection = tokenContext.connection;
  const accessToken = tokenContext.accessToken;
  const currentState = await getWorkspaceMetaIntegrationState({ admin, workspaceId });
  const currentSelected = currentState.selected;
  const [metaUser, adAccounts, pages] = await Promise.all([
    fetchMetaUser(accessToken),
    fetchMetaAdAccounts(accessToken),
    fetchMetaPages(accessToken),
  ]);

  const selectedAdAccountId =
    currentSelected.adAccountId && adAccounts.some((account) => account.id === currentSelected.adAccountId)
      ? currentSelected.adAccountId
      : adAccounts[0]?.id || null;
  const selectedPageId =
    currentSelected.pageId && pages.some((page) => page.id === currentSelected.pageId)
      ? currentSelected.pageId
      : pages[0]?.id || null;

  const selectedPage = selectedPageId ? pages.find((page) => page.id === selectedPageId) || null : null;
  const pixels =
    selectedAdAccountId
      ? await fetchMetaPixels(accessToken, selectedAdAccountId).catch(() => [] as MetaPixel[])
      : ([] as MetaPixel[]);
  const leadForms =
    selectedPageId
      ? await fetchMetaLeadForms(selectedPage?.access_token || accessToken, selectedPageId).catch(() => [] as MetaLeadForm[])
      : ([] as MetaLeadForm[]);

  const selectedPixelId =
    currentSelected.pixelId && pixels.some((pixel) => pixel.id === currentSelected.pixelId)
      ? currentSelected.pixelId
      : null;
  const selectedLeadFormId =
    currentSelected.leadFormId && leadForms.some((form) => form.id === currentSelected.leadFormId)
      ? currentSelected.leadFormId
      : null;
  const selectedInstagramActorId =
    currentSelected.instagramActorId &&
    Boolean(
      pages.some(
        (page) => page.instagram_business_account?.id === currentSelected.instagramActorId,
      ),
    )
      ? currentSelected.instagramActorId
      : selectedPage?.instagram_business_account?.id || null;

  await Promise.all([
    replaceMetaAssetsByType({
      admin,
      workspaceId,
      connectionId: connection.id,
      assetType: "ad_account",
      rows: adAccounts.map((account) => ({
        asset_id: account.id,
        name: formatAdAccountName(account),
        metadata_json: account as unknown as Record<string, unknown>,
        is_selected: account.id === selectedAdAccountId,
      })),
    }),
    replaceMetaAssetsByType({
      admin,
      workspaceId,
      connectionId: connection.id,
      assetType: "page",
      rows: pages.map((page) => ({
        asset_id: page.id,
        name: page.name || page.id,
        metadata_json: {
          ...(page as unknown as Record<string, unknown>),
          avatar_url: getMetaPageAvatarUrl(page),
          profile_picture_url: getMetaPageAvatarUrl(page),
          picture_url: getMetaPageAvatarUrl(page),
        },
        is_selected: page.id === selectedPageId,
      })),
    }),
    replaceMetaAssetsByType({
      admin,
      workspaceId,
      connectionId: connection.id,
      assetType: "pixel",
      rows: pixels.map((pixel) => ({
        asset_id: pixel.id,
        name: pixel.name || pixel.id,
        metadata_json: pixel as unknown as Record<string, unknown>,
        is_selected: pixel.id === selectedPixelId,
      })),
    }),
    replaceMetaAssetsByType({
      admin,
      workspaceId,
      connectionId: connection.id,
      assetType: "lead_form",
      rows: leadForms.map((leadForm) => ({
        asset_id: leadForm.id,
        name: leadForm.name || leadForm.id,
        metadata_json: leadForm as unknown as Record<string, unknown>,
        is_selected: leadForm.id === selectedLeadFormId,
      })),
    }),
    replaceMetaAssetsByType({
      admin,
      workspaceId,
      connectionId: connection.id,
      assetType: "instagram_actor",
      rows: pages
        .filter((page) => page.instagram_business_account?.id)
        .map((page) => ({
          asset_id: page.instagram_business_account!.id,
          name: formatInstagramAssetName(page.instagram_business_account),
          metadata_json: {
            ...(page.instagram_business_account as Record<string, unknown>),
            page_id: page.id,
            page_name: page.name || null,
          },
          is_selected: page.instagram_business_account?.id === selectedInstagramActorId,
        })),
    }),
  ]);

  const debugTokenData = await fetchMetaTokenDebugInfo(accessToken).catch(() => null);
  const scopes = debugTokenData?.data?.scopes || connection.scopes || [];
  const tokenExpiresAt =
    typeof debugTokenData?.data?.expires_at === "number" && debugTokenData.data.expires_at > 0
      ? new Date(debugTokenData.data.expires_at * 1000).toISOString()
      : connection.token_expires_at;

  const { error: connectionError } = await admin
    .from("workspace_provider_connections")
    .update({
      user_id: userId,
      provider_user_id: metaUser.id,
      provider_user_name: metaUser.name || null,
      scopes,
      token_expires_at: tokenExpiresAt,
      status: "connected",
      last_synced_at: new Date().toISOString(),
      metadata_json: {
        asset_counts: {
          ad_accounts: adAccounts.length,
          pages: pages.length,
          pixels: pixels.length,
          lead_forms: leadForms.length,
        },
      },
    })
    .eq("id", connection.id);

  if (connectionError) {
    throw new Error(connectionError.message);
  }

  return getWorkspaceMetaIntegrationState({ admin, workspaceId });
}

export async function saveWorkspaceMetaSelections({
  admin,
  workspaceId,
  selections,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  selections: {
    adAccountId?: string;
    pageId?: string;
    pixelId?: string;
    leadFormId?: string;
    instagramActorId?: string;
  };
}) {
  const tokenContext = await getWorkspaceMetaAccessToken({ admin, workspaceId });
  if (!tokenContext) {
    throw new Error("Connect Meta before selecting assets.");
  }

  const runSelectionUpdate = async (
    assetType: WorkspaceProviderAssetType,
    selectedId: string | undefined,
  ) => {
    const { error: clearError } = await admin
      .from("workspace_provider_assets")
      .update({ is_selected: false })
      .eq("workspace_id", workspaceId)
      .eq("provider", "meta")
      .eq("asset_type", assetType);

    if (clearError) {
      throw new Error(clearError.message);
    }

    if (!selectedId) {
      return;
    }

    const { error: selectError } = await admin
      .from("workspace_provider_assets")
      .update({ is_selected: true, is_available: true })
      .eq("workspace_id", workspaceId)
      .eq("provider", "meta")
      .eq("asset_type", assetType)
      .eq("asset_id", selectedId);

    if (selectError) {
      throw new Error(selectError.message);
    }
  };

  const applySelection = async (
    assetType: WorkspaceProviderAssetType,
    selectedId: string | undefined,
  ) => {
    await runSelectionUpdate(assetType, selectedId);
  };

  await applySelection("ad_account", selections.adAccountId);
  await applySelection("page", selections.pageId);
  await applySelection("pixel", selections.pixelId);
  await applySelection("lead_form", selections.leadFormId);
  await applySelection("instagram_actor", selections.instagramActorId);

  const shouldResync =
    Boolean(selections.adAccountId) || Boolean(selections.pageId);
  if (shouldResync) {
    return syncWorkspaceMetaAssets({
      admin,
      workspaceId,
      userId: tokenContext.connection.user_id,
    });
  }
  return getWorkspaceMetaIntegrationState({ admin, workspaceId });
}
