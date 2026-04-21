import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import styles from "./comentarios.module.css";
import Input from "../forms/input";
import { FaPaperPlane } from "react-icons/fa";

interface Comentario {
  id_comentario: number;
  comentario: string;
  nome_usuario: string;
  foto_usuario: string | null;
  data_comentario: string;
  fk_id_usuario: string;
  reply_to?: number | null;
  vistos_total?: number;
  visto_por_mim?: boolean;
  vistos_preview?: Array<{ nome_usuario: string; foto_usuario: string | null; visto_em: string }>;
}

interface VistoItem {
  id_usuario: number;
  nome_usuario: string;
  foto_usuario: string | null;
  visto_em: string;
}

interface ComentariosProps {
  comunidadeId: number;
}

const generateColorFromName = (name: string | undefined) => {
  if (!name || name.length === 0) return "#cccccc";
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
  const [replyTo, setReplyTo] = useState<Comentario | null>(null);
  const [seenModalCommentId, setSeenModalCommentId] = useState<number | null>(null);
  const [seenList, setSeenList] = useState<VistoItem[]>([]);
  const mensagensAreaRef = useRef<HTMLDivElement>(null);

  const authHeaders = useMemo<Record<string, string>>(() => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const fetchComentarios = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.helenaramazzotte.online/api/comunidade/${comunidadeId}/comentarios`,
        {
          headers: authHeaders,
        }
      );
      const data: Comentario[] = await response.json();
      setComentarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar comentários:", error);
    }
  }, [authHeaders, comunidadeId]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) setUsuarioId(storedUserId);
  }, []);

  useEffect(() => {
    fetchComentarios();
  }, [fetchComentarios]);

  useEffect(() => {
    const interval = setInterval(fetchComentarios, 3000);
    return () => clearInterval(interval);
  }, [fetchComentarios]);

  useEffect(() => {
    if (!usuarioId || !comentarios.length) return;

    const markSeen = async () => {
      const pendentes = comentarios.filter(
        (c) => String(c.fk_id_usuario) !== String(usuarioId) && !c.visto_por_mim
      );
      await Promise.all(
        pendentes.map((c) =>
          fetch(
            `https://api.helenaramazzotte.online/api/comunidade/${comunidadeId}/comentarios/${c.id_comentario}/visto`,
            {
              method: "POST",
              headers: authHeaders,
            }
          )
        )
      );
      if (pendentes.length) fetchComentarios();
    };

    markSeen();
  }, [authHeaders, comentarios, comunidadeId, fetchComentarios, usuarioId]);

  useEffect(() => {
    if (!mensagensAreaRef.current) return;
    mensagensAreaRef.current.scrollTop = mensagensAreaRef.current.scrollHeight;
  }, [comentarios.length]);

  const handleEnviarComentario = async () => {
    if (!usuarioId || !comentario.trim()) {
      return;
    }

    try {
      const response = await fetch(
        `https://api.helenaramazzotte.online/api/comunidade/${comunidadeId}/comentarios`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            comentario,
            reply_to: replyTo?.id_comentario || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao adicionar comentário");
      }

      await fetchComentarios();
      setComentario("");
      setReplyTo(null);
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
      alert("Erro ao enviar comentário. Tente novamente mais tarde.");
    }
  };

  const openSeenModal = async (commentId: number) => {
    setSeenModalCommentId(commentId);
    try {
      const response = await fetch(
        `https://api.helenaramazzotte.online/api/comunidade/${comunidadeId}/comentarios/${commentId}/vistos`,
        {
          headers: authHeaders,
        }
      );
      const data = await response.json();
      setSeenList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar visualizações:", error);
      setSeenList([]);
    }
  };

  const comentariosPorId = comentarios.reduce<Record<number, Comentario>>((acc, item) => {
    acc[item.id_comentario] = item;
    return acc;
  }, {});

  const renderComment = (com: Comentario) => {
    const isCurrentUser = String(com.fk_id_usuario) === String(usuarioId);
    const seenPreview = com.vistos_preview || [];
    const seenTotal = Number(com.vistos_total || 0);
    const comentarioOriginal = com.reply_to ? comentariosPorId[com.reply_to] : null;

    return (
      <div
        key={com.id_comentario}
        className={`${styles.comentarioContainer} ${isCurrentUser ? styles.usuarioLogado : ""}`}
      >
        <div className={styles.cardComentario}>
          {comentarioOriginal && (
            <div className={styles.replyPreview}>
              <strong>{comentarioOriginal.nome_usuario}</strong>:{" "}
              {comentarioOriginal.comentario.length > 80
                ? `${comentarioOriginal.comentario.slice(0, 80)}...`
                : comentarioOriginal.comentario}
            </div>
          )}
          <div className={styles.header}>
            <Image
              className={styles.fotoUsuario}
              src={com.foto_usuario || "/img/perfil.jpg"}
              alt="foto"
              width={32}
              height={32}
            />
            <span
              className={styles.nomeUsuario}
              style={{ color: isCurrentUser ? "#0d6efd" : generateColorFromName(com.nome_usuario) }}
            >
              {com.nome_usuario}
            </span>
          </div>

          <p className={styles.mensagem}>{com.comentario}</p>

          <div className={styles.comentarioFooter}>
            <small className={styles.data}>{new Date(com.data_comentario).toLocaleString()}</small>
            <button className={styles.replyBtn} onClick={() => setReplyTo(com)}>
              Responder
            </button>

            {seenTotal > 0 && (
              <button className={styles.seenBtn} onClick={() => openSeenModal(com.id_comentario)}>
                <span className={styles.seenAvatars}>
                  {seenPreview.slice(0, 2).map((v, idx) => (
                    <Image
                      key={`${v.nome_usuario}-${idx}`}
                      src={v.foto_usuario || "/img/perfil.jpg"}
                      alt={v.nome_usuario}
                      width={20}
                      height={20}
                      className={styles.seenAvatar}
                    />
                  ))}
                </span>
                <span>+{seenTotal}</span>
              </button>
            )}
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className={styles.comentariosContainer}>
      <div className={styles.mensagensArea} ref={mensagensAreaRef}>
        {comentarios.map((com) => renderComment(com))}
      </div>

      <div className={styles.comentariosFixo}>
        {replyTo && (
          <div className={styles.replyingTag}>
            Respondendo:{" "}
            {replyTo.comentario.length > 70 ? `${replyTo.comentario.slice(0, 70)}...` : replyTo.comentario}
            <button onClick={() => setReplyTo(null)}>Cancelar</button>
          </div>
        )}
        <Input label="Mensagem" value={comentario} onChange={(e) => setComentario(e.target.value)} />
        <button className={styles.buttonEnviar} onClick={handleEnviarComentario}>
          <FaPaperPlane size={20} color="#fff" />
        </button>
      </div>

      {seenModalCommentId && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h4>Visualizaram a mensagem</h4>
            {seenList.length === 0 ? (
              <p>Ninguém visualizou ainda.</p>
            ) : (
              <ul className={styles.seenList}>
                {seenList.map((item) => (
                  <li key={`${item.id_usuario}-${item.visto_em}`}>
                    <Image
                      src={item.foto_usuario || "/img/perfil.jpg"}
                      alt={item.nome_usuario}
                      width={28}
                      height={28}
                      className={styles.seenAvatar}
                    />
                    <span>{item.nome_usuario}</span>
                    <small>{new Date(item.visto_em).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            )}
            <button className={styles.closeModalBtn} onClick={() => setSeenModalCommentId(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
