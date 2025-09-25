import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("SuaSenhaAqui", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Administrador",
      username: "admin",
      email: "admin@admin.com",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Usuário admin criado:", admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
