import { randomUUID } from "crypto";
import { env, isMondayConfigured } from "@/lib/env";

export type MondayOAuthTokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
};

type MondayGraphQlError = {
  message?: string;
  extensions?: {
    code?: string;
  };
};

type MondayGraphQlResponse<T> = {
  data?: T;
  errors?: MondayGraphQlError[];
};

type MondayMeResponse = {
  me?: {
    id?: string | number;
    name?: string;
    email?: string;
  };
};

type MondayBoardsResponse = {
  boards?: Array<{
    id?: string | number;
    name?: string;
    board_kind?: string;
    workspace?: {
      id?: string | number;
      name?: string;
    } | null;
  }>;
};

type MondayCreateItemResponse = {
  create_item?: {
    id?: string | number;
    name?: string;
    board?: {
      id?: string | number;
    };
  };
};

export type MondayProviderError = Error & {
  status?: number;
  category?: string | null;
  code?: string | null;
  provider?: "monday";
  step?: string;
  safeCategory?: string | null;
};

function createMondayProviderError(
  message: string,
  fields: Partial<Pick<MondayProviderError, "status" | "category" | "code" | "step" | "safeCategory">>,
) {
  return Object.assign(new Error(message), {
    provider: "monday" as const,
    ...fields,
  }) as MondayProviderError;
}

export type MondayBoardOption = {
  id: string;
  name: string;
  workspaceId?: string | null;
  workspaceName?: string | null;
  kind?: string | null;
};

function getRequiredClientId() {
  if (!isMondayConfigured() || !env.mondayClientId) {
    throw new Error("Monday OAuth env vars are missing.");
  }
  return env.mondayClientId;
}

function getRequiredClientSecret() {
  if (!isMondayConfigured() || !env.mondayClientSecret) {
    throw new Error("Monday OAuth env vars are missing.");
  }
  return env.mondayClientSecret;
}

function getRequiredRedirectUri() {
  if (!isMondayConfigured() || !env.mondayRedirectUri) {
    throw new Error("Monday OAuth env vars are missing.");
  }
  return env.mondayRedirectUri;
}

function resolveRedirectUri(override?: string | null) {
  return typeof override === "string" && override.trim().length > 0 ? override.trim() : getRequiredRedirectUri();
}

function getRequiredScopes() {
  if (!isMondayConfigured() || !env.mondayScopes) {
    throw new Error("Monday OAuth env vars are missing.");
  }
  return normalizeScopes(env.mondayScopes);
}

function normalizeScopes(value: string) {
  return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean))).join(" ");
}

function getScopeList(value: unknown) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean)));
}

function classifyMondayError({
  status,
  code,
  message,
  step,
}: {
  status?: number | null;
  code?: string | null;
  message?: string | null;
  step?: string | null;
}) {
  const normalizedCode = typeof code === "string" ? code.trim() : "";
  const normalizedMessage = typeof message === "string" ? message.toLowerCase() : "";
  const normalizedStep = typeof step === "string" ? step.toLowerCase() : "";

  if (status === 401) return "AUTH_FAILED";
  if (status === 403) return "PERMISSION_DENIED";
  if (normalizedCode === "missingRequiredPermissions") return "INVALID_SCOPE";
  if (normalizedCode === "InvalidBoardIdException" || normalizedMessage.includes("board id")) return "INVALID_BOARD";
  if (normalizedCode === "ResourceNotFoundException" || normalizedMessage.includes("not found")) return "INVALID_BOARD";
  if (normalizedStep === "create_item" && normalizedMessage.includes("column")) return "VALIDATION_FAILED";
  return "UNKNOWN_PROVIDER_ERROR";
}

async function mondayGraphqlRequest<T>({
  accessToken,
  query,
  variables,
  step,
}: {
  accessToken: string;
  query: string;
  variables?: Record<string, unknown>;
  step: string;
}) {
  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      ...(variables ? { variables } : {}),
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as MondayGraphQlResponse<T>;
  const firstError = Array.isArray(payload.errors) ? payload.errors[0] : null;
  const code = typeof firstError?.extensions?.code === "string" ? firstError.extensions.code : null;
  const message = typeof firstError?.message === "string" ? firstError.message : null;

  if (!response.ok || firstError) {
    throw createMondayProviderError(
      message || `Monday ${step} failed.`,
      {
        status: response.status,
        category: response.ok ? "graphql" : "http",
        code,
        step,
        safeCategory: classifyMondayError({
          status: response.status,
          code,
          message,
          step,
        }),
      },
    );
  }

  return payload.data as T;
}

