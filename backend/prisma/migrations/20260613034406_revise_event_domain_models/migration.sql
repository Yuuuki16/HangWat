-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "CommentLike" DROP CONSTRAINT "CommentLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_eventUrlId_fkey";

-- DropForeignKey
ALTER TABLE "EventMember" DROP CONSTRAINT "EventMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleCandidate" DROP CONSTRAINT "ScheduleCandidate_createdBy_fkey";

-- DropIndex
DROP INDEX "CommentLike_commentId_userId_key";

-- DropIndex
DROP INDEX "Event_eventUrlId_key";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "userId",
ADD COLUMN     "eventMemberId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "CommentLike" DROP COLUMN "userId",
ADD COLUMN     "eventMemberId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "createdBy",
DROP COLUMN "eventUrlId",
ADD COLUMN     "createdByUserId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "EventMember" DROP COLUMN "status",
ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "memberType" TEXT NOT NULL,
ADD COLUMN     "sessionTokenHash" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ScheduleCandidate" DROP COLUMN "createdBy",
ADD COLUMN     "createdByMemberId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "colorUrl",
ADD COLUMN     "avatarUrl" TEXT;

-- DropTable
DROP TABLE "EventUrl";

-- CreateTable
CREATE TABLE "EventInviteToken" (
    "id" BIGSERIAL NOT NULL,
    "eventId" BIGINT NOT NULL,
    "inviteToken" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventInviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventInviteToken_inviteToken_key" ON "EventInviteToken"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_commentId_eventMemberId_key" ON "CommentLike"("commentId", "eventMemberId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInviteToken" ADD CONSTRAINT "EventInviteToken_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMember" ADD CONSTRAINT "EventMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleCandidate" ADD CONSTRAINT "ScheduleCandidate_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "EventMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_eventMemberId_fkey" FOREIGN KEY ("eventMemberId") REFERENCES "EventMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_eventMemberId_fkey" FOREIGN KEY ("eventMemberId") REFERENCES "EventMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
