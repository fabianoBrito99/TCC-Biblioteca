"use client";
import React, { useEffect, useState } from "react";
import EmprestimoCard from "@/componentes/emprestimo/emprestimo";
import styles from "@/componentes/emprestimo/empretismo.module.css";

interface Emprestimo {
  id_emprestimo: number;
  foto_capa: string;
  nome_usuario: string;
  nome_livro: string;
  id_livro: string;
  data_prevista_devolucao: string;
}

const Home: React.FC = () => {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);

  useEffect(() => {
    const carregarEmprestimos = async () => {
      try {
        const response = await fetch("https://api.helenaramazzotte.online/api/emprestimos");
        const data = await response.json();
        // Verifique a estrutura da resposta para garantir que seja um array
        if (Array.isArray(data.dados)) {
          setEmprestimos(data.dados);
        } else {
          console.error("Estrutura de dados inesperada:", data);
        }
      } catch (error) {
        console.error("Erro ao carregar os empréstimos:", error);
      }
    };

    carregarEmprestimos();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.listaEmprestimo}>
        <h1>Lista de Empréstimos</h1>
      </div>
      <div id="emprestimos-container" className={styles.emprestimosContainer}>
        {emprestimos.map((emprestimo) => (
          <EmprestimoCard
            key={emprestimo.id_emprestimo}
            emprestimo={emprestimo}
            onClick={() =>
              (window.location.href = `/emprestimos/detalheEmprestimo/${emprestimo.id_emprestimo}`)
            }
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
