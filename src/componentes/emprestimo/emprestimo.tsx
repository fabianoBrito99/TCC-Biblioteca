import React from 'react';
import styles from './empretismo.module.css';

interface EmprestimoProps {
  emprestimo: {
    id_emprestimo: number;
    foto_capa: string;
    nome_usuario: string;
    nome_livro: string;
    id_livro: string;
    data_prevista_devolucao: string;
  };
  onClick: () => void;
}

const calcularDiasRestantes = (dataPrevistaDevolucao: string): number => {
  const hoje = new Date();
  const devolucao = new Date(dataPrevistaDevolucao);
  const diferenca = devolucao.getTime() - hoje.getTime();
  return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
};

const obterClasseCor = (diasRestantes: number): string => {
  if (diasRestantes > 10) return styles.green;
  if (diasRestantes >= 0) return styles.yellow;
  return styles.red;
};

const EmprestimoCard: React.FC<EmprestimoProps> = ({ emprestimo, onClick }) => {
  const diasRestantes = calcularDiasRestantes(emprestimo.data_prevista_devolucao);
  const classeCor = obterClasseCor(diasRestantes);

  // Função para devolver o livro
  const handleDevolver = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/emprestimos/${emprestimo.id_emprestimo}/devolver?livroId=${emprestimo.id_livro}`, {
        method: 'PUT', // Ou 'PUT', dependendo da API
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        alert('Livro devolvido com sucesso!');
        window.location.reload();
      } else {
        alert('Erro ao tentar devolver o livro');
      }
    } catch (error) {
      console.error('Erro ao devolver o livro:', error);
      alert('Erro ao tentar devolver o livro');
    }
  };

  return (
    <div className={`${styles.emprestimoCard} ${classeCor}`} onClick={onClick}>
      <div className={styles.fotoLivro}>
        <img src={emprestimo.foto_capa} alt="Foto do Livro" style={{ width: '100px', height: 'auto' }} />
      </div>
      <div className={styles.usuarioEmprestimo}>
        <h2>Usuário: {emprestimo.nome_usuario}</h2>
      </div>
      <div className={styles.livroEmprestimo}>
        <h3><strong>Livro:</strong> {emprestimo.nome_livro}</h3>
      </div>
      <div className={styles.dataDevolucaoEmprestimo}>
        <h4><strong>Data de Vencimento:</strong> {new Date(emprestimo.data_prevista_devolucao).toLocaleDateString('pt-BR')}</h4>
      </div>
      <div className={styles.diasRestantesEmprestimo}>
        <h5><strong>Dias Restantes:</strong> {diasRestantes}</h5>
      </div>
      <button className={styles.devolverButton} onClick={(e) => {
        e.stopPropagation(); // Impede que o evento clique no card seja acionado
        handleDevolver();
      }}>
        Devolver Livro
      </button>
    </div>
  );
};

export default EmprestimoCard;
