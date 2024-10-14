"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './detalhesLivros.module.css';

interface Livro {
  id: number;
  nome_livro: string;
  autor: string;
  categoria: string;
  descricao: string;
  foto_capa: string;
  quantidade: number;
}

export default function DetalhesLivro() {
  const [livro, setLivro] = useState<Livro | null>(null);
  const [erro, setErro] = useState('');
  
  // Usar o hook useParams para pegar o id
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:4000/livro/${id}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Erro na resposta da API');
          }
          return response.json();
        })
        .then((data) => {
          if (data.erro) {
            setErro(data.erro);
          } else {
            setLivro(data);
          }
        })
        .catch((error) => setErro(error.message));
    }
  }, [id]);

  const handleReservar = () => {
    if (livro && livro.id) {
      fetch(`http://localhost:4000/api/emprestimos/${livro.id}/reservar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuarioId: 7 }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Erro ao reservar o livro');
          }
          return response.json();
        })
        .then((data) => alert(data.mensagem))
        .catch((error) => alert('Erro ao reservar o livro: ' + error.message));
    }
  };

  if (erro) return <p>{erro}</p>;

  return (
    <div className={styles.containerConsLiv}>
      <div className={styles.grid}>
        <div className={styles.gridDiv}>
          <img id="livro-capa" src={livro?.foto_capa} alt="Capa do livro" className={styles.gridImg} />
        </div>
        <div className={styles.livroInfo}>
          <h1>{livro?.nome_livro}</h1>
          <h2>Autor: {livro?.autor}</h2>
          <h2>Categoria: {livro?.categoria}</h2>
          <h6 className="descricao-livro">{livro?.descricao}</h6>
          <div className={styles.botaoReservarPos}>
            {livro?.quantidade ? (
              <button className={styles.botaoReservar} onClick={handleReservar}>
                Reservar
              </button>
            ) : (
              <button className={styles.botaoReservado} disabled>
                Indisponível
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
