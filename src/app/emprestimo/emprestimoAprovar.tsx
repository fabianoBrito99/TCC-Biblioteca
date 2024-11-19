import React from 'react';
import styles from './aprovar-empretismo.module.css';

interface EmprestimoProps {
  emprestimo: {
    id_emprestimo: number;
    foto_capa: string;
    nome_usuario: string;
    nome_livro: string;
    data_prevista_devolucao: string;
  };
  onUpdate: (id: number) => void; // Função para atualizar a lista após aprovação/rejeição, passando o ID
}

const EmprestimoCard: React.FC<EmprestimoProps> = ({ emprestimo, onUpdate }) => {

  const aprovarEmprestimo = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/emprestimos/${emprestimo.id_emprestimo}/aprovar`, {
        method: 'PUT',
      });
      if (response.ok) {
        alert("Empréstimo aprovado com sucesso!");
        onUpdate(emprestimo.id_emprestimo); // Remove o empréstimo da tela
      } else {
        alert("Erro ao aprovar o empréstimo.");
      }
    } catch (error) {
      console.error("Erro ao aprovar o empréstimo:", error);
      alert("Erro ao aprovar o empréstimo.");
    }
  };

  const rejeitarEmprestimo = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/emprestimos/${emprestimo.id_emprestimo}/rejeitar`, {
        method: 'PUT',
      });
      if (response.ok) {
        alert("Empréstimo rejeitado com sucesso!");
        onUpdate(emprestimo.id_emprestimo); // Remove o empréstimo da tela
      } else {
        alert("Erro ao rejeitar o empréstimo.");
      }
    } catch (error) {
      console.error("Erro ao rejeitar o empréstimo:", error);
      alert("Erro ao rejeitar o empréstimo.");
    }
  };

  return (
    <div className={`${styles.emprestimoCard}`}>
      <div className={styles.fotoLivro}>
        <img src={emprestimo.foto_capa} alt="Foto do Livro" style={{ width: '100px', height: 'auto' }} />
      </div>
      <div className={styles.usuarioEmprestimo}>
        <h2>Usuário: {emprestimo.nome_usuario}</h2>
      </div>
      <div className={styles.livroEmprestimo}>
        <h3><strong>Livro:</strong> {emprestimo.nome_livro}</h3>
      </div>
      <div className={styles.botoes}>
        <button className={styles.aprovar} onClick={aprovarEmprestimo}>Aprovar</button>
        <button className={styles.rejeitar} onClick={rejeitarEmprestimo}>Rejeitar</button>
      </div>
    </div>
  );
};

export default EmprestimoCard;
