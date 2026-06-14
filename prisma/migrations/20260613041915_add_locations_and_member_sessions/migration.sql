-- AlterTable
ALTER TABLE "Event" DROP COLUMN "location",
ADD COLUMN     "locationId" BIGINT;

-- AlterTable
ALTER TABLE "EventMember" DROP COLUMN "sessionTokenHash";

-- AlterTable
ALTER TABLE "ScheduleCandidate" DROP COLUMN "location",
ADD COLUMN     "locationId" BIGINT,
ALTER COLUMN "endsAt" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Location" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "googlePlaceId" TEXT,
    "googleMapsUrl" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventMemberSession" (
    "id" BIGSERIAL NOT NULL,
    "eventMemberId" BIGINT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "EventMemberSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventMemberSession_sessionTokenHash_key" ON "EventMemberSession"("sessionTokenHash");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMemberSession" ADD CONSTRAINT "EventMemberSession_eventMemberId_fkey" FOREIGN KEY ("eventMemberId") REFERENCES "EventMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleCandidate" ADD CONSTRAINT "ScheduleCandidate_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

