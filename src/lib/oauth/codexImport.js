function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function extractCodexAccountInfo(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return {};
  const chatgpt = payload["https://api.openai.com/auth"] || {};
  return {
    email: payload.email,
    chatgptAccountId: chatgpt.chatgpt_account_id || payload.account_id,
    chatgptPlanType: chatgpt.chatgpt_plan_type || payload.plan_type,
  };
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function pickEmail(account, credentials = {}, extra = {}) {
  return credentials.email || extra.email || account.email || account.name || null;
}

function compactObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

export function parseCodexImportPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (isPlainObject(payload) && Array.isArray(payload.accounts)) return payload.accounts;
  if (isPlainObject(payload) && Array.isArray(payload.providerConnections)) return payload.providerConnections;
  throw new Error("Unsupported import file format");
}

export function mapCodexImportAccount(account, now = new Date().toISOString()) {
  if (!isPlainObject(account)) {
    throw new Error("Invalid account entry");
  }

  // Native 9Router export shape: provider/authType plus token fields at top level.
  if (account.provider === "codex" && (account.authType === "oauth" || account.authType === "access_token")) {
    const authType = account.authType || "oauth";
    const email = account.email || account.name || null;
    if (!account.accessToken && !account.refreshToken && !account.apiKey) {
      throw new Error(`Missing token for ${email || "Codex account"}`);
    }
    return {
      provider: "codex",
      authType,
      name: account.name || email || "Codex Account",
      email,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      expiresAt: account.expiresAt,
      expiresIn: account.expiresIn,
      tokenType: account.tokenType,
      scope: account.scope,
      isActive: account.isActive !== false,
      priority: account.priority,
      testStatus: account.testStatus || "unknown",
      providerSpecificData: compactObject({
        ...(account.providerSpecificData || {}),
        importedAt: now,
        importSource: "9router-import",
      }),
    };
  }

  // sub2api ChatGPT/OpenAI OAuth export shape.
  const credentials = isPlainObject(account.credentials) ? account.credentials : {};
  const extra = isPlainObject(account.extra) ? account.extra : {};
  const platform = account.platform;
  const type = account.type;

  if (platform !== "openai" || type !== "oauth") {
    throw new Error(`Unsupported account type: ${platform || "unknown"}/${type || "unknown"}`);
  }

  const accessToken = credentials.access_token;
  const refreshToken = credentials.refresh_token;
  if (!accessToken && !refreshToken) {
    throw new Error(`Missing token for ${account.name || "OpenAI OAuth account"}`);
  }

  const tokenInfo = extractCodexAccountInfo(credentials.id_token || accessToken) || {};
  const email = pickEmail(account, credentials, extra) || tokenInfo.email;
  const planType = credentials.plan_type || tokenInfo.chatgptPlanType;
  const chatgptAccountId = credentials.chatgpt_account_id || tokenInfo.chatgptAccountId;

  return {
    provider: "codex",
    authType: "oauth",
    name: account.name || email || "Codex OAuth Account",
    email,
    accessToken,
    refreshToken,
    expiresAt: credentials.expires_at,
    expiresIn: credentials.expires_in,
    isActive: true,
    priority: account.priority,
    testStatus: "unknown",
    providerSpecificData: compactObject({
      chatgptAccountId,
      chatgptUserId: credentials.chatgpt_user_id,
      chatgptPlanType: planType,
      subscriptionExpiresAt: credentials.subscription_expires_at,
      clientId: credentials.client_id,
      sub2apiPlatform: platform,
      sub2apiType: type,
      sub2apiConcurrency: account.concurrency,
      source: extra.source || "sub2api-import",
      lastRefresh: extra.last_refresh,
      importedAt: now,
      importSource: "sub2api",
    }),
  };
}

export function mapCodexImportPayload(payload, now = new Date().toISOString()) {
  const accounts = parseCodexImportPayload(payload);
  const connections = [];
  const errors = [];

  accounts.forEach((account, index) => {
    try {
      connections.push(mapCodexImportAccount(account, now));
    } catch (error) {
      errors.push({ index, error: error.message });
    }
  });

  return { connections, errors, total: accounts.length };
}
