"use client";
import React, { useEffect, useState } from "react";
import styles from "./aceitar-usuario.module.css";

interface Usuario {
  id_usuario: number;
  nome_login: string;
  email: string;
  status: string;
}

interface GerenciarUsuariosProps {
  comunidadeId: number;
  isAdmin: boolean; // Verifica se o usuário logado é o admin da comunidade
}

const GerenciarUsuarios: React.FC<GerenciarUsuariosProps> = ({ comunidadeId, isAdmin }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/api/comunidade/${comunidadeId}/usuarios`
        );
        if (!response.ok) throw new Error("Erro ao buscar usuários da comunidade");
        const data = await response.json();
        setUsuarios(data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, [comunidadeId]);

  const handleAtualizarStatus = async (idUsuario: number, novoStatus: string) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/comunidade/${comunidadeId}/usuarios/${idUsuario}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: novoStatus }),
        }
      );

      if (!response.ok) throw new Error("Erro ao atualizar status do usuário");
      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((usuario) =>
          usuario.id_usuario === idUsuario
            ? { ...usuario, status: novoStatus }
            : usuario
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error.message);
    }
  };

  if (!isAdmin) {
    return <p>Você não tem permissão para acessar esta página.</p>;
  }

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div className={styles.gerenciarUsuariosContainer}>
      <h2>Gerenciar Usuários da Comunidade</h2>
      <ul className={styles.usuarioLista}>
        {usuarios.map((usuario) => (
          <li key={usuario.id_usuario} className={styles.usuarioItem}>
            <p>
              <strong>Nome:</strong> {usuario.nome_login}
            </p>
            <p>
              <strong>Email:</strong> {usuario.email}
            </p>
            <p>
              <strong>Status:</strong> {usuario.status}
            </p>
            {usuario.status === "pendente" && (
              <div className={styles.acoes}>
                <button
                  className={styles.aceitarBtn}
                  onClick={() => handleAtualizarStatus(usuario.id_usuario, "aceito")}
                >
                  Aceitar
                </button>
                <button
                  className={styles.rejeitarBtn}
                  onClick={() => handleAtualizarStatus(usuario.id_usuario, "rejeitado")}
                >
                  Rejeitar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GerenciarUsuarios;
