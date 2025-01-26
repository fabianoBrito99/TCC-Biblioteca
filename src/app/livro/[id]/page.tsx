"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./detalhesLivros.module.css";
import Image from "next/image";
import { useCallback } from "react";

interface Resposta {
  id_resposta: number;
  resposta: string;
  fk_id_usuario: number;
  nome_login_resposta?: string;
  foto_usuario_resposta?: string;
  data_resposta?: string;
}

interface Comentario {
  id_comentario: number;
  comentario: string;
  nome_login_comentario?: string;
  curtidas: number;
  usuario_curtiu: boolean;
  foto_usuario_comentario?: string;
  respostas?: Resposta[];
  data_comentario: string;
}

interface Livro {
  id_livro: number;
  nome_livro: string;
  nome_autor: string;
  categoria_principal: string;
  descricao: string;
  nome_editora: string;
  foto_capa: string;
  quantidade_estoque: number;
  quantidade_paginas: number;
  cor_cima: string;
  cor_baixo: string;
}

interface Avaliacao {
  id_avaliacao: number;
  comentario: string;
  avaliacao: number;
  data_avaliacao: string;
  nome_usuario: string;
  foto_usuario: string | null;
}

export default function DetalhesLivro() {
  const [livro, setLivro] = useState<Livro | null>(null);
  const [erro, setErro] = useState("");
  const [comentario, setComentario] = useState("");
  const [avaliacao, setAvaliacao] = useState(0);
  const [tabIndex, setTabIndex] = useState(0);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [resposta, setResposta] = useState("");
  const [responderId, setResponderId] = useState<number | null>(null);
  const [mensagemCurtida, setMensagemCurtida] = useState("");
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const { id } = useParams();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUsuarioId(storedUserId);
    }
  }, []);

  const fetchLivro = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:4000/livro/${id}`);
      if (!response.ok) throw new Error("Erro na resposta da API");
      const data = await response.json();
      if (data.erro) {
        setErro(data.erro);
      } else {
        setLivro(data);
      }
    } catch (error) {
      setErro((error as Error).message);
    }
  }, [id]);

  const fetchComentarios = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/livro/${id}/comentarios?usuarioId=${usuarioId}`
      );
      const data = await response.json();
      setComentarios(data);
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
    }
  }, [id, usuarioId]);

  const fetchAvaliacoes = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/livro/${id}/avaliacoes`
      );
      const data = await response.json();
      setAvaliacoes(data.avaliacoes || []);
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchLivro();
      fetchComentarios();
      fetchAvaliacoes();
    }
  }, [id, fetchLivro, fetchComentarios, fetchAvaliacoes]);

  // Função para curtir/descurtir comentário
  const handleCurtirComentario = async (idComentario: number) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/comentario/curtir`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idComentario, fk_id_usuario: usuarioId }),
        }
      );
      const data = await response.json();

      // Atualiza diretamente o estado do comentário
      setComentarios((prevComentarios) =>
        prevComentarios.map((com) =>
          com.id_comentario === idComentario
            ? {
                ...com,
                usuario_curtiu: !com.usuario_curtiu, // Alterna entre curtido/descurtido
                curtidas: data.curtidas_totais, // Atualiza a quantidade de curtidas
              }
            : com
        )
      );

      // Armazena o estado da curtida no localStorage para persistência após relogar
      if (!usuarioId) return; // Verifica se o usuário está logado
      if (!data.usuario_curtiu) {
        localStorage.removeItem(
          `comentario-curtido-${idComentario}-${usuarioId}`
        );
      } else {
        localStorage.setItem(
          `comentario-curtido-${idComentario}-${usuarioId}`,
          JSON.stringify(true)
        ); // Guarda como curtido
      }

      fetchComentarios();

      setMensagemCurtida(data.message);
    } catch (error) {
      alert("Erro ao curtir/descurtir comentário: " + (error as Error).message);
    }
  };

  const handleReservar = async () => {
    if (livro && livro.quantidade_estoque > 0) {
      // Adiciona a verificação de estoque
      try {
        const response = await fetch(
          `http://localhost:4000/api/emprestimos/${livro.id_livro}/reservar`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuarioId }),
          }
        );
        const data = await response.json();
        alert(data.mensagem);
        fetchLivro(); // Atualiza a informação do livro após a reserva
      } catch (error) {
        alert("Erro ao reservar o livro: " + (error as Error).message);
      }
    } else {
      alert("Livro indisponível no momento.");
    }
  };

  const handleEnviarAvaliacao = async () => {
    if (comentario && avaliacao) {
      try {
        await fetch(`http://localhost:4000/api/livro/${id}/avaliacao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comentario,
            avaliacao,
            fk_id_livro: id,
            fk_id_usuario: usuarioId,
          }),
        });
        alert("Avaliação enviada com sucesso!");
        setComentario("");
        setAvaliacao(0);
        fetchAvaliacoes();
      } catch (error) {
        alert("Erro ao enviar avaliação: " + (error as Error).message);
      }
    }
  };

  const handleEnviarComentario = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/comentario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comentario,
          fk_id_usuario: usuarioId,
          fk_id_livro: id,
          data_comentario: new Date(),
        }),
      });
      const data = await response.json();
      setComentarios((prev) => [...prev, { ...data, respostas: [] }]);
      setComentario("");
    } catch (error) {
      alert("Erro ao enviar comentário: " + (error as Error).message);
    }
  };

  const handleResponderComentario = async (idComentario: number) => {
    if (resposta) {
      try {
        const response = await fetch(
          `http://localhost:4000/api/comentario/responder`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idComentario,
              fk_id_usuario: usuarioId,
              resposta,
              data_resposta: new Date().toISOString(), // Aqui estamos passando a data corretamente
            }),
          }
        );
        const data = await response.json();
        setComentarios((prev) =>
          prev.map((c) =>
            c.id_comentario === idComentario
              ? { ...c, respostas: [...(c.respostas || []), data.resposta] }
              : c
          )
        );
        setResponderId(null);
        setResposta("");
      } catch (error) {
        alert("Erro ao responder comentário: " + (error as Error).message);
      }
    } else {
      alert("Por favor, escreva uma resposta.");
    }
  };

  if (erro) return <p>{erro}</p>;

  return (
    <div
      className={styles.containerConsLiv}
      style={{
        background: `linear-gradient(to bottom, ${livro?.cor_cima}, ${livro?.cor_baixo})`,
      }}
    >
      <div className={styles.grid}>
        {livro?.foto_capa && (
          <Image
            id="livro-capa"
            src={livro.foto_capa}
            alt="Capa do livro"
            className={styles.gridImg}
            width={150}
            height={300}
          />
        )}
        <div className={styles.livroInfo}>
          <h2 className={styles.categoria}>{livro?.categoria_principal}</h2>
          <h1>{livro?.nome_livro}</h1>
          <h2>Autor: {livro?.nome_autor}</h2>
          <h2>Quantidade de páginas: {livro?.quantidade_paginas}</h2>

          <p>{livro?.descricao}</p>
          <div className={styles.botaoReservarPos}>
            {livro?.quantidade_estoque ? (
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

      <div className={styles.conatinerLateral}>
        <div className={styles.tabContainer}>
          <button
            onClick={() => setTabIndex(0)}
            className={`${styles.tabButton} ${
              tabIndex === 0 ? styles.active : ""
            }`}
          >
            Comentários
          </button>
          <button
            onClick={() => setTabIndex(1)}
            className={`${styles.tabButton} ${
              tabIndex === 1 ? styles.active : ""
            }`}
          >
            Avaliações
          </button>
        </div>

        {tabIndex === 0 && (
          <div className={styles.comentariosContainer}>
            <div className={styles.formComentario}>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                maxLength={200}
                placeholder="Escreva seu comentário"
                className={styles.comentarioInput}
              />
              <button
                className={styles.botaoEnviarAvaliacao}
                onClick={handleEnviarComentario}
              >
                Enviar Comentário
              </button>
            </div>
            {comentarios.map((com) => (
              <div key={com.id_comentario} className={styles.comentario}>
                <div className={styles.usuario}>
                  {com.foto_usuario_comentario ? (
                    <Image
                      src={com.foto_usuario_comentario} // Usar diretamente como src
                      alt={`${com.nome_login_comentario} foto`}
                      width={40}
                      height={40}
                      className={styles.fotoUsuario}
                    />
                  ) : (
                    <Image
                      src="/img/perfil.jpg" // Foto padrão
                      alt="Foto padrão"
                      width={40}
                      height={40}
                      className={styles.fotoUsuario}
                    />
                  )}
                  <span>
                    {com.nome_login_comentario || "Usuário Desconhecido"}
                  </span>
                </div>
                <h3>{com.comentario}</h3>

                <div className={styles.flexRes}>
                  {/* Exibe data, caso esteja em formato válido */}
                  {com.data_comentario && (
                    <p className={styles.data}>
                      {new Date(com.data_comentario).toLocaleDateString()}
                    </p>
                  )}

                  {/* Botão de Curtir Comentário */}

                  {/* Responder Comentário */}
                  <button
                    className={styles.responder}
                    onClick={() => setResponderId(com.id_comentario)}
                  >
                    Responder
                  </button>
                </div>
                <button
                  onClick={() => handleCurtirComentario(com.id_comentario)}
                  className={`${styles.curtirBtn} ${
                    com.usuario_curtiu ? styles.curtido : styles.naoCurtido
                  }`}
                >
                  {com.usuario_curtiu ? "❤️" : "🤍"} ({com.curtidas})
                </button>

                {responderId === com.id_comentario && (
                  <div>
                    <textarea
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                      maxLength={200}
                      placeholder="Escreva sua resposta"
                    />
                    <button
                      className={styles.botaoEnviarAvaliacao}
                      onClick={() =>
                        handleResponderComentario(com.id_comentario)
                      }
                    >
                      Enviar Resposta
                    </button>
                  </div>
                )}

                {/* Respostas ao Comentário */}
                {com.respostas && com.respostas.length > 0 && (
                  <div className={styles.respostas}>
                    {com.respostas.map((res) => (
                      <div key={res.id_resposta} className={styles.resposta}>
                        <div className={styles.usuario}>
                          {res.foto_usuario_resposta ? (
                            <Image
                              src={res.foto_usuario_resposta} // Usar diretamente como src
                              alt={`${res.nome_login_resposta} foto`}
                              width={40}
                              height={40}
                              className={styles.fotoUsuario}
                            />
                          ) : (
                            <Image
                              src="/img/perfil.jpg" // Foto padrão
                              alt="Foto padrão"
                              width={40}
                              height={40}
                              className={styles.fotoUsuario}
                            />
                          )}
                          <span>
                            {res.nome_login_resposta || "Usuário Desconhecido"}
                          </span>
                        </div>
                        {res.nome_login_resposta ? (
                          <p className={styles.data}>
                            {new Date(
                              res.data_resposta || ""
                            ).toLocaleDateString()}
                          </p>
                        ) : (
                          <p>
                            Usuário não encontrado -{" "}
                            {new Date(
                              res.data_resposta || ""
                            ).toLocaleDateString()}
                          </p>
                        )}
                        <h3>{res.resposta}</h3>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {mensagemCurtida && <p>{mensagemCurtida}</p>}
          </div>
        )}

        {tabIndex === 1 && (
          <div className={styles.avaliacoesContainer}>
            {avaliacoes.length === 0 ? (
              <p>Não há avaliações para este livro.</p>
            ) : (
              avaliacoes.map((aval, index) => (
                <div key={index} className={styles.comentario}>
                  <div className={styles.usuario}>
                    <Image
                      src={`data:image/jpeg;base64,${aval.foto_usuario}`}
                      alt={`${aval.nome_usuario} foto`}
                      width={40}
                      height={40}
                      className={styles.fotoUsuario}
                    />
                    <span>{aval.nome_usuario}</span>
                  </div>
                  <p>
                    Nota:{" "}
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`${styles.estrela} ${
                          aval.avaliacao >= star
                            ? styles.estrelaAtiva
                            : styles.estrelaInativa
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </p>
                  <p>Comentário: {aval.comentario}</p>
                  <p>
                    Data: {new Date(aval.data_avaliacao).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
            <div className={styles.formAvaliacao}>
              <div className={styles.estrelas}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`${styles.estrela} ${
                      avaliacao >= star ? styles.estrelaAtiva : ""
                    }`}
                    onClick={() => setAvaliacao(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                maxLength={200}
                placeholder="Escreva seu comentário"
              />
              <button
                className={styles.botaoEnviarAvaliacao}
                onClick={handleEnviarAvaliacao}
              >
                Enviar Avaliação
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
