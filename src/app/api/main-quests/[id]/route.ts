import { db } from "@/lib/db";
import { resolveCurrentProfileIdFromRequest } from "@/server/services/profiles";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const profileId = await resolveCurrentProfileIdFromRequest(request);
    if (!profileId) return Response.json({ error: "Main Quest not found." }, { status: 404 });
    const quest = await db.mainQuest.findFirst({
      where: { id, profileId, deletedAt: null },
      include: {
        category: true,
        rootAdventureLog: true,
        logs: { where: { deletedAt: null }, orderBy: [{ startDate: "asc" }, { createdAt: "asc" }] },
      },
    });
    return quest ? Response.json(quest) : Response.json({ error: "Main Quest not found." }, { status: 404 });
  } catch {
    return Response.json({ error: "Main Quest could not be loaded." }, { status: 500 });
  }
}
