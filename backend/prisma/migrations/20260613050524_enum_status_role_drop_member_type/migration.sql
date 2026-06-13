-- CreateEnum
CREATE TYPE "EventMemberRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "ScheduleCandidateStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'REJECTED');

-- AlterTable
ALTER TABLE "EventMember" DROP COLUMN "memberType",
DROP COLUMN "role",
ADD COLUMN     "role" "EventMemberRole" NOT NULL;

-- AlterTable
ALTER TABLE "ScheduleCandidate" DROP COLUMN "status",
ADD COLUMN     "status" "ScheduleCandidateStatus" NOT NULL;

