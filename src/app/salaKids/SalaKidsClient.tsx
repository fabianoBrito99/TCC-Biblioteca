"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaSyncAlt,
  FaUtensils,
  FaUsers,
} from "react-icons/fa";
import { myKidsApi, PublicRoomsResponse } from "@/lib/mykids-api";
import styles from "./sala-kids.module.css";

const REFRESH_INTERVAL_MS = 10_000;

function formatUpdatedAt(value: string | undefined) {
  if (!value) return "aguardando atualização";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export default function SalaKidsClient() {
  const [data, setData] = useState<PublicRoomsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const nextData = await myKidsApi.publicRooms();
      setData(nextData);
      setError("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível atualizar as salas."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.brandIcon} aria-hidden="true">
              <FaUtensils />
            </span>
            <div>
              <span className={styles.kicker}>Painel da cozinha</span>
              <h1>Sala Kids</h1>
              <p>Crianças presentes e cuidados com o lanche</p>
            </div>
          </div>
          <div className={styles.liveArea}>
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} />
              Atualização automática
            </span>
            <button
              className={styles.refreshButton}
              type="button"
              onClick={() => void refresh(true)}
              disabled={refreshing}
            >
              <FaSyncAlt className={refreshing ? styles.spinning : ""} />
              {refreshing ? "Atualizando" : "Atualizar"}
            </button>
            <small>Última atualização: {formatUpdatedAt(data?.updated_at)}</small>
          </div>
        </header>

        <section className={styles.summary} aria-label="Resumo do lanche">
          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}><FaUsers /></span>
            <div>
              <strong>{data?.total ?? 0}</strong>
              <span>lanches no total</span>
            </div>
          </article>
          <article className={[styles.summaryCard, styles.warningSummary].join(" ")}>
            <span className={styles.summaryIcon}><FaExclamationTriangle /></span>
            <div>
              <strong>{data?.restrictions_total ?? 0}</strong>
              <span>restrições alimentares</span>
            </div>
          </article>
          <aside className={styles.safetyNotice}>
            <FaExclamationTriangle />
            <div>
              <strong>Atenção antes de servir</strong>
              <span>Itens amarelos exigem conferência. Em caso de dúvida, não sirva e confirme com a liderança.</span>
            </div>
          </aside>
        </section>

        {error && (
          <div className={styles.error} role="alert">
            {error} A última lista carregada continua visível.
          </div>
        )}

        {loading ? (
          <section className={styles.loading} aria-live="polite">
            <FaSyncAlt className={styles.spinning} />
            <span>Carregando crianças nas salas...</span>
          </section>
        ) : (
          <section className={styles.roomsGrid} aria-live="polite">
            {(data?.rooms || []).map((room) => (
              <article className={styles.roomCard} key={room.id}>
                <header className={styles.roomHeader}>
                  <div>
                    <span className={styles.roomStatus}>
                      {room.is_open ? "Sala aberta" : "Sala fechada"}
                    </span>
                    <h2>{room.name}</h2>
                    <p>{room.age_range}</p>
                  </div>
                  <div className={styles.roomQuantity}>
                    <strong>{room.quantity}</strong>
                    <span>{room.quantity === 1 ? "lanche" : "lanches"}</span>
                  </div>
                </header>

                {room.restrictions_count > 0 && (
                  <div className={styles.roomWarning}>
                    <FaExclamationTriangle />
                    {room.restrictions_count} {room.restrictions_count === 1 ? "criança requer" : "crianças requerem"} cuidado alimentar
                  </div>
                )}

                <div className={styles.childrenList}>
                  {room.children.length === 0 ? (
                    <div className={styles.emptyRoom}>
                      <FaCheckCircle />
                      <span>Nenhuma criança na sala agora</span>
                    </div>
                  ) : (
                    room.children.map((child) => (
                      <div
                        className={[
                          styles.childRow,
                          child.has_food_restriction ? styles.restrictedChild : "",
                        ].filter(Boolean).join(" ")}
                        key={child.checkin_id}
                      >
                        <span className={styles.arrivalNumber}>
                          #{String(child.arrival_number || 0).padStart(3, "0")}
                        </span>
                        <div className={styles.childInfo}>
                          <strong className={child.has_food_restriction ? styles.restrictedName : ""}>
                            {child.name}
                          </strong>
                          {child.has_food_restriction ? (
                            <div className={styles.restriction}>
                              <FaExclamationTriangle aria-hidden="true" />
                              <div>
                                <span>Restrição alimentar</span>
                                <p>{child.food_restriction || "Detalhes ainda não informados — confirmar antes de servir."}</p>
                              </div>
                            </div>
                          ) : (
                            <span className={styles.noRestriction}>
                              <FaCheckCircle /> Sem restrição alimentar cadastrada
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        <footer className={styles.footer}>
          Este painel mostra somente as crianças com check-in ativo hoje.
        </footer>
      </section>
    </main>
  );
}
