"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import { fetchCategorias, fetchLivrosPorCategoria } from "@/actions/categorias";
import CategoriaSwiper from "@/componentes/cardLivros/livro-categorias";
import styles from "@/componentes/cardLivros/livroCategorias.module.css";
import IndicacoesDisplay from "@/componentes/indicacoes/vizualizaoHome";

/** Tipos */
interface Livro {
  id_livro: string;
  nome_livro: string;
  foto_capa_url?: string | null;
  capa?: string | null;
  autor?: string | null;
  categoria_principal?: string | null;
  media_avaliacoes: number;
  categorias?: string[]; // << usamos no filtro
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
interface FetchLivrosResp {
  livros?: APILivroRaw[];
}

type LivrosPorCategoria = Record<string, Livro[]>;

const Home: React.FC = () => {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [livrosPorCategoria, setLivrosPorCategoria] = useState<LivrosPorCategoria>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriasData = (await fetchCategorias()) as FetchCategoriasResp;
        const listaCategorias = categoriasData?.categorias ?? [];
        setCategorias(listaCategorias);

        const respostas = await Promise.all(
          listaCategorias.map(async (categoria) => {
            const livrosData = (await fetchLivrosPorCategoria(categoria, 15)) as FetchLivrosResp;
            const normalizados: Livro[] = (livrosData?.livros ?? []).map(
              (l: APILivroRaw): Livro => {
                const src = l.capa ?? l.foto_capa_url ?? "/placeholder-cover.png";
                const categoriaPrincipal =
                  l.categoria_principal ??
                  (Array.isArray(l.categorias) ? l.categorias[0] ?? null : null);
                const autorSingular =
                  l.autor ??
                  (Array.isArray(l.autores) ? l.autores[0] ?? null : null);

                return {
                  id_livro: String(l.id_livro),
                  nome_livro: l.nome_livro,
                  foto_capa_url: src,
                  capa: src,
                  categoria_principal: categoriaPrincipal,
                  autor: autorSingular,
                  media_avaliacoes: l.media_avaliacoes ?? 0,
                  categorias: Array.isArray(l.categorias) ? l.categorias : [],
                };
              }
            );

            return [categoria, normalizados] as const;
          })
        );

        setLivrosPorCategoria(Object.fromEntries(respostas));
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
          const livrosFiltrados = livrosPorCategoria[categoria] ?? [];

          return (
            <div key={categoria}>
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
