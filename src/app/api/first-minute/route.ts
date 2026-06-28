import { revalidatePath } from "next/cache";
import { WIDER_JOURNEY_WORLD_ID } from "@/server/queries/world-map";
import { createFirstMinuteMap, firstMinuteInput } from "@/server/services/first-minute";
import { resolveCurrentProfileIdFromRequest } from "@/server/services/profiles";

export const runtime = "nodejs";

function revalidateFirstMinutePages() {
  for (const path of ["/", "/adventure-log"]) {
    try {
      revalidatePath(path);
    } catch {
      // Route-handler tests do not provide Next's request cache context.
    }
  }
}

export async function POST(request: Request) {
  try {
    const parsed = firstMinuteInput.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "All three moments are required." }, { status: 400 });
    await createFirstMinuteMap(parsed.data, await resolveCurrentProfileIdFromRequest(request));
    revalidateFirstMinutePages();
    return Response.json({ worldId: WIDER_JOURNEY_WORLD_ID }, { status: 201 });
  } catch {
    return Response.json({ error: "Something went wrong while creating your first map. Please try again." }, { status: 500 });
  }
}
