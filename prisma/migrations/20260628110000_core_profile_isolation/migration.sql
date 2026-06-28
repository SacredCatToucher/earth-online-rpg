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

CREATE TABLE "new_MainQuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
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
    CONSTRAINT "MainQuest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MainQuest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MainQuestCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MainQuest_rootAdventureLogId_fkey" FOREIGN KEY ("rootAdventureLogId") REFERENCES "AdventureLog" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_MainQuest" (
    "id", "profileId", "categoryId", "title", "description", "progressType", "targetValue", "currentValue",
    "unit", "status", "startDate", "completedDate", "expReward", "deletedAt", "createdAt", "updatedAt", "rootAdventureLogId"
)
SELECT
    "id",
    (SELECT "id" FROM "Profile" ORDER BY "isDefault" DESC, "createdAt" ASC, "name" ASC LIMIT 1),
    "categoryId", "title", "description", "progressType", "targetValue", "currentValue",
    "unit", "status", "startDate", "completedDate", "expReward", "deletedAt", "createdAt", "updatedAt", "rootAdventureLogId"
FROM "MainQuest";

CREATE TABLE "new_MapLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
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
    CONSTRAINT "MapLocation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MapLocation_mainQuestId_fkey" FOREIGN KEY ("mainQuestId") REFERENCES "MainQuest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_MapLocation" (
    "id", "profileId", "mainQuestId", "title", "eventDate", "description", "notes",
    "positionX", "positionY", "locationType", "deletedAt", "createdAt", "updatedAt"
)
SELECT
    "id",
    (SELECT "id" FROM "Profile" ORDER BY "isDefault" DESC, "createdAt" ASC, "name" ASC LIMIT 1),
    "mainQuestId", "title", "eventDate", "description", "notes",
    "positionX", "positionY", "locationType", "deletedAt", "createdAt", "updatedAt"
FROM "MapLocation";

CREATE TABLE "new_AdventureLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
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
    CONSTRAINT "AdventureLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_mainQuestId_fkey" FOREIGN KEY ("mainQuestId") REFERENCES "MainQuest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AdventureLog" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "MapLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdventureLog_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_AdventureLog" (
    "id", "profileId", "eventType", "title", "description", "eventDate", "startDate", "endDate",
    "status", "expEarned", "origin", "sourceType", "sourceId", "mainQuestId", "locationId",
    "skillId", "achievementId", "rewardId", "parentId", "deletedAt", "createdAt", "updatedAt"
)
SELECT
    "id",
    COALESCE(
        (SELECT "profileId" FROM "new_MainQuest" WHERE "new_MainQuest"."id" = "AdventureLog"."mainQuestId"),
        (SELECT "profileId" FROM "new_MapLocation" WHERE "new_MapLocation"."id" = "AdventureLog"."locationId"),
        (SELECT "id" FROM "Profile" ORDER BY "isDefault" DESC, "createdAt" ASC, "name" ASC LIMIT 1)
    ),
    "eventType", "title", "description", "eventDate", "startDate", "endDate",
    "status", "expEarned", "origin", "sourceType", "sourceId", "mainQuestId", "locationId",
    "skillId", "achievementId", "rewardId", "parentId", "deletedAt", "createdAt", "updatedAt"
FROM "AdventureLog";

DROP TABLE "AdventureLog";
DROP TABLE "MapLocation";
DROP TABLE "MainQuest";

ALTER TABLE "new_MainQuest" RENAME TO "MainQuest";
ALTER TABLE "new_MapLocation" RENAME TO "MapLocation";
ALTER TABLE "new_AdventureLog" RENAME TO "AdventureLog";

CREATE UNIQUE INDEX "MainQuest_rootAdventureLogId_key" ON "MainQuest"("rootAdventureLogId");
CREATE INDEX "MainQuest_categoryId_status_idx" ON "MainQuest"("categoryId", "status");
CREATE INDEX "MainQuest_profileId_categoryId_status_idx" ON "MainQuest"("profileId", "categoryId", "status");
CREATE UNIQUE INDEX "MainQuest_one_active_per_profile_category_key"
ON "MainQuest"("profileId", "categoryId") WHERE "status" = 'ACTIVE' AND "deletedAt" IS NULL;

CREATE INDEX "MapLocation_profileId_deletedAt_eventDate_idx" ON "MapLocation"("profileId", "deletedAt", "eventDate");

CREATE INDEX "AdventureLog_profileId_deletedAt_startDate_idx" ON "AdventureLog"("profileId", "deletedAt", "startDate");
CREATE INDEX "AdventureLog_eventDate_idx" ON "AdventureLog"("eventDate");
CREATE INDEX "AdventureLog_eventType_eventDate_idx" ON "AdventureLog"("eventType", "eventDate");
CREATE INDEX "AdventureLog_deletedAt_eventDate_idx" ON "AdventureLog"("deletedAt", "eventDate");
CREATE INDEX "AdventureLog_deletedAt_startDate_idx" ON "AdventureLog"("deletedAt", "startDate");
CREATE INDEX "AdventureLog_parentId_startDate_idx" ON "AdventureLog"("parentId", "startDate");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
