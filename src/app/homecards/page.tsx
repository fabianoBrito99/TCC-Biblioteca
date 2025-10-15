"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import { fetchCategorias, fetchLivros } from "@/actions/categorias";
import CategoriaSwiper from "@/componentes/cardLivros/livro-categorias";
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
}

/** Shape possível vindo da API antes de normalizar */
interface APILivroRaw {
  id_livro: string;
  nome_livro: string;
  foto_capa_url?: string | null;
  capa?: string | null;
  autor?: string | null;
  autores?: string[] | null;
  categoria_principal?: string | null;
  categorias?: string[] | null;
  media_avaliacoes?: number | null;
}

/** Respostas esperadas das actions */
interface FetchCategoriasResp {
  categorias?: string[];
}
interface FetchLivrosResp {
  livros?: APILivroRaw[];
}

const Home: React.FC = () => {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriasData = (await fetchCategorias()) as FetchCategoriasResp;
        const livrosData = (await fetchLivros()) as FetchLivrosResp;

        setCategorias(categoriasData?.categorias ?? []);

        // Normaliza para o shape Livro sem usar `any`
        const normalizados: Livro[] = (livrosData?.livros ?? []).map(
          (l: APILivroRaw): Livro => {
            const src = l.capa ?? l.foto_capa_url ?? "/placeholder-cover.png";
            const categoria =
              l.categoria_principal ??
              (Array.isArray(l.categorias) ? l.categorias[0] ?? null : null);
            const autorSingular =
              l.autor ??
              (Array.isArray(l.autores) ? l.autores[0] ?? null : null);

            return {
              id_livro: l.id_livro,
              nome_livro: l.nome_livro,
              foto_capa_url: src,
              capa: src,
              categoria_principal: categoria,
              autor: autorSingular,
              media_avaliacoes: l.media_avaliacoes ?? 0,
            };
          }
        );

        setLivros(normalizados);
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

      <div className={styles.indicacoes}>
        <IndicacoesDisplay />
      </div>

      <div id="categorias-section" className={styles.categoriasSection}>
        {categorias.map((categoria) => {
          const livrosFiltrados = livros.filter((livro) => {
            const categoriaLivro = livro.categoria_principal?.trim().toLowerCase();
            const categoriaSelecionada = categoria.trim().toLowerCase();
            return categoriaLivro === categoriaSelecionada;
          });

          return (
            <div key={categoria}>
              <div></div>
              <CategoriaSwiper
                categoria_principal={categoria}
                livros={livrosFiltrados}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
