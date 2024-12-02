"use client"; // Marcar como Client Component

import Head from "next/head";
import { useEffect, useState } from "react";
import { fetchCategorias, fetchLivros } from "@/actions/categorias"; // Utilitários de API
import CategoriaSwiper from "@/componentes/cardLivros/livro-categorias";
import styles from "@/componentes/cardLivros/livroCategorias.module.css";
import Notificacoes from "@/componentes/notificacoes/notificacoes";

interface Livro {
  id_livro: string;
  nome_livro: string;
  foto_capa: string;
  autor: string;
  categoria_principal: string;
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

        console.log("Categorias recebidas:", categoriasData);
        console.log("Livros recebidos:", livrosData);

        setCategorias(categoriasData.categorias || []);
        setLivros(livrosData.livros || []);
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
              <div>
              </div>
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
