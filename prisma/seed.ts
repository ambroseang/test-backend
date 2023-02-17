import { PrismaClient } from '@prisma/client';
import * as argon from "argon2";
import { assignment_seed, courseConfig_seed, courseRun_seed, courseSegment_seed, course_seed, notification_seed, programme_seed, seed_fiscal_years, seed_users } from './data';

const prisma = new PrismaClient();

const hashPassword = async (password: string) => {
  let pw = await argon.hash(password);
  return pw;
}

async function main() {

  for (let user of seed_users) {
    user.password = await hashPassword(user.password);
  }

  await prisma.user.createMany({
    data: seed_users,
  });

  await prisma.fiscalYear.createMany({
    data: seed_fiscal_years,
  });

  await prisma.programme.createMany({
    data: programme_seed,
  });

  await prisma.course.createMany({
    data: course_seed,
  });

  await prisma.courseConfig.createMany({
    data: courseConfig_seed,
  });

  await prisma.courseRun.createMany({
    data: courseRun_seed,
  });

  await prisma.courseSegment.createMany({
    data: courseSegment_seed,
  });

  await prisma.assignment.createMany({
    data: assignment_seed,
  });

  await prisma.notification.createMany({
    data: notification_seed,
  });

  process.exit(0);
}
// execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
