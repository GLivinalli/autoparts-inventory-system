import { PrismaClient, Role } from "@prisma/client";
import argon2 from "argon2";
import "dotenv/config";

const prisma = new PrismaClient();

const DEFAULT_MANUFACTURERS = [
  "Chevrolet",
  "Volkswagen",
  "Fiat",
  "Ford",
  "Toyota",
  "Honda",
  "Hyundai",
  "Nissan",
  "Renault",
  "Jeep",
];

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@autoparts.local").toLowerCase();
  const adminName = process.env.SEED_ADMIN_NAME ?? "Administrador";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "TrocarSenha123!";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        active: true,
        permission: {
          create: {
            canCreateParts: true,
            canEditParts: true,
            canArchiveParts: true,
            canStockIn: true,
            canStockOut: true,
            canManageUsers: true,
          },
        },
      },
    });
    console.log(`Usuario administrador criado: ${adminEmail}`);
    console.log(`Senha inicial: ${adminPassword} (troque assim que possivel)`);
  } else {
    console.log("Usuario administrador ja existe, pulando criacao.");
  }

  for (const name of DEFAULT_MANUFACTURERS) {
    await prisma.manufacturer.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Montadoras padrao garantidas (${DEFAULT_MANUFACTURERS.length}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
