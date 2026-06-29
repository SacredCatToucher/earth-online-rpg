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

CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT,
    "name" TEXT NOT NULL,
    "avatarPath" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentExp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Character" (
    "id", "profileId", "name", "avatarPath", "level", "currentExp", "createdAt", "updatedAt"
)
SELECT
    "id",
    CASE
        WHEN "id" = (
            SELECT "id"
            FROM "Character"
            ORDER BY "createdAt" ASC, "id" ASC
            LIMIT 1
        )
        THEN (
            SELECT "id"
            FROM "Profile"
            ORDER BY "isDefault" DESC, "createdAt" ASC, "name" ASC
            LIMIT 1
        )
        ELSE NULL
    END,
    "name",
    "avatarPath",
    "level",
    "currentExp",
    "createdAt",
    "updatedAt"
FROM "Character";

DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";

INSERT INTO "Character" ("id", "profileId", "name", "level", "currentExp", "createdAt", "updatedAt")
SELECT
    'default-character',
    "Profile"."id",
    "Profile"."name",
    1,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Profile"
WHERE "Profile"."id" = (
    SELECT "id"
    FROM "Profile"
    ORDER BY "isDefault" DESC, "createdAt" ASC, "name" ASC
    LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM "Character" WHERE "profileId" = "Profile"."id");

CREATE UNIQUE INDEX "Character_profileId_key" ON "Character"("profileId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
