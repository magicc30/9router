import { describe, it, expect } from "vitest";
import { mapCodexImportPayload } from "../../src/lib/oauth/codexImport.js";

describe("Codex account import mapping", () => {
  it("maps sub2api OpenAI OAuth export to Codex OAuth connection", () => {
    const payload = {
      exported_at: "2026-06-02T00:00:00.000Z",
      accounts: [
        {
          name: "user@example.com",
          platform: "openai",
          type: "oauth",
          concurrency: 10,
          priority: 3,
          credentials: {
            access_token: "access-token",
            refresh_token: "refresh-token",
            id_token: "id-token",
            expires_at: "2026-06-03T00:00:00.000Z",
            email: "user@example.com",
            chatgpt_account_id: "account-1",
            chatgpt_user_id: "user-1",
            plan_type: "plus",
            subscription_expires_at: "2026-07-01T00:00:00.000Z",
          },
        },
      ],
    };

    const result = mapCodexImportPayload(payload, "2026-06-02T01:00:00.000Z");

    expect(result.errors).toEqual([]);
    expect(result.total).toBe(1);
    expect(result.connections).toHaveLength(1);
    expect(result.connections[0]).toMatchObject({
      provider: "codex",
      authType: "oauth",
      name: "user@example.com",
      email: "user@example.com",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: "2026-06-03T00:00:00.000Z",
      priority: 3,
      isActive: true,
      testStatus: "unknown",
      providerSpecificData: {
        chatgptAccountId: "account-1",
        chatgptUserId: "user-1",
        chatgptPlanType: "plus",
        sub2apiPlatform: "openai",
        sub2apiType: "oauth",
        sub2apiConcurrency: 10,
        importedAt: "2026-06-02T01:00:00.000Z",
        importSource: "sub2api",
      },
    });
  });

  it("skips unsupported account entries without exposing tokens", () => {
    const result = mapCodexImportPayload({
      accounts: [
        { platform: "anthropic", type: "oauth", credentials: { access_token: "secret" } },
      ],
    });

    expect(result.connections).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain("Unsupported account type");
    expect(JSON.stringify(result.errors)).not.toContain("secret");
  });
});
