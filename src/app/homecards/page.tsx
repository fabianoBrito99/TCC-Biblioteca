"use client"; // Marcar como Client Component

import Head from "next/head";
import { useEffect, useState } from "react";
import Swiper from "swiper";
import "swiper/css"; // Importação do Swiper CSS
import "swiper/css/navigation";
import "swiper/css/pagination";
import styles from "@/componentes/cardLivros/livroCategorias.module.css";
import { fetchCategorias, fetchLivros } from "@/actions/categorias"; // Utilitários de API
import CategoriaSwiper from "@/componentes/cardLivros/livro-categorias";

interface Livro {
  id: string;
  nome_livro: string;
  foto_capa: string;
  autor: string;
  categoria: string;
}

const Home: React.FC = () => {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [livros, setLivros] = useState<Livro[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriasData = await fetchCategorias();
        const livrosData = await fetchLivros();
        setCategorias(categoriasData.categorias || []);
        setLivros(livrosData.dados || []);
      } catch (error) {
        console.error("Erro ao carregar os dados:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    categorias.forEach((categoria) => {
      new Swiper(`.mySwiper-${categoria}`, {
        slidesPerView: 3,
        spaceBetween: 1,
        navigation: {
          nextEl: `.mySwiper-${categoria} .custom-swiper-button-next`,
          prevEl: `.mySwiper-${categoria} .custom-swiper-button-prev`,
        },
        pagination: {
          el: `.mySwiper-${categoria} .custom-swiper-pagination`,
          clickable: true,
        },
        breakpoints: {
          140: {
            slidesPerView: 1,
            spaceBetween: 1,
          },
          540: {
            slidesPerView: 2,
            spaceBetween: 1,
          },
          790: {
            slidesPerView: 3,
            spaceBetween: 1,
          },
          1124: {
            slidesPerView: 4,
            spaceBetween: 1,
          },
          1500: {
            slidesPerView: 5.5,
            spaceBetween: 0.5,
          },
        },
      });
    });
  }, [categorias]);

  return (
    <div>
      <Head>
        <title>Home</title>
        <link rel="icon" href="/icones/home-.png" />
      </Head>

      <div id="categorias-section" className={styles.categoriasSection}>
        {categorias.map((categoria) => {
          const livrosFiltrados = livros.filter(
            (livro) => livro.categoria === categoria
          );
          return (
            <CategoriaSwiper
              key={categoria}
              categoria={categoria}
              livros={livrosFiltrados}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Home;