"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ListaIndicacoes.module.css";

const ListaIndicacoes = () => {
  const [indicacoes, setIndicacoes] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("http://localhost:4000/api/indicacoes")
      .then((res) => res.json())
      .then((data) => setIndicacoes(data.indicacoes));
  }, []);

  const excluirIndicacao = async (id: number) => {
    const response = await fetch(`http://localhost:4000/api/indicacoes/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      alert("Indicação excluída!");
      setIndicacoes(indicacoes.filter((ind) => ind.id_indicacao !== id));
    }
  };

  return (
    <div className={styles.container}>
      <h2>Indicações</h2>
      <ul className={styles.list}>
        {indicacoes.map((ind) => (
          <li key={ind.id_indicacao} className={styles.item}>
            <span>{ind.nome_livro} - {ind.nome_autor}</span>
            <button onClick={() => excluirIndicacao(ind.id_indicacao)} className={styles.button}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaIndicacoes;
