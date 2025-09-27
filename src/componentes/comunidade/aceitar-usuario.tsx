"use client";

import React, { useEffect, useState } from "react";
import styles from "./aceitar-usuario.module.css";

interface Usuario {
  id_usuario: number;
  nome_usuario: string;
  status: string;
}

interface GerenciarUsuariosProps {
  comunidadeId: number;
  isAdmin: boolean;
}

const GerenciarUsuarios: React.FC<GerenciarUsuariosProps> = ({
  comunidadeId,
  isAdmin,
}) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar todas as solicitações pendentes
  useEffect(() => {
    const fetchSolicitacoes = async () => {
      try {
        const response = await fetch(
          `https://api.helenaramazzotte.online/api/comunidade/${comunidadeId}/solicitacoes`
        );
        if (!response.ok)
          throw new Error("Erro ao buscar solicitações da comunidade");
        const data = await response.json();
        setUsuarios(data); // Atualiza o estado com as solicitações pendentes
      } catch {
        console.error("Erro ao buscar solicitações:");
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitacoes();
  }, [comunidadeId]);

  const handleAtualizarStatus = async (
    idUsuario: number,
    novoStatus: string
  ) => {
    try {
      const response = await fetch(
        `https://api.helenaramazzotte.online/api/comunidade/${comunidadeId}/usuarios/${idUsuario}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: novoStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erro ao atualizar status do usuário"
        );
      }

      // Remove o usuário da lista local
      setUsuarios((prevUsuarios) =>
        prevUsuarios.filter((usuario) => usuario.id_usuario !== idUsuario)
      );
    } catch {
      console.error("Erro ao atualizar status");
      alert("Erro ao processar solicitação. Tente novamente.");
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
      <h2>Solicitações Pendentes</h2>
      {usuarios.length === 0 ? (
        <p>Não há solicitações pendentes no momento.</p>
      ) : (
        <div className={styles.usuList}>
          <ul className={styles.usuarioLista}>
            {usuarios.map((usuario) => (
              <li key={usuario.id_usuario} className={styles.usuarioItem}>
                <p>
                  <strong>Nome:</strong>{" "}
                  {usuario.nome_usuario || usuario.nome_usuario}
                </p>
                <p>
                  <strong>Status:</strong> {usuario.status}
                </p>
                <div className={styles.acoes}>
                  <button
                    className={styles.aceitarBtn}
                    onClick={() =>
                      handleAtualizarStatus(usuario.id_usuario, "aceito")
                    }
                  >
                    Aceitar
                  </button>
                  <button
                    className={styles.rejeitarBtn}
                    onClick={() =>
                      handleAtualizarStatus(usuario.id_usuario, "rejeitado")
                    }
                  >
                    Rejeitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GerenciarUsuarios;
