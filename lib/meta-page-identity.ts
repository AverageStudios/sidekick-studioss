export type MetaPageAssetLike = {
  asset_id?: string | null;
  name?: string | null;
  metadata_json?: Record<string, unknown> | null;
};

export type MetaPageIntegrationLike = {
  selected?: {
    pageId?: string | null;
  } | null;
  assets?: {
    pages?: MetaPageAssetLike[] | null;
  } | null;
} | null;

export type MetaPagePreviewIdentity = {
  asset: MetaPageAssetLike | null;
  pageId: string | null;
  pageName: string;
  pageAvatarUrl: string | null;
  isFallback: boolean;
};

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export function getMetaPageAvatarUrl(pageAsset: MetaPageAssetLike | null | undefined) {
  if (!pageAsset) return null;

  const metadata = pageAsset.metadata_json || {};
  const explicitAvatarUrl =
    readString(metadata.avatar_url) ||
    readString(metadata.profile_picture_url) ||
    readString(metadata.picture_url);

  if (explicitAvatarUrl) {
    return explicitAvatarUrl;
  }

  const picture = metadata.picture;
  if (picture && typeof picture === "object") {
    const typedPicture = picture as {
      data?: { url?: string | null } | null;
      url?: string | null;
    };

    const nestedUrl = readString(typedPicture.url) || readString(typedPicture.data?.url);
    if (nestedUrl) {
      return nestedUrl;
    }
  }

  return pageAsset.asset_id ? `https://graph.facebook.com/${pageAsset.asset_id}/picture?type=square` : null;
}

export function resolveMetaPageAsset(
  integration: MetaPageIntegrationLike,
  preferredPageId?: string | null,
) {
  const pages = integration?.assets?.pages || [];
  const resolvedPageId = preferredPageId || integration?.selected?.pageId || null;

  return (
    pages.find((asset) => asset.asset_id === resolvedPageId) ||
    pages.find((asset) => asset.asset_id === integration?.selected?.pageId) ||
    pages[0] ||
    null
  );
}

export function resolveMetaPagePreviewIdentity({
  integration,
  preferredPageId,
  fallbackName = "Select a Facebook Page",
}: {
  integration: MetaPageIntegrationLike;
  preferredPageId?: string | null;
  fallbackName?: string;
}): MetaPagePreviewIdentity {
  const asset = resolveMetaPageAsset(integration, preferredPageId);

  if (!asset) {
    return {
      asset: null,
      pageId: preferredPageId || integration?.selected?.pageId || null,
      pageName: fallbackName,
      pageAvatarUrl: null,
      isFallback: true,
    };
  }

  return {
    asset,
    pageId: asset.asset_id || preferredPageId || integration?.selected?.pageId || null,
    pageName: asset.name || fallbackName,
    pageAvatarUrl: getMetaPageAvatarUrl(asset),
    isFallback: false,
  };
}
