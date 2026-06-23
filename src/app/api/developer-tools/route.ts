import { revalidatePath } from "next/cache";
import { clearAllLocalData, resetDemoData } from "@/server/services/developer-tools";

export const runtime = "nodejs";

function developerToolsEnabled() {
  return process.env.NODE_ENV !== "production";
}

function revalidateCoreDataPages() {
  for (const path of ["/", "/main-quests", "/adventure-log", "/daily-quests"]) {
    try {
      revalidatePath(path);
    } catch {
      // Route-handler tests do not provide Next's request cache context.
    }
  }
}

export async function POST(request: Request) {
  if (!developerToolsEnabled()) {
    return Response.json(
      { error: "Developer Tools are disabled in production environments." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as { action?: string } | null;

  try {
    if (body?.action === "clear") {
      await clearAllLocalData();
      revalidateCoreDataPages();
      return Response.json({ message: "All local data has been cleared." });
    }
    if (body?.action === "reset-demo") {
      await resetDemoData();
      revalidateCoreDataPages();
      return Response.json({ message: "Demo data has been reset." });
    }
    return Response.json({ error: "Unknown developer tool action." }, { status: 400 });
  } catch {
    const fallback = body?.action === "reset-demo"
      ? "Failed to reset demo data. Please try again."
      : "Failed to clear local data. Please try again.";
    return Response.json({ error: fallback }, { status: 500 });
  }
}
