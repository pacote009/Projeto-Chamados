// src/services/api.js
import axios from "axios";

const BASE_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
});

// pegar token do localStorage e enviar no header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Dashboard (dinâmico com projetos e atividades por usuário)
 */
export const getDashboardData = async () => {
  try {
    const [atividadesRes, projetosRes, usersRes] = await Promise.all([
      api.get("/atividades"),
      api.get("/projetos"),
      api.get("/users"),
    ]);

    const atividades = Array.isArray(atividadesRes.data) ? atividadesRes.data : [];
    const projetos = Array.isArray(projetosRes.data) ? projetosRes.data : [];
    const users = Array.isArray(usersRes.data) ? usersRes.data : [];

    // Contagem de atividades por status
    const concluidas = atividades.filter(
  (a) => ["finalizada", "concluida", "concluído"].includes(String(a.status).toLowerCase())
).length;

const pendentes = atividades.filter(
  (a) => ["pendente"].includes(String(a.status).toLowerCase())
).length;


    // Contagem total de projetos
    const totalProjetos = projetos.length;

    // Projetos por usuário (com base no campo "autor")
    const projetosPorUsuario = {};
    projetos.forEach((p) => {
      const autor = p.autor || "Desconhecido";
      projetosPorUsuario[autor] = (projetosPorUsuario[autor] || 0) + 1;
    });

    // Atividades por usuário (com base no campo "assignedTo")
    const atividadesPorUsuario = {};
    atividades.forEach((a) => {
      const user = a.assignedTo || "Não atribuído";
      atividadesPorUsuario[user] = (atividadesPorUsuario[user] || 0) + 1;
    });

    // Garantir que todos os usuários apareçam no gráfico, mesmo com zero
    users.forEach((u) => {
      if (!(u.username in projetosPorUsuario)) {
        projetosPorUsuario[u.username] = 0;
      }
      if (!(u.username in atividadesPorUsuario)) {
        atividadesPorUsuario[u.username] = 0;
      }
    });

    return {
      concluidas,
      pendentes,
      projetos: totalProjetos,
      projetosPorUsuario,
      atividadesPorUsuario,
    };
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    return {
      concluidas: 0,
      pendentes: 0,
      projetos: 0,
      projetosPorUsuario: {},
      atividadesPorUsuario: {},
    };
  }
};


export const loginUser = async (username, password) => {
  const response = await api.get(`/users?username=${username}&password=${password}`);
  if (response.data.length > 0) {
    const user = response.data[0];

    // SALVAR TOKEN
    localStorage.setItem("token", user.token || "fake-token"); // se tiver token do backend, use ele
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  } else {
    throw new Error("Usuário ou senha inválidos!");
  }
};

/**
 * Buscar atividades com paginação, ordenação, filtro e ocultar fixadas para outros usuários
 */
export const getAtividades = async (
  status,
  page = 1,
  limit = 5,
  order = "desc",
  search = "",
  currentUser = null
) => {
  const res = await api.get("/atividades", { params: { status } });
  let list = Array.isArray(res.data) ? res.data : [];

  // 🔍 Filtro por título ou descrição
  const term = search.trim().toLowerCase();
  if (term) {
    list = list.filter((item) => {
      const t = (item.title || "").toLowerCase();
      const d = (item.description || "").toLowerCase();
      return t.includes(term) || d.includes(term);
    });
  }

  // 🔒 Ocultar fixadas de outros usuários (exceto admin)
  if (currentUser && currentUser.role !== "admin") {
    list = list.filter((item) => !item.assignedTo || item.assignedTo === currentUser.username);
  }

  // 📌 Ordenação
  const getKey = (it) => {
    if (it.createdAt) return { type: "num", v: Number(it.createdAt) };
    const n = Number(it.id);
    if (!Number.isNaN(n)) return { type: "num", v: n };
    return { type: "str", v: String(it.id || "") };
  };

  list.sort((a, b) => {
    const ka = getKey(a);
    const kb = getKey(b);

    let cmp = 0;
    if (ka.type === "num" && kb.type === "num") cmp = ka.v - kb.v;
    else cmp = String(ka.v).localeCompare(String(kb.v));

    return order === "asc" ? cmp : -cmp;
  });

  // 📄 Paginação
  const total = list.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = list.slice(start, end);

  return { data, total };
};

/**
 * Adicionar nova atividade
 */
export const addAtividade = async (atividade) => {
  const payload = {
    createdAt: new Date().toISOString(),  // data de criação ISO
    completedAt: null,                    // só preenche ao finalizar
    ...atividade,
  };
  const res = await api.post("/atividades", payload);
  return res.data;
};

