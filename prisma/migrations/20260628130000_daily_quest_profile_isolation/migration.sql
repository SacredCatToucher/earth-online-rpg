PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

INSERT INTO "Profile" ("id", "name", "isDefault", "createdAt", "updatedAt")
SELECT 'default-profile', 'Default Profile', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Profile");

UPDATE "Profile"
SET "isDefault" = true
WHERE "id" = (
    SELECT "id"
    FROM "Profile"
    ORDER BY "isDefault" DESC, "createdAt" ASC, "name" ASC
    LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM "Profile" WHERE "isDefault" = true);

CREATE TABLE "new_DailyQuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "expReward" INTEGER NOT NULL DEFAULT 0,
    "daysOfWeek" TEXT NOT NULL,
    "resetTime" TEXT NOT NULL DEFAULT '00:00',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Taipei',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contributionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weeklyTargetAmount" REAL,
    "contributionUnit" TEXT,
    "defaultContributionAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyQuest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_DailyQuest" (
    "id", "profileId", "title", "description", "expReward", "daysOfWeek", "resetTime", "timezone",
    "isActive", "contributionEnabled", "weeklyTargetAmount", "contributionUnit", "defaultContributionAmount",
    "createdAt", "updatedAt"
)
SELECT
    "id",
    (SELECT "id" FROM "Profile" ORDER BY "isDefault" DESC, "createdAt" ASC, "name" ASC LIMIT 1),
    "title", "description", "expReward", "daysOfWeek", "resetTime", "timezone",
    "isActive", "contributionEnabled", "weeklyTargetAmount", "contributionUnit", "defaultContributionAmount",
    "createdAt", "updatedAt"
FROM "DailyQuest";

CREATE TABLE "new_DailyQuestCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "dailyQuestId" TEXT NOT NULL,
    "questDate" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expAwarded" INTEGER NOT NULL,
    "contributionAmount" REAL,
    CONSTRAINT "DailyQuestCompletion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyQuestCompletion_dailyQuestId_fkey" FOREIGN KEY ("dailyQuestId") REFERENCES "DailyQuest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_DailyQuestCompletion" (
    "id", "profileId", "dailyQuestId", "questDate", "completedAt", "expAwarded", "contributionAmount"
)
SELECT
    "DailyQuestCompletion"."id",
    COALESCE(
        (SELECT "profileId" FROM "new_DailyQuest" WHERE "new_DailyQuest"."id" = "DailyQuestCompletion"."dailyQuestId"),
        (SELECT "id" FROM "Profile" ORDER BY "isDefault" DESC, "createdAt" ASC, "name" ASC LIMIT 1)
    ),
    "dailyQuestId", "questDate", "completedAt", "expAwarded", "contributionAmount"
FROM "DailyQuestCompletion";

DROP TABLE "DailyQuestCompletion";
DROP TABLE "DailyQuest";

ALTER TABLE "new_DailyQuest" RENAME TO "DailyQuest";
ALTER TABLE "new_DailyQuestCompletion" RENAME TO "DailyQuestCompletion";

CREATE INDEX "DailyQuest_profileId_isActive_title_idx" ON "DailyQuest"("profileId", "isActive", "title");
CREATE UNIQUE INDEX "DailyQuestCompletion_profileId_dailyQuestId_questDate_key" ON "DailyQuestCompletion"("profileId", "dailyQuestId", "questDate");
CREATE INDEX "DailyQuestCompletion_dailyQuestId_questDate_idx" ON "DailyQuestCompletion"("dailyQuestId", "questDate");
CREATE INDEX "DailyQuestCompletion_profileId_dailyQuestId_questDate_idx" ON "DailyQuestCompletion"("profileId", "dailyQuestId", "questDate");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
