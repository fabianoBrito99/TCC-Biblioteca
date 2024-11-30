"use client";

import React, { useEffect, useState } from "react";
import HistoricoUsuario from "@/componentes/historico/historico-usuario";
import styles from "./usuarioDetalhes.module.css";

interface Usuario {
  id_usuario: number;
  nome_login: string;
  email: string;
  tipo_usuario: string;
  foto_usuario: string;
}

export default function UsuarioDetalhes({
  params,
}: {
  params: { id: string };
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/api/usuario/${params.id}`
        );
        if (!response.ok) {
          throw new Error("Erro ao buscar usuário");
        }
        const data = await response.json();
        setUsuario(data.usuario);
      } catch (err) {
        setError("Erro ao buscar dados do usuário");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [params.id]);

  if (loading) return <div>Carregando dados do usuário...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className={styles.container}>
      {usuario && (
        <>
          <div className={styles.usuarioDetalhes}>
            <img
              src={`data:image/png;base64,${usuario.foto_usuario}`}
              alt={usuario.nome_login}
              className={styles.usuarioFoto}
            />
            <div className={styles.usuarioInfo}>
              <h2>{usuario.nome_login}</h2>
              <p>Email: {usuario.email}</p>
              <p>Tipo de Usuário: {usuario.tipo_usuario}</p>
            </div>
          </div>
          <h1 className={styles.titleHistorico}>Historico</h1>
          <div className={styles.containerHistorico}>
          <HistoricoUsuario userId={params.id} />
          </div>
        </>
      )}
    </div>
  );
}
