"use client";

import React, { useCallback, useEffect, useState } from "react";
import styles from "./aceitar-usuario.module.css";

interface Usuario {
  id_usuario: number;
  nome_usuario?: string;
  nome_login?: string;
  status: string;
  nivel_acesso?: "admin" | "auxiliar" | "membro";
}

interface GerenciarUsuariosProps {
  comunidadeId: number;
  isAdmin: boolean;
  nivelAcesso: "admin" | "auxiliar" | "membro";
}

const nomeNivel = (nivel?: string) => {
  if (nivel === "admin") return "Admin";
  if (nivel === "auxiliar") return "Auxiliar";
  return "Membro";
};

const classeNivel = (nivel?: string) => {
  if (nivel === "admin") return styles.badgeAdmin;
  if (nivel === "auxiliar") return styles.badgeAuxiliar;
  return styles.badgeMembro;
};

const GerenciarUsuarios: React.FC<GerenciarUsuariosProps> = ({
  comunidadeId,
  isAdmin,
  nivelAcesso,
}) => {
  const [solicitacoes, setSolicitacoes] = useState<Usuario[]>([]);
  const [participantes, setParticipantes] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userIdLogado =
    typeof window !== "undefined" ? Number(localStorage.getItem("userId")) : 0;

  const fetchDados = useCallback(async () => {
    if (!isAdmin || !token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [resSolicitacoes, resParticipantes] = await Promise.all([
        fetch(
          `https://api.helenaramazzotte.online/api/comunidade/${comunidadeId}/solicitacoes`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        fetch(
          `https://api.helenaramazzotte.online/api/comunidade/${comunidadeId}/usuarios`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      const solicitacoesData = resSolicitacoes.ok ? await resSolicitacoes.json() : [];
      const participantesData = resParticipantes.ok ? await resParticipantes.json() : [];

      setSolicitacoes(Array.isArray(solicitacoesData) ? solicitacoesData : []);
      setParticipantes(Array.isArray(participantesData) ? participantesData : []);
    } catch (error) {
      console.error("Erro ao buscar dados da comunidade:", error);
    } finally {
      setLoading(false);
    }
  }, [comunidadeId, isAdmin, token]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const handleAtualizarStatus = async (idUsuario: number, novoStatus: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `https://api.helenaramazzotte.online/api/comunidade/${comunidadeId}/usuarios/${idUsuario}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: novoStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar status do usuário");
      }

      await fetchDados();
    } catch {
      alert("Erro ao processar solicitação. Tente novamente.");
    }
  };

  const handleAtualizarNivel = async (
    idUsuario: number,
    novoNivel: "admin" | "auxiliar" | "membro"
  ) => {
    if (!token) return;

    try {
      const response = await fetch(
        `https://api.helenaramazzotte.online/api/comunidade/${comunidadeId}/usuarios/${idUsuario}/nivel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nivel_acesso: novoNivel }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar nível");
      }

      await fetchDados();
    } catch {
      alert("Não foi possível atualizar o nível deste participante.");
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return <p>Carregando gestão da comunidade...</p>;
  }

  const podePromover = nivelAcesso === "admin";

  return (
    <div className={styles.gerenciarUsuariosContainer}>
      <h2 className={styles.titulo}>Gerenciar Comunidade</h2>

      <section className={styles.bloco}>
        <h3>Solicitações Pendentes</h3>
        {solicitacoes.length === 0 ? (
          <p>Não há solicitações pendentes no momento.</p>
        ) : (
          <ul className={styles.usuarioLista}>
            {solicitacoes.map((usuario) => (
              <li key={usuario.id_usuario} className={styles.usuarioItem}>
                <p className={styles.nomePessoa}>{usuario.nome_usuario}</p>
                <p className={styles.status}>Status: {usuario.status}</p>
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
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.bloco}>
        <h3>Participantes e Níveis</h3>
        <ul className={styles.usuarioLista}>
          {participantes
            .filter((u) => u.status === "aceito")
            .map((usuario) => {
              const nome = usuario.nome_login || usuario.nome_usuario || "Usuário";
              const nivel = usuario.nivel_acesso || "membro";
              const isSelf = userIdLogado === usuario.id_usuario;

              return (
                <li key={usuario.id_usuario} className={styles.usuarioItem}>
                  <p className={styles.nomePessoa}>{nome}</p>
                  <span className={`${styles.badge} ${classeNivel(nivel)}`}>
                    {nomeNivel(nivel)}
                  </span>

                  {podePromover && !isSelf && (
                    <select
                      className={styles.nivelSelect}
                      value={nivel}
                      onChange={(e) =>
                        handleAtualizarNivel(
                          usuario.id_usuario,
                          e.target.value as "admin" | "auxiliar" | "membro"
                        )
                      }
                    >
                      <option value="membro">Membro</option>
                      <option value="auxiliar">Auxiliar</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}

                  {!isSelf && (
                    <button
                      className={styles.rejeitarBtn}
                      onClick={() => handleAtualizarStatus(usuario.id_usuario, "rejeitado")}
                    >
                      Excluir
                    </button>
                  )}
                </li>
              );
            })}
        </ul>
      </section>
    </div>
  );
};

export default GerenciarUsuarios;
