ALTER TABLE "DailyQuest" ADD COLUMN "contributionEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DailyQuest" ADD COLUMN "weeklyTargetAmount" REAL;
ALTER TABLE "DailyQuest" ADD COLUMN "contributionUnit" TEXT;
ALTER TABLE "DailyQuest" ADD COLUMN "defaultContributionAmount" REAL;
ALTER TABLE "DailyQuestCompletion" ADD COLUMN "contributionAmount" REAL;
CREATE INDEX "DailyQuestCompletion_dailyQuestId_questDate_idx" ON "DailyQuestCompletion"("dailyQuestId", "questDate");
