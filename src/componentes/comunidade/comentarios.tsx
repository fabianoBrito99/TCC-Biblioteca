import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./comentarios.module.css";
import { useParams } from "next/navigation";
import Input from "../forms/input";
import Button from "../forms/button";

interface Comentario {
  id_comentario: number;
  comentario: string;
  nome_usuario: string;
  foto_usuario: string;
  data_comentario: string;
  curtidas: number;
  usuario_curtiu: boolean;
}

interface ComentariosProps {
  comunidadeId: number;
}

export default function Comentarios({ comunidadeId }: ComentariosProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comentario, setComentario] = useState("");
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const { id } = useParams();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUsuarioId(storedUserId);
    } else {
      console.error("Usuário não encontrado no localStorage.");
    }
  }, []);

  useEffect(() => {
    const fetchComentarios = async () => {
      const response = await fetch(
        `http://localhost:4000/api/comunidade/${comunidadeId}/comentarios`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        setComentarios(data);
      } else {
        setComentarios([]);
        console.error("Resposta da API não é um array:", data);
      }
    };
    fetchComentarios();
  }, [comunidadeId]);

  const handleEnviarComentario = async () => {
    if (!usuarioId) {
      alert("Erro: Usuário não identificado.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:4000/api/comunidade/${comunidadeId}/comentarios`,
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

      const newComment = await response.json();
      setComentarios((prevComentarios) => [...prevComentarios, newComment]);
      setComentario("");
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
      alert("Erro ao enviar comentário. Tente novamente mais tarde.");
    }
  };

  return (
    <div className={styles.comentariosContainer}>
      <div className={styles.comentariosFixo}>
        <Input
          label="comentarios"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
        <Button onClick={handleEnviarComentario}>Enviar Comentário</Button>
      </div>

      {comentarios &&
        Array.isArray(comentarios) &&
        comentarios.map((com) => (
          <div key={com.id_comentario} className={styles.comentario}>
            <div className={styles.usuario}>
              <Image
                src={com.foto_usuario || "/img/perfil.jpg"}
                alt="foto"
                width={40}
                height={40}
              />
              <span>{com.nome_usuario}</span>
            </div>
            <h3>{com.comentario}</h3>
            <small className={styles.data}>
              {new Date(com.data_comentario).toLocaleDateString()}
            </small>
          </div>
        ))}
    </div>
  );
}
