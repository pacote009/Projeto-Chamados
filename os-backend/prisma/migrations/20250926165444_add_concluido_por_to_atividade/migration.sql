-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Atividade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "comentarios" JSONB NOT NULL DEFAULT '[]',
    "assignedToId" INTEGER,
    "concluidoPor" TEXT,
    CONSTRAINT "Atividade_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Atividade" ("assignedToId", "comentarios", "completedAt", "createdAt", "description", "id", "status", "title") SELECT "assignedToId", "comentarios", "completedAt", "createdAt", "description", "id", "status", "title" FROM "Atividade";
DROP TABLE "Atividade";
ALTER TABLE "new_Atividade" RENAME TO "Atividade";
CREATE TABLE "new_Projeto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comentarios" JSONB NOT NULL DEFAULT '[]',
    "likedBy" JSONB NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" INTEGER,
    CONSTRAINT "Projeto_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Projeto" ("autorId", "comentarios", "createdAt", "descricao", "id", "likedBy", "likes", "titulo") SELECT "autorId", "comentarios", "createdAt", "descricao", "id", "likedBy", "likes", "titulo" FROM "Projeto";
DROP TABLE "Projeto";
ALTER TABLE "new_Projeto" RENAME TO "Projeto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
