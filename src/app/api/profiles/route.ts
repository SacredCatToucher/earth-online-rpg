import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { profileNameMaxLength } from "@/lib/profiles";

const profileErrors = {
  nameInvalid: "PROFILE_NAME_INVALID",
  nameDuplicate: "PROFILE_NAME_DUPLICATE",
  createFailed: "PROFILE_CREATE_FAILED",
} as const;

const profileInput = z.object({
  name: z.string().trim().min(1).max(profileNameMaxLength),
});

export async function GET() {
  const profiles = await db.profile.findMany({ orderBy: [{ createdAt: "asc" }, { name: "asc" }] });
  return Response.json({ profiles });
}

export async function POST(request: Request) {
  const parsed = profileInput.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ errorCode: profileErrors.nameInvalid }, { status: 400 });
  }

  try {
    const profile = await db.$transaction(async (tx) => {
      const isFirstProfile = (await tx.profile.count()) === 0;
      return tx.profile.create({
        data: {
          name: parsed.data.name,
          isDefault: isFirstProfile,
          character: { create: { name: parsed.data.name } },
        },
      });
    });
    return Response.json(profile, { status: 201 });
  } catch (error) {
    const errorCode = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
      ? profileErrors.nameDuplicate
      : profileErrors.createFailed;
    return Response.json({ errorCode }, { status: errorCode === profileErrors.nameDuplicate ? 409 : 500 });
  }
}
