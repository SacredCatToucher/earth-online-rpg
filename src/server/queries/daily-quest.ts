import { db } from "@/lib/db";

export async function listDailyQuests() {
  return db.dailyQuest.findMany({
    orderBy: [{ isActive: "desc" }, { title: "asc" }, { createdAt: "asc" }],
  });
}
