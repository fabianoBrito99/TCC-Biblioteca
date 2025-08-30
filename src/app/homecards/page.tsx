"use client"; // Marcar como Client Component

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

const Home: React.FC = () => {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriasData = await fetchCategorias();
        const livrosData = await fetchLivros();

        setCategorias(categoriasData.categorias || []);

        // 2) NORMALIZA: sempre define uma imagem; repõe categoria/autores “singulares”
        const normalizados = (livrosData?.livros || []).map((l: any) => {
          const src = l?.capa || l?.foto_capa_url || "/placeholder-cover.png";

          const categoria =
            l?.categoria_principal ||
            (Array.isArray(l?.categorias) ? l.categorias[0] : null);

          const autorSingular =
            l?.autor || (Array.isArray(l?.autores) ? l.autores[0] : null);

          return {
            ...l,
            foto_capa_url: src,
            capa: src,
            categoria_principal: categoria,
            autor: autorSingular,
          };
        });

        setLivros(normalizados);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar os dados:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

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
            const categoriaLivro = livro.categoria_principal
              ?.trim()
              .toLowerCase();
            const categoriaSelecionada = categoria.trim().toLowerCase();
            return categoriaLivro === categoriaSelecionada;
          });

          // Renderizar os livros filtrados
          return (
            <div key={categoria}>
              <div></div>
              <CategoriaSwiper
                categoria_principal={categoria}
                livros={livrosFiltrados} // Passando os livros filtrados
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
