const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { name, username, email, password: hash }
    });
    res.json({ user: { id: user.id, name: user.name, username: user.username, email: user.email } });
  } catch (err) {
    res.status(400).json({ error: "Erro ao registrar usuário", details: err.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(400).json({ error: "Usuário não encontrado" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Senha inválida" });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.json({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role } });
};