import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentProfileCharacter } from "@/server/services/character";
import { resolveCurrentProfileIdFromRequest } from "@/server/services/profiles";

const characterInput = z.object({ name: z.string().trim().min(1).max(40) });

export async function GET(request: Request) {
  const profileId = await resolveCurrentProfileIdFromRequest(request);
  if (!profileId) return Response.json({ error: "Profile not found." }, { status: 409 });
  return Response.json(await getCurrentProfileCharacter(profileId));
}

export async function POST(request: Request) {
  const profileId = await resolveCurrentProfileIdFromRequest(request);
  if (!profileId) return Response.json({ error: "Profile not found." }, { status: 409 });
  const parsed = characterInput.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a name between 1 and 40 characters." }, { status: 400 });
  if (await db.character.findUnique({ where: { profileId } })) return Response.json({ error: "This world already has a character." }, { status: 409 });
  return Response.json(await db.character.create({ data: { profileId, name: parsed.data.name } }), { status: 201 });
}

export async function PATCH(request: Request) {
  const profileId = await resolveCurrentProfileIdFromRequest(request);
  if (!profileId) return Response.json({ error: "Profile not found." }, { status: 409 });
  const parsed = characterInput.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a name between 1 and 40 characters." }, { status: 400 });
  const character = await db.character.findUnique({ where: { profileId } });
  if (!character) return Response.json({ error: "Character not found." }, { status: 404 });
  return Response.json(await db.character.update({ where: { id: character.id }, data: parsed.data }));
}
