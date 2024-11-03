"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./detalhesLivros.module.css";

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
  const [erro, setErro] = useState("");
  const [comentario, setComentario] = useState("");
  const [avaliacao, setAvaliacao] = useState(0);
  const [tabIndex, setTabIndex] = useState(0); // Declare tabIndex state

  const { id } = useParams();

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:4000/livro/${id}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erro na resposta da API");
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuarioId: 7 }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erro ao reservar o livro");
          }
          return response.json();
        })
        .then((data) => alert(data.mensagem))
        .catch((error) => alert("Erro ao reservar o livro: " + error.message));
    }
  };

  const handleComentarioChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (e.target.value.length <= 200) {
      setComentario(e.target.value);
    }
  };

  const handleAvaliacaoClick = (rating: number) => {
    setAvaliacao(rating);
  };

  const handleEnviarFeedback = () => {
    if (comentario && avaliacao && livro && livro.id) {
      fetch(`http://localhost:4000/livro/${livro.id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comentario,
          avaliacao,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erro ao enviar feedback");
          }
          return response.json();
        })
        .then(() => {
          alert("Feedback enviado com sucesso!");
          setComentario("");
          setAvaliacao(0);
        })
        .catch((error) => alert("Erro ao enviar feedback: " + error.message));
    } else {
      alert("Por favor, preencha o comentário e a avaliação.");
    }
  };

  if (erro) return <p>{erro}</p>;

  return (
    <div className={styles.containerConsLiv}>
      <div className={styles.grid}>
        <div className={styles.gridDiv}>
          <img
            id="livro-capa"
            src={livro?.foto_capa}
            alt="Capa do livro"
            className={styles.gridImg}
          />
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

      {/* Tab Navigation */}
      <div className={styles.conatinerLateral}>
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${
              tabIndex === 0 ? styles.active : ""
            }`}
            onClick={() => setTabIndex(0)}
          >
            Comentários
          </button>
          <button
            className={`${styles.tabButton} ${
              tabIndex === 1 ? styles.active : ""
            }`}
            onClick={() => setTabIndex(1)}
          >
            Avaliações
          </button>
        </div>

        {/* Feedback Container no canto inferior direito */}
        <div className={styles.feedbackContainer}>
          {tabIndex === 0 && (
            <div className={styles.comentarios}>
              <textarea
                value={comentario}
                onChange={handleComentarioChange}
                placeholder="Escreva seu comentário (máx. 200 caracteres)"
                className={styles.comentarioInput}
                maxLength={200}
                rows={3}
              />
              <div className={styles.contador}>{comentario.length}/200</div>
            </div>
          )}
          {tabIndex === 1 && (
            <div className={styles.avaliacaoContainer}>
              <div className={styles.estrelas}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`${styles.estrela} ${
                      avaliacao >= star ? styles.estrelaAtiva : ""
                    }`}
                    onClick={() => handleAvaliacaoClick(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <button
                onClick={handleEnviarFeedback}
                className={styles.botaoEnviarFeedback}
              >
                Enviar Feedback
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
