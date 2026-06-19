-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdventureLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "eventDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "expEarned" INTEGER NOT NULL DEFAULT 0,
    "origin" TEXT NOT NULL DEFAULT 'SYSTEM',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "mainQuestId" TEXT,
    "locationId" TEXT,
    "skillId" TEXT,
    "achievementId" TEXT,
    "rewardId" TEXT,
    "parentId" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdventureLog_mainQuestId_fkey" FOREIGN KEY ("mainQuestId") REFERENCES "MainQuest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AdventureLog" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "MapLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_eventType_check" CHECK ("eventType" IN ('QUEST_COMPLETED', 'ACHIEVEMENT_EARNED', 'REWARD_UNLOCKED', 'LEVEL_UP', 'LOCATION_CREATED', 'SKILL_MILESTONE', 'MANUAL_JOURNAL_ENTRY')),
    CONSTRAINT "AdventureLog_status_check" CHECK ("status" IN ('ONGOING', 'COMPLETED')),
    CONSTRAINT "AdventureLog_no_self_parent_check" CHECK ("parentId" IS NULL OR "parentId" <> "id"),
    CONSTRAINT "AdventureLog_date_order_check" CHECK ("endDate" IS NULL OR "endDate" >= "startDate")
);
INSERT INTO "new_AdventureLog" ("achievementId", "createdAt", "deletedAt", "description", "eventDate", "startDate", "endDate", "status", "eventType", "expEarned", "id", "locationId", "mainQuestId", "origin", "rewardId", "skillId", "sourceId", "sourceType", "title", "updatedAt") SELECT "achievementId", "createdAt", "deletedAt", "description", "eventDate", "eventDate", "eventDate", 'COMPLETED', "eventType", "expEarned", "id", "locationId", "mainQuestId", "origin", "rewardId", "skillId", "sourceId", "sourceType", "title", "updatedAt" FROM "AdventureLog";
DROP TABLE "AdventureLog";
ALTER TABLE "new_AdventureLog" RENAME TO "AdventureLog";
CREATE INDEX "AdventureLog_eventDate_idx" ON "AdventureLog"("eventDate");
CREATE INDEX "AdventureLog_eventType_eventDate_idx" ON "AdventureLog"("eventType", "eventDate");
CREATE INDEX "AdventureLog_deletedAt_eventDate_idx" ON "AdventureLog"("deletedAt", "eventDate");
CREATE INDEX "AdventureLog_deletedAt_startDate_idx" ON "AdventureLog"("deletedAt", "startDate");
CREATE INDEX "AdventureLog_parentId_startDate_idx" ON "AdventureLog"("parentId", "startDate");
CREATE TABLE "new_MainQuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "progressType" TEXT NOT NULL,
    "targetValue" INTEGER NOT NULL DEFAULT 100,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '%',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" DATETIME,
    "completedDate" DATETIME,
    "expReward" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "rootAdventureLogId" TEXT,
    CONSTRAINT "MainQuest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MainQuestCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MainQuest_rootAdventureLogId_fkey" FOREIGN KEY ("rootAdventureLogId") REFERENCES "AdventureLog" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MainQuest" ("categoryId", "completedDate", "createdAt", "currentValue", "deletedAt", "description", "expReward", "id", "progressType", "startDate", "status", "targetValue", "title", "unit", "updatedAt") SELECT "categoryId", "completedDate", "createdAt", "currentValue", "deletedAt", "description", "expReward", "id", "progressType", "startDate", "status", "targetValue", "title", "unit", "updatedAt" FROM "MainQuest";
DROP TABLE "MainQuest";
ALTER TABLE "new_MainQuest" RENAME TO "MainQuest";
CREATE UNIQUE INDEX "MainQuest_rootAdventureLogId_key" ON "MainQuest"("rootAdventureLogId");
CREATE INDEX "MainQuest_categoryId_status_idx" ON "MainQuest"("categoryId", "status");
CREATE UNIQUE INDEX "MainQuest_one_active_per_category_key" ON "MainQuest"("categoryId") WHERE "status" = 'ACTIVE' AND "deletedAt" IS NULL;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
