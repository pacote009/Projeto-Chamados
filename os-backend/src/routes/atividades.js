import express from 'express';
import prisma from '../prismaClient.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Listar (público)
router.get('/', async (req, res) => {
  const list = await prisma.atividade.findMany({ include: { assignedTo: true } });
  const mapped = list.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    status: a.status,
    createdAt: a.createdAt,
    completedAt: a.completedAt,
    comentarios: a.comentarios || [],
    assignedTo: a.assignedTo ? a.assignedTo.username : null
  }));
  res.json(mapped);
});

// Buscar 1
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const a = await prisma.atividade.findUnique({ where: { id }, include: { assignedTo: true }});
  if (!a) return res.status(404).json({ error: 'Não encontrada' });
  res.json({
    ...a,
    assignedTo: a.assignedTo ? a.assignedTo.username : null
  });
});

// Criar (se quiser proteger, adicione authMiddleware)
router.post('/', async (req, res) => {
  const { title, description, status, assignedTo, comentarios } = req.body;
  let assignedToId = null;
  if (assignedTo) {
    const user = await prisma.user.findUnique({ where: { username: assignedTo }});
    if (user) assignedToId = user.id;
  }
  const created = await prisma.atividade.create({
    data: {
      title,
      description,
      status: status || 'pendente',
      comentarios: comentarios || [],
      assignedToId
    }
  });
  const full = await prisma.atividade.findUnique({ where: { id: created.id }, include: { assignedTo: true }});
  res.status(201).json({ ...full, assignedTo: full.assignedTo ? full.assignedTo.username : null });
});

// Atualizar parcialmente (patch)
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const data = { ...req.body };
  if (data.assignedTo) {
    const user = await prisma.user.findUnique({ where: { username: data.assignedTo }});
    data.assignedToId = user ? user.id : null;
    delete data.assignedTo;
  }
  if (data.status && data.status.toLowerCase() === 'finalizada') {
    data.completedAt = new Date();
  }
  const updated = await prisma.atividade.update({ where: { id }, data });
  const full = await prisma.atividade.findUnique({ where: { id }, include: { assignedTo: true }});
  res.json({ ...full, assignedTo: full.assignedTo ? full.assignedTo.username : null });
});

// Deletar
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.atividade.delete({ where: { id }});
  res.json({ success: true });
});

export default router;
