import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import styles from "./comentarios.module.css";
import Input from "../forms/input";
import { FaPaperPlane } from "react-icons/fa";

interface Comentario {
  id_comentario: number;
  comentario: string;
  nome_usuario: string;
  foto_usuario: string;
  data_comentario: string;
  curtidas: number;
  usuario_curtiu: boolean;
  fk_id_usuario: string;
}

interface ComentariosProps {
  comunidadeId: number;
  comentarios: Comentario[];
  atualizarComentarios: () => Promise<void>;
}

const generateColorFromName = (name: string | undefined) => {
  if (!name || name.length === 0) {
    // Retorna uma cor padrão caso o nome seja inválido
    return "#cccccc";
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = (hash & 0x00ffffff).toString(16).padStart(6, "0");
  return `#${color}`;
};

export default function Comentarios({ comunidadeId }: ComentariosProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comentario, setComentario] = useState("");
  const [usuarioId, setUsuarioId] = useState<string | null>(null);


  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUsuarioId(storedUserId);
      console.log("Usuário logado:", storedUserId);
    } else {
      console.error("Usuário não encontrado no localStorage.");
    }
  }, []);

  const fetchComentarios = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/comunidade/${comunidadeId}/comentarios`
      );
      const data: Comentario[] = await response.json();
  
      if (Array.isArray(data)) {
        setComentarios(data);
      } else {
        setComentarios([]);
        console.error("Resposta da API não é um array:", data);
      }
    } catch (error) {
      console.error("Erro ao buscar comentários:", error);
    }
  }, [comunidadeId]);
  
  
  useEffect(() => {
    fetchComentarios();
  }, [fetchComentarios]);

  // useEffect para buscar os comentários ao carregar ou quando o `comunidadeId` mudar
  useEffect(() => {
    fetchComentarios();
  }, [comunidadeId, fetchComentarios]);

  // Função para enviar um novo comentário
  const handleEnviarComentario = async () => {
    if (!usuarioId) {
      alert("Erro: Usuário não identificado.");
      return;
    }

    try {
      const response = await fetch(
        `/api/comunidade/${comunidadeId}/comentarios`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comentario,
            fk_id_usuario: usuarioId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao adicionar comentário");
      }

      // Atualizar a lista de comentários
      await fetchComentarios();
      setComentario(""); // Limpa o campo de comentário após o envio
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
      alert("Erro ao enviar comentário. Tente novamente mais tarde.");
    }
  };
  return (
    <div className={styles.comentariosContainer}>
      <div className={styles.comentariosFixo}>
        <Input
          label="Mensagem"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
        <button
          className={styles.buttonEnviar}
          onClick={handleEnviarComentario}
        >
          <FaPaperPlane size={20} color="#fff" />
        </button>
      </div>
  
      {comentarios &&
        Array.isArray(comentarios) &&
        comentarios.map((com) => {
          const isCurrentUser = String(com.fk_id_usuario) === String(usuarioId);
  
          return (
            <div
              key={com.id_comentario}
              className={`${styles.comentarioContainer} ${
                isCurrentUser ? styles.usuarioLogado : ""
              }`}
            >
              <div className={styles.cardComentario}>
                <div className={styles.header}>
                  <Image
                    className={styles.fotoUsuario}
                    src={com.foto_usuario || "/img/perfil.jpg"}
                    alt="foto"
                    width={40}
                    height={40}
                  />
                  <span
                    className={styles.nomeUsuario}
                    style={{
                      color: isCurrentUser
                        ? "#0d6efd"
                        : generateColorFromName(com.nome_usuario),
                    }}
                  >
                    {com.nome_usuario}
                  </span>
                </div>
                <h6 className={styles.mensagem}>{com.comentario}</h6>
                <small className={styles.data}>
                  {new Date(com.data_comentario).toLocaleDateString()}
                </small>
              </div>
            </div>
          );
        })}
    </div>
  );
  
}
