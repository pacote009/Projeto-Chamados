import express from 'express';
import prisma from '../prismaClient.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Dashboard protegido
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, id } = req.user;

    let atividades, projetos, users;

    if (role === 'ADMIN') {
      // Admin vê tudo
      atividades = await prisma.atividade.findMany({
        include: { assignedTo: true }
      });
      projetos = await prisma.projeto.findMany({
        include: { autor: true }
      });
      users = await prisma.user.findMany({
        select: { id: true, name: true, username: true, email: true, role: true }
      });
    } else {
      // User comum → só os próprios
      atividades = await prisma.atividade.findMany({
        where: { assignedToId: id },
        include: { assignedTo: true }
      });
      projetos = await prisma.projeto.findMany({
        where: { autorId: id },
        include: { autor: true }
      });
      users = []; // usuário comum não vê lista de usuários
    }

    // Ajustar retorno (sem campos sensíveis)
    const mappedAtividades = atividades.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      status: a.status,
      createdAt: a.createdAt,
      completedAt: a.completedAt,
      comentarios: a.comentarios || [],
      assignedTo: a.assignedTo ? a.assignedTo.username : null
    }));

    const mappedProjetos = projetos.map(p => ({
      id: p.id,
      titulo: p.titulo,
      descricao: p.descricao,
      likes: p.likes,
      comentarios: p.comentarios || [],
      autor: p.autor ? p.autor.username : null,
      createdAt: p.createdAt
    }));

    res.json({
      atividades: mappedAtividades,
      projetos: mappedProjetos,
      users
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no dashboard' });
  }
});

export default router;
