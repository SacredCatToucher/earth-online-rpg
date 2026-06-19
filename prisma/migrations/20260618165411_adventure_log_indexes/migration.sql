-- CreateIndex
CREATE INDEX "AdventureLog_deletedAt_eventDate_idx" ON "AdventureLog"("deletedAt", "eventDate");

-- CreateIndex
CREATE INDEX "Attachment_adventureLogId_idx" ON "Attachment"("adventureLogId");
