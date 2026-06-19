-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "avatarPath" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentExp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExpTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpTransaction_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MainQuestCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MainQuest" (
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
    CONSTRAINT "MainQuest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MainQuestCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyQuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "expReward" INTEGER NOT NULL DEFAULT 0,
    "daysOfWeek" TEXT NOT NULL,
    "resetTime" TEXT NOT NULL DEFAULT '00:00',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Taipei',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyQuestCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyQuestId" TEXT NOT NULL,
    "questDate" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expAwarded" INTEGER NOT NULL,
    CONSTRAINT "DailyQuestCompletion_dailyQuestId_fkey" FOREIGN KEY ("dailyQuestId") REFERENCES "DailyQuest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentExp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SkillRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "recordDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillRecord_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdventureLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "eventDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expEarned" INTEGER NOT NULL DEFAULT 0,
    "origin" TEXT NOT NULL DEFAULT 'SYSTEM',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "mainQuestId" TEXT,
    "locationId" TEXT,
    "skillId" TEXT,
    "achievementId" TEXT,
    "rewardId" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdventureLog_mainQuestId_fkey" FOREIGN KEY ("mainQuestId") REFERENCES "MainQuest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "MapLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_eventType_check" CHECK ("eventType" IN ('QUEST_COMPLETED', 'ACHIEVEMENT_EARNED', 'REWARD_UNLOCKED', 'LEVEL_UP', 'LOCATION_CREATED', 'SKILL_MILESTONE', 'MANUAL_JOURNAL_ENTRY'))
);

-- CreateTable
CREATE TABLE "MapLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mainQuestId" TEXT,
    "title" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "positionX" INTEGER NOT NULL DEFAULT 0,
    "positionY" INTEGER NOT NULL DEFAULT 0,
    "locationType" TEXT NOT NULL DEFAULT 'MILESTONE',
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MapLocation_mainQuestId_fkey" FOREIGN KEY ("mainQuestId") REFERENCES "MainQuest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MapEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "label" TEXT,
    CONSTRAINT "MapEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MapLocation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MapEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "MapLocation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MapEdge_no_self_check" CHECK ("sourceId" <> "targetId")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedDate" DATETIME,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mainQuestId" TEXT,
    "conditionType" TEXT NOT NULL,
    "conditionSourceId" TEXT,
    "targetCount" INTEGER,
    "rewardDescription" TEXT NOT NULL,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reward_mainQuestId_fkey" FOREIGN KEY ("mainQuestId") REFERENCES "MainQuest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "dueDate" DATETIME,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storageName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "mainQuestId" TEXT,
    "dailyQuestId" TEXT,
    "skillId" TEXT,
    "achievementId" TEXT,
    "adventureLogId" TEXT,
    "mapLocationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_mainQuestId_fkey" FOREIGN KEY ("mainQuestId") REFERENCES "MainQuest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_dailyQuestId_fkey" FOREIGN KEY ("dailyQuestId") REFERENCES "DailyQuest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_adventureLogId_fkey" FOREIGN KEY ("adventureLogId") REFERENCES "AdventureLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_mapLocationId_fkey" FOREIGN KEY ("mapLocationId") REFERENCES "MapLocation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_one_owner_check" CHECK (
      ("mainQuestId" IS NOT NULL) + ("dailyQuestId" IS NOT NULL) +
      ("skillId" IS NOT NULL) + ("achievementId" IS NOT NULL) +
      ("adventureLogId" IS NOT NULL) + ("mapLocationId" IS NOT NULL) = 1
    )
);

-- CreateIndex
CREATE INDEX "ExpTransaction_characterId_createdAt_idx" ON "ExpTransaction"("characterId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExpTransaction_sourceType_sourceId_key" ON "ExpTransaction"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "MainQuestCategory_title_key" ON "MainQuestCategory"("title");

-- CreateIndex
CREATE INDEX "MainQuest_categoryId_status_idx" ON "MainQuest"("categoryId", "status");

-- Enforce one active, non-deleted Main Quest within each category.
CREATE UNIQUE INDEX "MainQuest_one_active_per_category_key"
ON "MainQuest"("categoryId") WHERE "status" = 'ACTIVE' AND "deletedAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestCompletion_dailyQuestId_questDate_key" ON "DailyQuestCompletion"("dailyQuestId", "questDate");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_title_key" ON "Skill"("title");

-- CreateIndex
CREATE INDEX "AdventureLog_eventDate_idx" ON "AdventureLog"("eventDate");

-- CreateIndex
CREATE INDEX "AdventureLog_eventType_eventDate_idx" ON "AdventureLog"("eventType", "eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "MapEdge_sourceId_targetId_key" ON "MapEdge"("sourceId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_storageName_key" ON "Attachment"("storageName");
