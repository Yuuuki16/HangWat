import { PrismaClient } from "@prisma/client";

export const testPrisma = new PrismaClient();

export async function resetTestDb() {
  await testPrisma.commentLike.deleteMany();
  await testPrisma.comment.deleteMany();
  await testPrisma.$executeRaw`UPDATE "Event" SET "confirmedCandidateId" = NULL`;
  await testPrisma.scheduleCandidate.deleteMany();
  await testPrisma.eventInviteToken.deleteMany();
  await testPrisma.eventMemberSession.deleteMany();
  await testPrisma.eventMember.deleteMany();
  await testPrisma.event.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.location.deleteMany();
}
