import { z } from "zod";
import { db } from "@/lib/db";

const characterInput = z.object({ name: z.string().trim().min(1).max(40) });

export async function GET() {
  return Response.json(await db.character.findFirst({ orderBy: { createdAt: "asc" } }));
}

export async function POST(request: Request) {
  const parsed = characterInput.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a name between 1 and 40 characters." }, { status: 400 });
  if (await db.character.count()) return Response.json({ error: "This world already has a character." }, { status: 409 });
  return Response.json(await db.character.create({ data: parsed.data }), { status: 201 });
}

export async function PATCH(request: Request) {
  const parsed = characterInput.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a name between 1 and 40 characters." }, { status: 400 });
  const character = await db.character.findFirst();
  if (!character) return Response.json({ error: "Character not found." }, { status: 404 });
  return Response.json(await db.character.update({ where: { id: character.id }, data: parsed.data }));
}
