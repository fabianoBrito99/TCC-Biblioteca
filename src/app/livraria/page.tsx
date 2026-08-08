"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchLivrosPorCategoria } from "@/actions/categorias";
import styles from "./livraria.module.css";

interface APILivroRaw {
  id_livro: string | number;
  nome_livro: string;
  foto_capa_url?: string | null;
  capa?: string | null;
  autor?: string | null;
  autores?: string[] | null;
  descricao?: string | null;
  media_avaliacoes?: number | null;
  preco?: string | null;
  descricao_sem_preco?: string | null;
}

interface LivroLivraria extends APILivroRaw {
  preco?: string | null;
  descricao_sem_preco?: string | null;
}

interface FetchLivrosResp {
  livros?: APILivroRaw[];
}

function obterMediaExibida(media?: number | null) {
  const valor = Number(media);
  return Number.isFinite(valor) && valor > 0 ? valor : 5;
}

function formatarMedia(media?: number | null) {
  const valor = obterMediaExibida(media);
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(1).replace(".", ",");
}

export default function Livraria() {
  const router = useRouter();
  const [livros, setLivros] = useState<LivroLivraria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = (await fetchLivrosPorCategoria("Livraria", 100)) as FetchLivrosResp;
        const livrosData = (data?.livros ?? []).map((livro: APILivroRaw): LivroLivraria => {
          const descricao = livro.descricao || "";
          const match = descricao.match(
            /^\s*(R\$ ?\d+(?:[.,]\d{2})?)\s*(?:\.{3}|\u2026)\s*(.*)$/i
          );
          const descricaoApi = livro.descricao_sem_preco?.trim();
          const descricaoApiSemPreco =
            descricaoApi && !descricaoApi.match(/^\s*R\$ ?\d+/i) ? descricaoApi : null;

          return {
            ...livro,
            preco: livro.preco?.trim() || (match ? match[1].trim() : null),
            descricao_sem_preco: descricaoApiSemPreco || (match ? match[2].trim() : descricao),
          };
        });

        setLivros(livrosData);
      } catch (err) {
        console.error("Erro ao carregar livros da livraria:", err);
        setError("Erro ao carregar os livros da livraria");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>Carregando livros da livraria...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  if (livros.length === 0) {
    return (
      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => router.back()}>
          Voltar
        </button>
        <div className={styles.emptyMessage}>Nenhum livro dispon&iacute;vel na livraria no momento.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          Voltar
        </button>
        <h1 className={styles.title}>Livraria</h1>
        <p className={styles.subtitle}>Todos os livros dispon&iacute;veis para compra</p>
      </div>

      <div className={styles.gridContainer}>
        {livros.map((livro) => {
          const mediaExibida = obterMediaExibida(livro.media_avaliacoes);

          return (
            <div
              key={livro.id_livro}
              className={styles.card}
              onClick={() => router.push(`/livro/${livro.id_livro}`)}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={(livro.capa || livro.foto_capa_url || "/placeholder-cover.png") as string}
                  alt={livro.nome_livro}
                  className={styles.image}
                />
                {livro.preco && <div className={styles.priceBadge}>{livro.preco}</div>}
              </div>

              <div className={styles.cardContent}>
                <h2 className={styles.bookTitle}>{livro.nome_livro}</h2>

                {livro.autor && <p className={styles.author}>Autor: {livro.autor}</p>}
                {livro.preco && <p className={styles.price}>{livro.preco}</p>}
                {livro.descricao_sem_preco && (
                  <p className={styles.description}>{livro.descricao_sem_preco}</p>
                )}

                <p className={styles.rating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={mediaExibida >= star ? styles.starAtiva : styles.starInativa}
                    >
                      &#9733;
                    </span>
                  ))}
                  <strong>{formatarMedia(livro.media_avaliacoes)}</strong>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.ctaSection}>
        <h2>Como Comprar?</h2>
        <p>
          Para comprar um livro, basta ir na <strong>lateral da igreja perto do bebedouro</strong>{" "}
          ou <strong>entrar em contato conosco</strong> para mais informa&ccedil;&otilde;es.
        </p>
        <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
          Ao comprar, voc&ecirc; n&atilde;o est&aacute; apenas se edificando, mas tamb&eacute;m
          ajudando a nossa biblioteca a crescer com novos livros. Obrigado!
        </p>
      </div>
    </div>
  );
}
