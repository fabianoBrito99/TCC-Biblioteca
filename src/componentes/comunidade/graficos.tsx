import React, { useEffect, useState } from "react";
import styles from "./topLeitores.module.css";
import Image from "next/image";

interface LeitorRanking {
  nome_usuario: string;
  foto_usuario: string;
}

interface Props {
  idComunidade: string;
}

const cores = ["#FFD700", "#C0C0C0", "#CD7F32"]; // ouro, prata, bronze

const TopLeitores: React.FC<Props> = ({ idComunidade }) => {
  const [leitores, setLeitores] = useState<LeitorRanking[]>([]);

  useEffect(() => {
    if (!idComunidade) return;

    fetch(`/api/comunidade/${idComunidade}/top-leitores`)
      .then((res) => res.json())
      .then((data) => {
        console.log("📊 Leitores recebidos:", data);
        setLeitores(data);
      })
      .catch((err) => console.error("Erro ao buscar top leitores:", err));
  }, [idComunidade]);

  return (
    <div className={styles.container}>
      <h2>Top 10 Leitores</h2>
      {Array.isArray(leitores) && leitores.length > 0 ? (
        leitores.slice(0, 10).map((leitor, index) => (
          <div
            key={index}
            className={styles.card}
            style={{
              backgroundColor: index < 3 ? cores[index] : "#FFFFFF",
            }}
          >
            <span className={styles.posicao}>#{index + 1}</span>
            <Image
              className={styles.foto}
              src={leitor.foto_usuario || "/img/default-user.png"}
              alt={`Foto de ${leitor.nome_usuario}`}
              width={10}
              height={5}
            />
            <span className={styles.nome}>{leitor.nome_usuario}</span>
          </div>
        ))
      ) : (
        <p>Nenhum leitor encontrado ainda.</p>
      )}
    </div>
  );
};

export default TopLeitores;
