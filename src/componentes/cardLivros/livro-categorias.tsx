import { useEffect } from 'react';
import Swiper from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useRouter } from 'next/navigation';
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
  const router = useRouter(); 

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
  }, [categoria, livros]);

  const handleCardClick = (id: string) => {
    router.push(`/livro/${id}`); // Redireciona para a página do livro
  };

  return (
    <div className={styles.categoriaContainer}>
      <h3 className={styles.categoria}>{categoria}</h3>
      <div className={`swiper custom-swiper mySwiper-${categoria}`}>
        <div className="swiper-wrapper">
          {livros.map((livro) => (
            <div
              key={livro.id}
              className="swiper-slide"
              onClick={() => handleCardClick(livro.id)} // Adiciona o evento de clique
              style={{ cursor: 'pointer' }} // Opcional: cursor para indicar que é clicável
            >
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
