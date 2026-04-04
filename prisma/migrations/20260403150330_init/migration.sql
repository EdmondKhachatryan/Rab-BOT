-- CreateTable
CREATE TABLE "role_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guild_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "requested_role_id" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewed_by" TEXT,
    "reject_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" DATETIME
);

-- CreateIndex
CREATE INDEX "role_requests_guild_id_user_id_idx" ON "role_requests"("guild_id", "user_id");

-- CreateIndex
CREATE INDEX "role_requests_status_idx" ON "role_requests"("status");