export function buildMondayAuthorizationUrl(state: string, redirectUriOverride?: string | null) {
  const url = new URL("https://auth.monday.com/oauth2/authorize");
  url.searchParams.set("client_id", getRequiredClientId());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", resolveRedirectUri(redirectUriOverride));
  url.searchParams.set("scope", getRequiredScopes());
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeMondayCodeForTokens(code: string, redirectUriOverride?: string | null) {
  const response = await fetch("https://auth.monday.com/oauth2/token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: getRequiredClientId(),
      client_secret: getRequiredClientSecret(),
      code,
      redirect_uri: resolveRedirectUri(redirectUriOverride),
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as MondayOAuthTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw createMondayProviderError(
      payload.error_description || payload.error || "Monday token exchange failed.",
      {
        status: response.status,
        category: "http",
        code: payload.error || null,
        step: "token_exchange",
        safeCategory: classifyMondayError({
          status: response.status,
          code: payload.error || null,
          message: payload.error_description || payload.error || null,
          step: "token_exchange",
        }),
      },
    );
  }

  if (!payload.access_token) {
    throw new Error("Monday did not return an access token.");
  }

  return payload;
}

export function getMondayTokenMetadata(token: MondayOAuthTokenResponse) {
  return {
    tokenType: token.token_type || "Bearer",
    scopes: getScopeList(token.scope),
  };
}

export async function getMondayMe(accessToken: string) {
  const data = await mondayGraphqlRequest<MondayMeResponse>({
    accessToken,
    step: "me_query",
    query: `
      query {
        me {
          id
          name
          email
        }
      }
    `,
  });

  return {
    id: data.me?.id != null ? String(data.me.id) : null,
    name: typeof data.me?.name === "string" ? data.me.name : null,
    email: typeof data.me?.email === "string" ? data.me.email : null,
  };
}

export async function listMondayBoards({
  accessToken,
  limit = 25,
}: {
  accessToken: string;
  limit?: number;
}): Promise<MondayBoardOption[]> {
  const data = await mondayGraphqlRequest<MondayBoardsResponse>({
    accessToken,
    step: "boards_query",
    query: `
      query ($limit: Int!) {
        boards(limit: $limit) {
          id
          name
          board_kind
          workspace {
            id
            name
          }
        }
      }
    `,
    variables: { limit },
  });

  return Array.isArray(data.boards)
    ? data.boards.map((board) => ({
        id: board.id != null ? String(board.id) : "",
        name: typeof board.name === "string" ? board.name : "Untitled board",
        workspaceId: board.workspace?.id != null ? String(board.workspace.id) : null,
        workspaceName: typeof board.workspace?.name === "string" ? board.workspace.name : null,
        kind: typeof board.board_kind === "string" ? board.board_kind : null,
      })).filter((board) => Boolean(board.id))
    : [];
}

export async function getMondayBoard({
  accessToken,
  boardId,
}: {
  accessToken: string;
  boardId: string;
}) {
  const data = await mondayGraphqlRequest<MondayBoardsResponse>({
    accessToken,
    step: "board_lookup",
    query: `
      query ($boardId: [ID!]) {
        boards(ids: $boardId) {
          id
          name
          board_kind
          workspace {
            id
            name
          }
        }
      }
    `,
    variables: { boardId: [boardId] },
  });

  const board = Array.isArray(data.boards) ? data.boards[0] : null;
  if (!board?.id) {
    throw createMondayProviderError("Monday board not found.", {
      status: 404,
      category: "graphql",
      code: "ResourceNotFoundException",
      step: "board_lookup",
      safeCategory: "INVALID_BOARD",
    });
  }

  return {
    id: String(board.id),
    name: typeof board.name === "string" ? board.name : null,
    workspaceId: board.workspace?.id != null ? String(board.workspace.id) : null,
    workspaceName: typeof board.workspace?.name === "string" ? board.workspace.name : null,
    kind: typeof board.board_kind === "string" ? board.board_kind : null,
  };
}

export async function createMondayTestLeadItem({
  accessToken,
  boardId,
}: {
  accessToken: string;
  boardId: string;
}) {
  const idempotencyKey = randomUUID();
  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      query: `
        mutation ($boardId: ID!, $itemName: String!) {
          create_item(board_id: $boardId, item_name: $itemName) {
            id
            name
            board {
              id
            }
          }
        }
      `,
      variables: {
        boardId,
        itemName: "SideKick Test Lead",
      },
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as MondayGraphQlResponse<MondayCreateItemResponse>;
  const firstError = Array.isArray(payload.errors) ? payload.errors[0] : null;
  const code = typeof firstError?.extensions?.code === "string" ? firstError.extensions.code : null;
  const message = typeof firstError?.message === "string" ? firstError.message : null;

  if (!response.ok || firstError) {
    throw createMondayProviderError(
      message || "Monday item creation failed.",
      {
        status: response.status,
        category: response.ok ? "graphql" : "http",
        code,
        step: "create_item",
        safeCategory: classifyMondayError({
          status: response.status,
          code,
          message,
          step: "create_item",
        }),
      },
    );
  }

  return {
    itemId: payload.data?.create_item?.id != null ? String(payload.data.create_item.id) : null,
    boardId: payload.data?.create_item?.board?.id != null ? String(payload.data.create_item.board.id) : boardId,
    itemName: typeof payload.data?.create_item?.name === "string" ? payload.data.create_item.name : "SideKick Test Lead",
  };
}
