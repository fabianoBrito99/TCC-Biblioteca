"use client";

import { useEffect, useState } from "react";
import styles from "./ListaIndicacoes.module.css";

interface Indicacao {
  id_indicacao: number;
  nome_livro: string;
  nome_autor: string;
}

const ListaIndicacoes = () => {
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);

  useEffect(() => {
    fetch("https://api.helenaramazzotte.online/api/indicacoes")
      .then((res) => res.json())
      .then((data: { indicacoes: Indicacao[] }) => setIndicacoes(data.indicacoes))
      .catch((err) => console.error("Erro ao carregar indicações:", err));
  }, []);

  const excluirIndicacao = async (id: number) => {
    const response = await fetch(`https://api.helenaramazzotte.online/api/indicacoes/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      alert("Indicação excluída!");
      setIndicacoes((prev) => prev.filter((ind) => ind.id_indicacao !== id));
    }
  };

  return (
    <div className={styles.container}>
      <h2>Indicações</h2>
      <ul className={styles.list}>
        {indicacoes.map((ind) => (
          <li key={ind.id_indicacao} className={styles.item}>
            <span>
              {ind.nome_livro} - {ind.nome_autor}
            </span>
            <button
              onClick={() => excluirIndicacao(ind.id_indicacao)}
              className={styles.button}
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaIndicacoes;
