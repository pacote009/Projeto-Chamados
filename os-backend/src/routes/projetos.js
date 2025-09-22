import express from 'express';
import prisma from '../prismaClient.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const list = await prisma.projeto.findMany({ include: { autor: true }});
  const mapped = list.map(p => ({
    id: p.id,
    titulo: p.titulo,
    descricao: p.descricao,
    likes: p.likes,
    comentarios: p.comentarios || [],
    autor: p.autor ? p.autor.username : (p.autorId || null),
    createdAt: p.createdAt
  }));
  res.json(mapped);
});

router.post('/', async (req, res) => {
  const { titulo, descricao, autor, likes, comentarios } = req.body;
  let autorId = null;
  if (autor) {
    const user = await prisma.user.findUnique({ where: { username: autor }});
    if (user) autorId = user.id;
  }
  const created = await prisma.projeto.create({
    data: {
      titulo,
      descricao,
      likes: likes || 0,
      comentarios: comentarios || [],
      autorId
    }
  });
  const full = await prisma.projeto.findUnique({ where: { id: created.id }, include: { autor: true }});
  res.status(201).json({
    ...full,
    autor: full.autor ? full.autor.username : null
  });
});

// update (likes, comentarios, etc)
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const data = { ...req.body };
  const updated = await prisma.projeto.update({ where: { id }, data });
  const full = await prisma.projeto.findUnique({ where: { id }, include: { autor: true }});
  res.json({ ...full, autor: full.autor ? full.autor.username : null });
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.projeto.delete({ where: { id }});
  res.json({ success: true });
});

export default router;