/**
 * Atualizar atividade
 */
export const updateAtividade = async (id, data) => {
  // se está sendo marcada como finalizada, salva a hora da conclusão
  if (data.status === "finalizada") {
    data.completedAt = new Date().toISOString();
  }

  const response = await api.patch(`/atividades/${id}`, data);
  return response.data;
};

/**
 * Adicionar comentário em atividade
 */
export const addComentarioAtividade = async (id, comentario) => {
  const atividade = await api.get(`/atividades/${id}`);
  const novosComentarios = [...atividade.data.comentarios, comentario];
  const response = await api.patch(`/atividades/${id}`, { comentarios: novosComentarios });
  return response.data;
};

/**
 * Atribuir atividade a um usuário (fixar)
 */
export const assignAtividade = async (id, username) => {
  const response = await api.patch(`/atividades/${id}`, { assignedTo: username });
  return response.data;
};

/**
 * Buscar todos os usuários
 */
export const getUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

/**
 * Excluir atividade
 */
export const deleteAtividade = async (id) => {
  const response = await api.delete(`/atividades/${id}`);
  return response.data;
};

/**
 * Excluir comentário em atividade
 */
export const deleteComentarioAtividade = async (id, index) => {
  const atividade = await api.get(`/atividades/${id}`);
  const comentarios = [...atividade.data.comentarios];
  comentarios.splice(index, 1);
  const response = await api.patch(`/atividades/${id}`, { comentarios });
  return response.data;
};

/**
 * Atualizar comentário em atividade
 */
export const updateComentarioAtividadeTexto = async (id, index, novoTexto) => {
  const atividade = await api.get(`/atividades/${id}`);
  const comentarios = [...atividade.data.comentarios];
  if (comentarios[index]) {
    comentarios[index].texto = novoTexto;
  }
  const response = await api.patch(`/atividades/${id}`, { comentarios });
  return response.data;
};

// Concluídas por usuário
export const getRelatorioConcluidasPorUsuario = async () => {
  const res = await api.get("/atividades");
  const atividades = res.data.filter((a) => a.status === "finalizada");
  const porUsuario = {};
  atividades.forEach((a) => {
    const user = a.assignedTo || "Não atribuído";
    if (!porUsuario[user]) porUsuario[user] = [];
    porUsuario[user].push(a);
  });
  return porUsuario;
};

// Concluídas por dia
export const getRelatorioConcluidasPorDia = async () => {
  const res = await api.get("/atividades");
  const atividades = res.data.filter((a) => a.status === "finalizada");
  const porDia = {};
  atividades.forEach((a) => {
    const user = a.assignedTo || "Não atribuído";
    const dia = new Date(a.createdAt).toLocaleDateString("pt-BR");
    if (!porDia[user]) porDia[user] = {};
    if (!porDia[user][dia]) porDia[user][dia] = [];
    porDia[user][dia].push(a);
  });
  return porDia;
};

// Concluídas por semana
// Todas por semana (sem filtrar antes)
export const getRelatorioConcluidasPorSemana = async () => {
  const res = await api.get("/atividades");
  const atividades = res.data; // ✅ pega todas

  const porSemana = {};
  atividades.forEach((a) => {
    const user = a.assignedTo || "Não atribuído";
    const d = new Date(a.createdAt);

// 🔹 Encontrar a segunda-feira da semana
const primeiroDiaSemana = new Date(d);
primeiroDiaSemana.setDate(d.getDate() - d.getDay() + 1); // segunda-feira

// 🔹 Último dia da semana (domingo)
const ultimoDiaSemana = new Date(primeiroDiaSemana);
ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6);

// 🔹 Formatar intervalo (21/08 - 27/08)
const formatar = (data) =>
  data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

const semana = `${formatar(primeiroDiaSemana)} - ${formatar(ultimoDiaSemana)}`;

if (!porSemana[user]) porSemana[user] = {};
if (!porSemana[user][semana]) porSemana[user][semana] = [];
porSemana[user][semana].push(a);

  });

  return porSemana;
};


// Fixadas por usuário
export const getRelatorioFixadasPorUsuario = async () => {
  const res = await api.get("/atividades");
  const atividades = res.data.filter((a) => a.assignedTo);
  const fixadas = {};
  atividades.forEach((a) => {
    const user = a.assignedTo;
    if (!fixadas[user]) fixadas[user] = [];
    fixadas[user].push(a);
  });
  return fixadas;
};


export default api;
