import { NextResponse } from "next/server";
import { createProviderConnection } from "@/models";
import { mapCodexImportPayload } from "@/lib/oauth/codexImport";

export const dynamic = "force-dynamic";

function sanitizeConnection(connection) {
  return {
    id: connection.id,
    provider: connection.provider,
    authType: connection.authType,
    name: connection.name,
    email: connection.email,
    priority: connection.priority,
    isActive: connection.isActive,
    testStatus: connection.testStatus,
    providerSpecificData: {
      chatgptAccountId: connection.providerSpecificData?.chatgptAccountId,
      chatgptPlanType: connection.providerSpecificData?.chatgptPlanType,
      importSource: connection.providerSpecificData?.importSource,
    },
  };
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const mapped = mapCodexImportPayload(payload);

    if (mapped.connections.length === 0) {
      return NextResponse.json(
        { error: "No valid Codex accounts found", errors: mapped.errors, total: mapped.total },
        { status: 400 }
      );
    }

    const imported = [];
    const errors = [...mapped.errors];

    for (const connectionData of mapped.connections) {
      try {
        const connection = await createProviderConnection(connectionData);
        imported.push(sanitizeConnection(connection));
      } catch (error) {
        errors.push({ email: connectionData.email, error: error.message });
      }
    }

    const status = imported.length > 0 ? 200 : 400;
    return NextResponse.json({
      success: imported.length > 0,
      total: mapped.total,
      imported: imported.length,
      skipped: errors.length,
      connections: imported,
      errors,
    }, { status });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to import Codex accounts" }, { status: 400 });
  }
}
