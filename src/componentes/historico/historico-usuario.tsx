"use client";

import React, { useEffect, useState } from "react";
import styles from "./historico.module.css";
import Image from "next/image";

interface Historico {
  id_historico: number;
  nome_livro: string;
  foto_capa: string | null; 
  data_historico: string;
  data_emprestimo: string;
  data_prevista_devolucao: string;
  data_devolucao: string | null;
}

const HistoricoUsuario: React.FC<{ userId: string }> = ({ userId }) => {
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/historico/${userId}`);
        if (!response.ok) {
          throw new Error("Erro ao buscar histórico.");
        }
        const data = await response.json();
        setHistorico(data);
      } catch{
        setError("Erro desconhecido.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, [userId]);

  if (loading) {
    return <div>Carregando histórico...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  if (historico.length === 0) {
    return <div>Nenhum histórico encontrado.</div>;
  }

  return (
    
    <div className={styles.historicoContainer}>
    
      {historico.map((item) => (
        <div key={item.id_historico} className={styles.emprestimoHistorico}>
          <div className={styles.fotoLivro}>
            {item.foto_capa ? (
              <Image src={item.foto_capa} alt={item.nome_livro} width={200} height={300} />
            ) : (
              <div className={styles.noImage}>Sem capa</div>
            )}
          </div>
          <div className={styles.grid2}>
            <h3>{item.nome_livro}</h3>
            <p>
              <strong>Data do Empréstimo:</strong>{" "}
              {new Date(item.data_emprestimo).toLocaleDateString()}
            </p>
            <p>
              <strong>Data Prevista de Devolução:</strong>{" "}
              {new Date(item.data_prevista_devolucao).toLocaleDateString()}
            </p>
            <p>
              <strong>Data da Devolução:</strong>{" "}
              {item.data_devolucao
                ? new Date(item.data_devolucao).toLocaleDateString()
                : "Não devolvido"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoricoUsuario;
