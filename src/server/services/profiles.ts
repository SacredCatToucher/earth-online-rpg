import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { currentProfileCookieName, defaultProfileName } from "@/lib/profiles";

type ProfileClient = Prisma.TransactionClient | typeof db;

export async function getDefaultProfile(client: ProfileClient = db) {
  return client.profile.findFirst({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }, { name: "asc" }],
  });
}

export async function ensureDefaultProfile(client: ProfileClient = db) {
  const existing = await getDefaultProfile(client);
  if (existing) return existing;
  return client.profile.create({ data: { name: defaultProfileName, isDefault: true } });
}

export async function resolveCurrentProfileId(profileIdFromClient?: string | null, client: ProfileClient = db) {
  const profileId = profileIdFromClient?.trim();
  if (profileId) {
    const profile = await client.profile.findUnique({ where: { id: profileId }, select: { id: true } });
    if (profile) return profile.id;
  }
  return (await getDefaultProfile(client))?.id ?? null;
}

export async function requireCurrentProfileId(profileIdFromClient?: string | null, client: ProfileClient = db) {
  const profileId = await resolveCurrentProfileId(profileIdFromClient, client);
  if (!profileId) throw new Error("Profile not found.");
  return profileId;
}

export async function resolveCurrentProfileIdFromRequest(request: Request) {
  const headerProfileId = request.headers.get("x-rpg-life-profile-id");
  const cookieProfileId = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${currentProfileCookieName}=`))
    ?.slice(currentProfileCookieName.length + 1);
  return resolveCurrentProfileId(headerProfileId ?? (cookieProfileId ? decodeURIComponent(cookieProfileId) : null));
}

export async function resolveCurrentProfileIdFromCookie() {
  const store = await cookies();
  return resolveCurrentProfileId(store.get(currentProfileCookieName)?.value);
}
