"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import {
  fetchCategorias,
  fetchCategoriasPorQuantidade,
  fetchLivrosPorCategoria,
  type CategoriaContagem,
} from "@/actions/categorias";
import CategoriaSwiper from "@/componentes/cardLivros/livro-categorias";
import LivrariaSectionComponent from "@/componentes/cardLivros/livraria-section";
import PWAInitializer from "@/componentes/pwa/PWAInitializer";
import styles from "@/componentes/cardLivros/livroCategorias.module.css";
import IndicacoesDisplay from "@/componentes/indicacoes/vizualizaoHome";

interface Livro {
  id_livro: string;
  nome_livro: string;
  foto_capa_url?: string | null;
  capa?: string | null;
  autor?: string | null;
  categoria_principal?: string | null;
  media_avaliacoes: number;
  categorias?: string[];
}

interface APILivroRaw {
  id_livro: string | number;
  nome_livro: string;
  foto_capa_url?: string | null;
  capa?: string | null;
  autor?: string | null;
  autores?: string[] | null;
  categoria_principal?: string | null;
  categorias?: string[] | null;
  media_avaliacoes?: number | null;
}

interface FetchCategoriasResp {
  categorias?: string[];
}

interface FetchCategoriasOrdenadasResp {
  categorias?: CategoriaContagem[];
}

interface FetchLivrosResp {
  livros?: APILivroRaw[];
}

type LivrosPorCategoria = Record<string, Livro[]>;

const Home: React.FC = () => {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [livrosPorCategoria, setLivrosPorCategoria] =
    useState<LivrosPorCategoria>({});
  const [livrosLivraria, setLivrosLivraria] = useState<Livro[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
    setToken(localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriasOrdenadasData =
          (await fetchCategoriasPorQuantidade()) as FetchCategoriasOrdenadasResp;
        let listaCategorias = (categoriasOrdenadasData?.categorias ?? [])
          .filter((categoria) => Boolean(categoria.categoria_principal))
          .sort((a, b) => Number(b.quantidade || 0) - Number(a.quantidade || 0))
          .map((categoria) => categoria.categoria_principal);

        if (!listaCategorias.length) {
          const categoriasData = (await fetchCategorias()) as FetchCategoriasResp;
          listaCategorias = categoriasData?.categorias ?? [];
        }

        const livrariaCategoria =
          listaCategorias.find(
            (categoria) => normalizarCategoria(categoria) === "livraria"
          ) ?? "Livraria";
        const categoriasExibidas = listaCategorias.filter(
          (categoria) => normalizarCategoria(categoria) !== "livraria"
        );

        setCategorias(categoriasExibidas);

        const respostas = await Promise.all(
          categoriasExibidas.map(async (categoria) => {
            const livrosData = (await fetchLivrosPorCategoria(
              categoria,
              15
            )) as FetchLivrosResp;

            const normalizados: Livro[] = (livrosData?.livros ?? []).map(
              (livro): Livro => normalizarLivro(livro)
            );

            return [categoria, normalizados] as const;
          })
        );

        setLivrosPorCategoria(Object.fromEntries(respostas));

        try {
          const livrariaData = (await fetchLivrosPorCategoria(
            livrariaCategoria,
            20
          )) as FetchLivrosResp;

          const normalizadosLivraria: Livro[] = (
            livrariaData?.livros ?? []
          ).map((livro): Livro => normalizarLivro(livro, livrariaCategoria));

          setLivrosLivraria(normalizadosLivraria);
        } catch (err) {
          console.warn("Erro ao carregar livros da livraria:", err);
        }
      } catch (error) {
        console.error("Erro ao carregar os dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className={styles.containerHome}>
      <Head>
        <title>Home</title>
        <link rel="icon" href="/icones/home-.png" />
      </Head>

      <PWAInitializer userId={userId || undefined} token={token || undefined} />

      <div className={styles.indicacoes}>
        <IndicacoesDisplay />
      </div>

      <div id="categorias-section" className={styles.categoriasSection}>
        {categorias.map((categoria, index) => {
          const livrosFiltrados = livrosPorCategoria[categoria] ?? [];

          return (
            <div key={categoria}>
              <CategoriaSwiper
                categoria_principal={categoria}
                livros={livrosFiltrados}
              />

              {index === 0 && livrosLivraria.length > 0 && (
                <LivrariaSectionComponent livros={livrosLivraria} />
              )}
            </div>
          );
        })}

        {!categorias.length && livrosLivraria.length > 0 && (
          <LivrariaSectionComponent livros={livrosLivraria} />
        )}
      </div>
    </div>
  );
};

function normalizarCategoria(categoria: string) {
  return categoria
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarLivro(livro: APILivroRaw, categoria?: string): Livro {
  const src = livro.capa ?? livro.foto_capa_url ?? "/placeholder-cover.png";
  const categoriaPrincipal =
    categoria ??
    livro.categoria_principal ??
    (Array.isArray(livro.categorias) ? livro.categorias[0] ?? null : null);
  const autorSingular =
    livro.autor ??
    (Array.isArray(livro.autores) ? livro.autores[0] ?? null : null);

  return {
    id_livro: String(livro.id_livro),
    nome_livro: livro.nome_livro,
    foto_capa_url: src,
    capa: src,
    categoria_principal: categoriaPrincipal,
    autor: autorSingular,
    media_avaliacoes: livro.media_avaliacoes ?? 0,
    categorias: Array.isArray(livro.categorias) ? livro.categorias : [],
  };
}

export default Home;
