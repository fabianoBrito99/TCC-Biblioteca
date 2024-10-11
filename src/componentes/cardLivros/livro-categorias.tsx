import { useEffect } from 'react';
import Swiper from 'swiper';
import 'swiper/css'; // Certifique-se de importar o CSS do Swiper
import 'swiper/css/navigation';
import 'swiper/css/pagination';
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
  useEffect(() => {
    // Inicializa o Swiper para cada categoria
    new Swiper(`.mySwiper-${categoria}`, {
      slidesPerView: 3,
      spaceBetween: 10,
      navigation: {
        nextEl: `.mySwiper-${categoria} .custom-swiper-button-next`,
        prevEl: `.mySwiper-${categoria} .custom-swiper-button-prev`,
      },
      pagination: {
        el: `.mySwiper-${categoria} .custom-swiper-pagination`,
        clickable: true,
      },
      breakpoints: {
        640: {
          slidesPerView: 1,
          spaceBetween: 20,
        },
        768: {
          slidesPerView: 2,
          spaceBetween: 30,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 40,
        },
      },
    });
  }, [categoria, livros]);

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
        <div className="custom-swiper-button-next"></div>
        <div className="custom-swiper-button-prev"></div>
      </div>
    </div>
  );
};

export default CategoriaSwiper;
