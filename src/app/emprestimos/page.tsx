"use client"
import React, { useEffect, useState } from 'react';
import EmprestimoCard from '@/componentes/emprestimo/emprestimo';
import styles from '@/componentes/emprestimo/empretismo.module.css';

interface Emprestimo {
  id: number;
  foto_capa: string;
  nome_usuario: string;
  nome_livro: string;
  data_prevista_devolucao: string;
}

const Home: React.FC = () => {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);

  useEffect(() => {
    const carregarEmprestimos = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/emprestimos');
        const data = await response.json();
        setEmprestimos(data.dados);
      } catch (error) {
        console.error('Erro ao carregar os empréstimos:', error);
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
        {emprestimos.map(emprestimo => (
          <EmprestimoCard
            key={emprestimo.id}
            emprestimo={emprestimo}
            onClick={() => window.location.href = `/emprestimos/detalheEmprestimo/${emprestimo.id}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
