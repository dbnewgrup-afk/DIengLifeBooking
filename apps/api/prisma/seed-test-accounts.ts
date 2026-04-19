import bcrypt from "bcryptjs";
import { Role, SellerStatus, UserStatus } from "@prisma/client";
import prisma from "../src/lib/db.js";

const TEST_PASSWORD = "admin123";

const accountSeeds: Array<{
  email: string;
  name: string;
  role: Role;
  phone: string;
  adminCanManageAccounts?: boolean;
  adminCanReviewPasswordResets?: boolean;
}> = [
  {
    email: "super1@system.local",
    name: "Super Admin 1",
    role: Role.SUPER_ADMIN,
    phone: "081100000001",
  },
  {
    email: "super2@system.local",
    name: "Super Admin 2",
    role: Role.SUPER_ADMIN,
    phone: "081100000002",
  },
  {
    email: "super3@system.local",
    name: "Super Admin 3",
    role: Role.SUPER_ADMIN,
    phone: "081100000003",
  },
  {
    email: "admin@system.local",
    name: "Admin Test",
    role: Role.ADMIN,
    phone: "081100000010",
    adminCanManageAccounts: true,
    adminCanReviewPasswordResets: true,
  },
  {
    email: "kasir@system.local",
    name: "Kasir Test",
    role: Role.KASIR,
    phone: "081100000020",
  },
  {
    email: "seller@system.local",
    name: "Seller Test",
    role: Role.SELLER,
    phone: "081100000030",
  },
  {
    email: "affiliate@system.local",
    name: "Affiliate Test",
    role: Role.AFFILIATE,
    phone: "081100000035",
  },
  {
    email: "user@system.local",
    name: "User Test",
    role: Role.USER,
    phone: "081100000040",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  const summary: Array<{ email: string; role: Role; action: string }> = [];

  for (const seed of accountSeeds) {
    const existing = await prisma.user.findUnique({
      where: { email: seed.email },
      select: { id: true },
    });

    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {
        name: seed.name,
        password: passwordHash,
        role: seed.role,
        phone: seed.phone,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        adminCanManageAccounts:
          seed.role === Role.SUPER_ADMIN ? true : seed.adminCanManageAccounts ?? false,
        adminCanReviewPasswordResets:
          seed.role === Role.SUPER_ADMIN ? true : seed.adminCanReviewPasswordResets ?? false,
      },
      create: {
        name: seed.name,
        email: seed.email,
        password: passwordHash,
        role: seed.role,
        phone: seed.phone,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        adminCanManageAccounts:
          seed.role === Role.SUPER_ADMIN ? true : seed.adminCanManageAccounts ?? false,
        adminCanReviewPasswordResets:
          seed.role === Role.SUPER_ADMIN ? true : seed.adminCanReviewPasswordResets ?? false,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    summary.push({
      email: user.email,
      role: user.role,
      action: existing ? "updated" : "created",
    });

    if (seed.role === Role.SELLER) {
      await prisma.sellerProfile.upsert({
        where: { userId: user.id },
        update: {
          displayName: "Dieng Life Villas Seller Test",
          legalName: "PT Dieng Life Villas Test",
          bio: "Akun seller test untuk kebutuhan login dan pengujian dashboard seller.",
          status: SellerStatus.ACTIVE,
          bankName: "BCA",
          bankCode: "014",
          accountNumber: "1234567890",
          accountName: "Seller Test",
        },
        create: {
          userId: user.id,
          displayName: "Dieng Life Villas Seller Test",
          legalName: "PT Dieng Life Villas Test",
          bio: "Akun seller test untuk kebutuhan login dan pengujian dashboard seller.",
          status: SellerStatus.ACTIVE,
          bankName: "BCA",
          bankCode: "014",
          accountNumber: "1234567890",
          accountName: "Seller Test",
        },
      });
    }

    if (seed.role === Role.AFFILIATE) {
      await prisma.affiliateProfile.upsert({
        where: { userId: user.id },
        update: {
          code: "AFF-DIENG-01",
          displayName: "Dieng Affiliate Test",
          legalName: "Affiliate Test",
          bio: "Akun affiliate test untuk kebutuhan tracking referral, komisi, dan withdraw.",
          bankName: "BCA",
          bankCode: "014",
          accountNumber: "9876543210",
          accountName: "Affiliate Test",
          commissionRateBps: 500,
          isActive: true,
        },
        create: {
          userId: user.id,
          code: "AFF-DIENG-01",
          displayName: "Dieng Affiliate Test",
          legalName: "Affiliate Test",
          bio: "Akun affiliate test untuk kebutuhan tracking referral, komisi, dan withdraw.",
          bankName: "BCA",
          bankCode: "014",
          accountNumber: "9876543210",
          accountName: "Affiliate Test",
          commissionRateBps: 500,
          isActive: true,
        },
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        password: TEST_PASSWORD,
        seeded: summary,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("SEED_TEST_ACCOUNTS_FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
