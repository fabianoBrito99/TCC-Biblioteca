"use client";

import React, { useState, useEffect } from "react";
import { FaBell } from "react-icons/fa";
import styles from "./notificacoes.module.css";

interface Notificacao {
  id_notificacao: number;
  mensagem: string;
  tipo: string;
  data_criacao: string;
  lida: boolean;
}

interface NotificacoesProps {
  usuarioId?: string;
}

const Notificacoes: React.FC<NotificacoesProps> = ({ usuarioId: propUsuarioId }) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  // Obter o ID do usuário no cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userIdFromStorage = localStorage.getItem("userId");
      setUsuarioId(propUsuarioId || userIdFromStorage);
    }
  }, [propUsuarioId]);

  // Gerar notificações automaticamente
  useEffect(() => {
    if (!usuarioId) return;

    const gerarNotificacoes = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/api/notificacoes/gerar/${usuarioId}`,
          { method: "POST" }
        );
        if (!response.ok) throw new Error("Erro ao gerar notificações");
        console.log("Notificações geradas com sucesso");
      } catch (error) {
        console.error("Erro ao gerar notificações:", error);
      }
    };

    gerarNotificacoes();
  }, [usuarioId]);

  // Buscar notificações
  useEffect(() => {
    if (!usuarioId) {
      console.warn("Usuário não identificado. Nenhuma notificação será carregada.");
      return;
    }

    const fetchNotificacoes = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/api/notificacoes/${usuarioId}`
        );
        if (!response.ok) throw new Error("Erro ao buscar notificações");
        const data = await response.json();
        setNotificacoes(data);
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
      }
    };

    fetchNotificacoes();
  }, [usuarioId]);

  // Marcar notificação como lida
  const handleMarcarLida = async (idNotificacao: number) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/notificacoes/${idNotificacao}/lida`,
        { method: "PATCH" }
      );

      if (!response.ok) throw new Error("Erro ao marcar notificação como lida.");

      // Atualizar o estado local para refletir a mudança
      setNotificacoes((prev) =>
        prev.map((notificacao) =>
          notificacao.id_notificacao === idNotificacao
            ? { ...notificacao, lida: true }
            : notificacao
        )
      );
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <div className={styles.notificacoes}>
      {/* Ícone do sininho */}
      <div
        className={styles.bellContainer}
        onClick={() => setShowDropdown((prev) => !prev)}
      >
        <FaBell size={24} />
        {notificacoesNaoLidas > 0 && (
          <span className={styles.counter}>{notificacoesNaoLidas}</span>
        )}
      </div>

      {/* Dropdown de notificações */}
      {showDropdown && (
        <div className={styles.dropdown}>
          {notificacoes.length > 0 ? (
            notificacoes.map((notificacao) => (
              <div
                key={notificacao.id_notificacao}
                className={styles.notificacaoCard}
              >
                <p>{notificacao.mensagem}</p>
                <small>
                  {new Date(notificacao.data_criacao).toLocaleDateString()}
                </small>
                {!notificacao.lida && (
                  <button
                    className={styles.marcarLidaBtn}
                    onClick={() => handleMarcarLida(notificacao.id_notificacao)}
                  >
                    Marcar como lida
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className={styles.noNotificacoes}>
              Nenhuma notificação no momento.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Notificacoes;
