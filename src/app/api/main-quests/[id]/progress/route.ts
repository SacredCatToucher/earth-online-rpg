import { updateMainQuestProgress, updateMainQuestProgressInput } from "@/server/services/main-quest";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const parsed = updateMainQuestProgressInput.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Current progress must be a non-negative integer." }, { status: 400 });
    return Response.json(await updateMainQuestProgress(id, parsed.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Main Quest not found.") return Response.json({ error: message }, { status: 404 });
    if (message === "Current progress cannot exceed the target.") return Response.json({ error: message }, { status: 400 });
    return Response.json({ error: "Main Quest progress could not be updated." }, { status: 500 });
  }
}
