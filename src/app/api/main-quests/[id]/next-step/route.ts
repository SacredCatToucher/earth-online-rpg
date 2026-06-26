import { createMainQuestNextStep, createMainQuestNextStepInput } from "@/server/services/main-quest";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const parsed = createMainQuestNextStepInput.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Phase title is required." }, { status: 400 });
    return Response.json(await createMainQuestNextStep(id, parsed.data), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Main Quest not found." || message === "Main Quest root journey not found.") {
      return Response.json({ error: message }, { status: 404 });
    }
    if (message === "Only active Main Quests can add next steps.") {
      return Response.json({ error: message }, { status: 400 });
    }
    return Response.json({ error: "Failed to add next step. Please try again." }, { status: 500 });
  }
}
