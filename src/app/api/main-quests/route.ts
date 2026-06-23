import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createMainQuest, createMainQuestInput } from "@/server/services/main-quest";

export const runtime = "nodejs";

const serviceErrors = new Map<string, number>([
  ["Main Quest category not found.", 404],
  ["Root Adventure Log entry not found.", 404],
  ["This category already has an active Main Quest.", 409],
  ["This Adventure Log root already belongs to a Main Quest.", 409],
  ["The selected Adventure Log tree already belongs to another Main Quest.", 409],
  ["A Main Quest root must be a root Adventure Log entry.", 400],
]);

function revalidateQuestDataPages() {
  for (const path of ["/", "/main-quests", "/adventure-log"]) {
    try {
      revalidatePath(path);
    } catch {
      // Route-handler tests do not provide Next's request cache context.
    }
  }
}

export async function GET() {
  try {
    const quests = await db.mainQuest.findMany({
      where: { deletedAt: null },
      include: { category: true, rootAdventureLog: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { createdAt: "desc" }],
    });
    return Response.json(quests);
  } catch {
    return Response.json({ error: "Main Quests could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = createMainQuestInput.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Invalid Main Quest input." }, { status: 400 });
    const quest = await createMainQuest(parsed.data);
    revalidateQuestDataPages();
    return Response.json(quest, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = serviceErrors.get(message);
    if (status) return Response.json({ error: message }, { status });
    return Response.json({ error: "Main Quest could not be created." }, { status: 500 });
  }
}
