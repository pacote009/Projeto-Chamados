import { useState } from "react";
import { FaRegThumbsUp, FaCommentAlt, FaTrash } from "react-icons/fa";
import api from "../services/api";
import { getCurrentUser } from "../auth";
import { motion } from "framer-motion";

const ProjetoCard = ({ projeto, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const user = getCurrentUser();

  const handleLike = async () => {
    if (projeto.likedBy?.includes(user.username)) {
      alert("Você já curtiu este projeto!");
      return;
    }

    try {
      await api.patch(`/projetos/${projeto.id}`, {
        likes: projeto.likes + 1,
        likedBy: [...(projeto.likedBy || []), user.username],
      });
      onUpdate();
    } catch (err) {
      console.error("Erro ao curtir:", err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await api.patch(`/projetos/${projeto.id}`, {
        comentarios: [...projeto.comentarios, `${user.username}: ${newComment}`],
      });
      setNewComment("");
      onUpdate();
    } catch (err) {
      console.error("Erro ao comentar:", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este projeto?")) return;
    try {
      await api.delete(`/projetos/${projeto.id}`);
      onUpdate();
    } catch (err) {
      console.error("Erro ao excluir projeto:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl transition"
    >
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{projeto.titulo}</h2>
      <p className="text-gray-600 dark:text-gray-400 mt-1">{projeto.descricao}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Autor: {projeto.autor}</p>

      <div className="mt-4 flex gap-4 flex-wrap">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500"
        >
          <FaRegThumbsUp /> {projeto.likes}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <FaCommentAlt /> {projeto.comentarios.length}
        </button>

        {user?.username === projeto.autor && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-600 hover:text-red-800"
          >
            <FaTrash /> Excluir
          </button>
        )}
      </div>

      {showComments && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-4 border-t border-gray-300 dark:border-gray-700 pt-3"
        >
          <div className="space-y-2">
            {projeto.comentarios.map((c, i) => (
              <p
                key={i}
                className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg"
              >
                {c}
              </p>
            ))}
          </div>
          <div className="flex gap-3 mt-3">
            <input
              type="text"
              placeholder="Adicionar comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 border rounded-lg p-2 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 placeholder-gray-400"
            />
            <button
              onClick={handleAddComment}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Enviar
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProjetoCard;
