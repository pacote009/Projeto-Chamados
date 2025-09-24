const express = require("express");
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

// List activities
router.get("/", auth, async (req, res) => {
  const activities = await prisma.activity.findMany({ include: { autor: true, comentarios: true } });
  res.json(activities);
});

// Create activity
router.post("/", auth, async (req, res) => {
  const { title, description } = req.body;
  const activity = await prisma.activity.create({
    data: {
      title,
      description,
      autorId: req.user.id,
    }
  });
  res.json(activity);
});

// Update activity
router.patch("/:id", auth, async (req, res) => {
  const activityId = parseInt(req.params.id);
  const { status, assignedTo, completedAt } = req.body;
  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: {
      status,
      assignedTo,
      completedAt
    }
  });
  res.json(activity);
});

// Add comment
router.post("/:id/comentarios", auth, async (req, res) => {
  const activityId = parseInt(req.params.id);
  const { texto } = req.body;
  const comment = await prisma.comment.create({
    data: {
      texto,
      autorId: req.user.id,
      activityId
    }
  });
  res.json(comment);
});

module.exports = router;