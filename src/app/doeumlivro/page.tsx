"use client";
import React, { useState, useEffect } from "react";
import Input from "@/componentes/forms/input";
import Button from "@/componentes/forms/button";
import styles from "./doelivro.module.css";
import Image from "next/image";

const PIX_KEY = "11092052000151";

type Sugestao = {
  id_sugestao: number;
  nome_livro?: string; 
  autor?: string; 
  descricao_livro?: string;
  motivo_sugestao: string;
  data_sugestao: string;
  nome_usuario: string;
  foto_usuario?: string | null; 
};

export default function SuggestionPage() {
  const [nomeLivro, setNomeLivro] = useState("");
  const [descricaoLivro, setDescricaoLivro] = useState("");
  const [motivoSugestao, setMotivoSugestao] = useState("");
  const [nomeAutor, setNomeAutor] = useState(""); 
  const [isAuthorSuggestion, setIsAuthorSuggestion] = useState(false); 
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) setUsuarioId(storedUserId);

    fetchSugestoes();
  }, []);

  const fetchSugestoes = async () => {
    try {
      const response = await fetch("https://api.helenaramazzotte.online/api/sugestoes");
      const data = await response.json();
      setSugestoes(data);
    } catch (error) {
      console.error("Erro ao carregar sugestões:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioId) {
      alert("Usuário não logado.");
      return;
    }
  
    try {
      const response = await fetch("https://api.helenaramazzotte.online/api/sugestoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_livro: nomeLivro || undefined, 
          autor: isAuthorSuggestion ? nomeAutor : undefined, 
          descricao_livro: descricaoLivro || undefined,
          motivo_sugestao: motivoSugestao,
          fk_id_usuario: usuarioId,
        }),
      });
  
      if (response.ok) {
        alert("Sugestão enviada com sucesso!");
        setNomeLivro("");
        setDescricaoLivro("");
        setMotivoSugestao("");
        setNomeAutor("");
        fetchSugestoes();
      } else {
        console.error("Erro ao enviar sugestão:", await response.json());
        alert("Erro ao enviar sugestão.");
      }
    } catch (error) {
      console.error("Erro ao enviar sugestão:", error);
      alert("Erro ao enviar sugestão.");
    }
  };

  const copiarPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setPixCopiado(true);
      window.setTimeout(() => setPixCopiado(false), 2000);
    } catch {
      alert("Nao foi possivel copiar a chave Pix.");
    }
  };
  

  return (
    <div className={styles.suggestionPage}>
      <div className={styles.gridDoe}>
        <div>
          <p className={styles.doe}>
            Ajude nossa biblioteca a crescer e se tornar um lugar ainda mais
            especial! Doe um livro e compartilhe seu conhecimento e carinho com
            todos que passam por aqui. Pode ser um livro físico ou, se preferir,
            nos abençoe com uma contribuição via Pix — basta colocar o título do
            livro desejado na descrição. Cada livro conta, e juntos podemos
            enriquecer a jornada de quem ama ler!
            <span className={styles.pix}>
              Chave Pix: <strong>{PIX_KEY}</strong>
              <button
                type="button"
                className={styles.copyPixButton}
                onClick={copiarPix}
                aria-label="Copiar chave Pix"
              >
                {pixCopiado ? "Copiado!" : "Copiar"}
              </button>
            </span>
            <span className={styles.qrcode}>QrCode👇</span>
          </p>

          <Image
            className={styles.perfil}
            src="/img/qrcode.png"
            alt="Perfil"
            width={300}
            height={300}
          />
        </div>

        <div>
        <div className={styles.sugiraDoe}>
        <h1>Sugira um Livro ou Autor</h1>
      </div>
          <div className={styles.tabNavigation}>
            <button
              className={isAuthorSuggestion ? "" : styles.activeTab}
              onClick={() => setIsAuthorSuggestion(false)}
            >
              Livro
            </button>
            <button
              className={isAuthorSuggestion ? styles.activeTab : ""}
              onClick={() => setIsAuthorSuggestion(true)}
            >
              Autor
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.suggestionForm}>
            {!isAuthorSuggestion ? (
              <>
                <Input
                  label="Nome do Livro"
                  name="nomeLivro"
                  type="text"
                  value={nomeLivro}
                  onChange={(e) => setNomeLivro(e.target.value)}
                  required
                />

                <Input
                  label="Descrição do Livro"
                  name="descricaoLivro"
                  value={descricaoLivro}
                  onChange={(e) => setDescricaoLivro(e.target.value)}
                />
              </>
            ) : (
              <Input
                label="Nome do Autor"
                name="nomeAutor"
                type="text"
                value={nomeAutor}
                onChange={(e) => setNomeAutor(e.target.value)}
                required
              />
            )}

            <Input
              label="Por que você quer este livro/autor na biblioteca?"
              name="motivoSugestao"
              value={motivoSugestao}
              onChange={(e) => setMotivoSugestao(e.target.value)}
              required
            />

            <Button type="submit">Enviar Sugestão</Button>
          </form>
        </div>
        <div className={styles.sugestoes1}>
        <h1>Sugestões de outros Usuarios</h1>
      </div>
      </div>



      <div className={styles.sugestoes}>
        {sugestoes.map((sugestao) => (
          <div key={sugestao.id_sugestao} className={styles.suggestionCard}>
            <div className={styles.userInfo}>
              {sugestao.foto_usuario ? (
                <Image
                  src={`data:image/jpeg;base64,${sugestao.foto_usuario}`}
                  alt={`${sugestao.nome_usuario} foto`}
                  className={styles.userPhoto}
                  width={300}
                  height={300}
                />
              ) : (
                <div className={styles.defaultUserPhoto}></div>
              )}
              <span>{sugestao.nome_usuario}</span>
            </div>
            {sugestao.nome_livro ? (
              <h3>{sugestao.nome_livro}</h3>
            ) : sugestao.autor ? (
              <h3>Autor: {sugestao.autor}</h3>
            ) : (
              <h3>Sem título ou autor informado</h3>
            )}
            {sugestao.descricao_livro && (
              <p>
                <strong>Descrição:</strong> {sugestao.descricao_livro}
              </p>
            )}
            <p>
              <strong>Motivo:</strong> {sugestao.motivo_sugestao}
            </p>
            <p>
              <small>
                Data: {new Date(sugestao.data_sugestao).toLocaleDateString()}
              </small>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
