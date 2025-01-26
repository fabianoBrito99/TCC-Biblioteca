"use client";

import React, { useEffect, useState } from "react";
import HistoricoUsuario from "@/componentes/historico/historico-usuario";
import styles from "./usuarioDetalhes.module.css";
import Image from "next/image";


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
  const [editando, setEditando] = useState<boolean>(false);
  const [novoTipoUsuario, setNovoTipoUsuario] = useState<string>("");

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
      } catch {
        setError("Erro ao buscar dados do usuário");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [params.id]);

  const handleSalvar = async () => {
    if (!usuario) return;

    try {
      const response = await fetch(
        `http://localhost:4000/api/usuario/${usuario.id_usuario}/tipo`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo_usuario: novoTipoUsuario }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao atualizar tipo de usuário");
      }

      // Atualiza o estado local com o novo tipo de usuário
      setUsuario({ ...usuario, tipo_usuario: novoTipoUsuario });
      setEditando(false); // Fecha o modo de edição
    } catch (error) {
      console.error("Erro ao atualizar tipo de usuário:", error);
      alert("Erro ao atualizar tipo de usuário");
    }
  };

  if (loading) return <div>Carregando dados do usuário...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className={styles.container}>
      {usuario && (
        <>
          <div className={styles.usuarioDetalhes}>
            <Image
              src={`data:image/png;base64,${usuario.foto_usuario}`}
              alt={usuario.nome_login}
              className={styles.usuarioFoto}
              width={1000}
              height={1000}
            />
            <div className={styles.usuarioInfo}>
              <h2>{usuario.nome_login}</h2>
              <p>Email: {usuario.email}</p>
              <p>
                Tipo de Usuário:{" "}
                {editando ? (
                  <div className={styles.editContainer}>
                    <select
                      value={novoTipoUsuario || usuario.tipo_usuario}
                      onChange={(e) => setNovoTipoUsuario(e.target.value)}
                      className={styles.tipoSelect}
                    >
                      <option value="leitor">Leitor</option>
                      <option value="voluntario">Voluntário</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <button
                      className={styles.salvarBtn}
                      onClick={handleSalvar}
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <>
                    {usuario.tipo_usuario}{" "}
                    <button
                      className={styles.editarBtn}
                      onClick={() => {
                        setEditando(true);
                        setNovoTipoUsuario(usuario.tipo_usuario);
                      }}
                    >
                      ✏️editar
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
          <h1 className={styles.titleHistorico}>Histórico</h1>
          <div className={styles.containerHistorico}>
            <HistoricoUsuario userId={params.id} />
          </div>
        </>
      )}
    </div>
  );
}
