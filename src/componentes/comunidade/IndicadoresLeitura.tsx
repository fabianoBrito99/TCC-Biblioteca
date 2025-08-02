"use client";

import React, { useEffect, useState } from "react";
import styles from "./IndicadoresLeitura.module.css";

interface Indicadores {
  melhor_dia: string;
  total_hoje: number;
  total_ontem: number;
  media_diaria: number;
}

interface Props {
  idUsuario: number;
  idComunidade: number;
}

const IndicadoresLeitura: React.FC<Props> = ({ idUsuario, idComunidade }) => {
  const [dados, setDados] = useState<Indicadores | null>(null);

  useEffect(() => {
    fetch(
      `http://localhost:4000/api/comunidade/${idComunidade}/usuario/${idUsuario}/indicadores-leitura`
    )
      .then((res) => res.json())
      .then(setDados)
      .catch((err) => console.error("Erro ao buscar indicadores:", err));
  }, [idUsuario, idComunidade]);

  if (!dados) return <p>Carregando indicadores...</p>;

  const variacao = dados.total_hoje - dados.total_ontem;
  const corVariacao = variacao >= 0 ? styles.verde : styles.vermelho;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h4>🏆 Meu Melhor Dia</h4>
        <p className={styles.verde}>
          {new Date(dados.melhor_dia).toLocaleDateString()}
        </p>
      </div>

      <div className={styles.card}>
        <h4>📘 Média Diária</h4>
        <p>{dados.media_diaria} páginas/dia</p>
      </div>

      <div className={styles.card}>
        <h4>📅 Hoje x Ontem</h4>
        <p>
          Hoje: <strong>{dados.total_hoje}</strong>
        </p>
        <p>
          Ontem: <strong>{dados.total_ontem}</strong>
        </p>
        <p className={corVariacao}>
          {variacao >= 0 ? `+${variacao}` : variacao} páginas
        </p>
      </div>
    </div>
  );
};

export default IndicadoresLeitura;
