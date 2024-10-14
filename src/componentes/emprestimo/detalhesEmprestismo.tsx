// componentes/emprestimo/detalhesEmprestimo.tsx

import { useEffect, useState } from "react";
import styles from "./detalhesEmprestismo.module.css";

interface DetalhesEmprestimoProps {
  idEmprestimo: string;
}

const DetalhesEmprestimo = ({ idEmprestimo }: DetalhesEmprestimoProps) => {
  const [emprestimo, setEmprestimo] = useState<any>(null);

  useEffect(() => {
    const carregarDetalhesEmprestimo = async (id: string) => {
      try {
        const response = await fetch(`http://localhost:4000/api/emprestimos/${id}`);
        const data = await response.json();
        setEmprestimo(data.dados);
      } catch (error) {
        console.error('Erro ao carregar os detalhes do empréstimo:', error);
      }
    };

    carregarDetalhesEmprestimo(idEmprestimo);
  }, [idEmprestimo]);

  const devolverLivro = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/emprestimos/${idEmprestimo}/devolver`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Livro devolvido com sucesso!');
        window.location.href = '/emprestimos'; // Redireciona para a página de empréstimos
      } else {
        alert('Erro ao devolver o livro.');
      }
    } catch (error) {
      console.error('Erro ao devolver o livro:', error);
    }
  };

  if (!emprestimo) {
    return <div>Carregando detalhes do empréstimo...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.detEmprestimos}>Detalhes do Empréstimo</h1>
      <div id="detalhes-emprestimo-container" className={styles.detalhesContainer}>
        <div className={styles.gridContainer}>
          <div className={styles.grid1}>
            <img src={emprestimo.foto_capa} alt="Capa do Livro" style={{ maxWidth: '200px' }} />
          </div>
          <div className={styles.grid2}>
            <h1><strong>Usuário:</strong> {emprestimo.nome_usuario}</h1>
            <h2><strong>Livro:</strong> {emprestimo.nome_livro}</h2>
            <h4><strong>Data de Empréstimo:</strong> {new Date(emprestimo.data_emprestimo).toLocaleDateString('pt-BR')}</h4>
            <h4><strong>Data de Devolução:</strong> {emprestimo.devolucao ? new Date(emprestimo.devolucao).toLocaleDateString('pt-BR') : 'Ainda não devolvido'}</h4>
          </div>
        </div>
      </div>
      <button id="btn-devolver-livro" onClick={devolverLivro}>
        Devolver Livro
      </button>
    </div>
  );
};

export default DetalhesEmprestimo;
