"use client";
import React, { useEffect, useState } from 'react';
import EmprestimoCardAprovar from '@/componentes/emprestimo/emprestimoAprovar';
import styles from '@/componentes/emprestimo/empretismo.module.css';

interface Emprestimo {
  id_emprestimo: number;
  foto_capa: string;
  nome_usuario: string;
  nome_livro: string;
  data_prevista_devolucao: string;
}

export default function AprovarEmprestimo() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);

  const carregarEmprestimos = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/emprestimos/aprovar');
      const data = await response.json();
      setEmprestimos(data.dados);
    } catch (error) {
      console.error('Erro ao carregar os empréstimos:', error);
    }
  };

  useEffect(() => {
    carregarEmprestimos();
  }, []);

  const removerEmprestimo = (id: number) => {
    setEmprestimos((prevEmprestimos) =>
      prevEmprestimos.filter((emprestimo) => emprestimo.id_emprestimo !== id)
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.listaEmprestimo}>
        <h1>Lista de Aprovação dos Empréstimos</h1>
      </div>
      <div id="emprestimos-container" className={styles.emprestimosContainer}>
        {emprestimos.map((emprestimo) => (
          <EmprestimoCardAprovar
            key={emprestimo.id_emprestimo}
            emprestimo={emprestimo}
            onUpdate={removerEmprestimo} // Remove o item específico da lista
          />
        ))}
      </div>
    </div>
  );
}
