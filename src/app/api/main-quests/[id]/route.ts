import { db } from "@/lib/db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const { id } = await context.params;
  try {
    const quest = await db.mainQuest.findFirst({
      where: { id, deletedAt: null },
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
