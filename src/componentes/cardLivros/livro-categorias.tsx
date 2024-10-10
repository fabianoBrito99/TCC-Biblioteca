import React from 'react';
import styles from './livroCategorias.module.css';

interface Livro {
  id: string;
  nome_livro: string;
  foto_capa: string;
  autor: string;
  categoria: string;
}

interface CategoriaSwiperProps {
  categoria: string;
  livros: Livro[];
}

const CategoriaSwiper: React.FC<CategoriaSwiperProps> = ({ categoria, livros }) => {
  return (
    <div className={styles.categoriaContainer}>
      <h3 className={styles.categoria}>{categoria}</h3>
      <div className={`swiper custom-swiper mySwiper-${categoria}`}>
        <div className="swiper-wrapper">
          {livros.map((livro) => (
            <div key={livro.id} className="swiper-slide">
              <div className={styles.cardLivro}>
                <img src={livro.foto_capa} alt={livro.nome_livro} />
                <h2>{livro.nome_livro}</h2>
                <h4>Autor: {livro.autor}</h4>
              </div>
            </div>
          ))}
        </div>
        <div className="swiper-pagination custom-swiper-pagination"></div>
        <div className=" custom-swiper-button-next"></div>
        <div className="custom-swiper-button-prev"></div>
      </div>
    </div>
  );
};

export default CategoriaSwiper;
