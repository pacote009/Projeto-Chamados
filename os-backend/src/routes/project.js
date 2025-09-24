const express = require("express");
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

// List projects
router.get("/", auth, async (req, res) => {
  const projects = await prisma.project.findMany({ include: { autor: true, comentarios: true } });
  res.json(projects);
});

// Create project
router.post("/", auth, async (req, res) => {
  const { titulo, descricao } = req.body;
  const project = await prisma.project.create({
    data: {
      titulo,
      descricao,
      autorId: req.user.id,
    }
  });
  res.json(project);
});

// Like project
router.patch("/:id/like", auth, async (req, res) => {
  const projectId = parseInt(req.params.id);
  const username = req.user.username;
  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      likes: { increment: 1 },
      likedBy: { push: username }
    }
  });
  res.json(project);
});

// Add comment
router.post("/:id/comentarios", auth, async (req, res) => {
  const projectId = parseInt(req.params.id);
  const { texto } = req.body;
  const comment = await prisma.comment.create({
    data: {
      texto,
      autorId: req.user.id,
      projectId
    }
  });
  res.json(comment);
});

module.exports = router;