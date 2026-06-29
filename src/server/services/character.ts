import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ensureDefaultProfile, requireCurrentProfileId } from "@/server/services/profiles";

type CharacterClient = Prisma.TransactionClient | typeof db;

export async function ensureCharacterForProfile(profileId: string, client: CharacterClient = db) {
  const existing = await client.character.findUnique({ where: { profileId } });
  if (existing) return existing;

  const profile = await client.profile.findUnique({ where: { id: profileId }, select: { id: true, name: true } });
  if (!profile) throw new Error("Profile not found.");

  return client.character.create({
    data: {
      profileId: profile.id,
      name: profile.name,
    },
  });
}

export async function ensureDefaultProfileCharacter(client: CharacterClient = db) {
  const profile = await ensureDefaultProfile(client);
  return ensureCharacterForProfile(profile.id, client);
}

export async function getCurrentProfileCharacter(profileId?: string | null, client: CharacterClient = db) {
  const currentProfileId = await requireCurrentProfileId(profileId, client);
  return ensureCharacterForProfile(currentProfileId, client);
}
