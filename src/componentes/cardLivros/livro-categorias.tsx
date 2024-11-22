import { useEffect } from "react";
import Swiper from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useRouter } from "next/navigation";
import styles from "./livroCategorias.module.css";

interface Livro {
  id_livro: string;
  nome_livro: string;
  foto_capa: string;
  autor: string;
  categoria_principal: string;
  media_avaliacoes: number;
}

interface CategoriaSwiperProps {
  categoria_principal: string;
  livros: Livro[];
}

const CategoriaSwiper: React.FC<CategoriaSwiperProps> = ({
  categoria_principal,
  livros,
}) => {
  const router = useRouter();

  useEffect(() => {
    if (livros.length > 0) {
      const swiper = new Swiper(`.mySwiper-${categoria_principal}`, {
        slidesPerView: 3,
        spaceBetween: 10,
        navigation: {
          nextEl: `.mySwiper-${categoria_principal} .custom-swiper-button-next`,
          prevEl: `.mySwiper-${categoria_principal} .custom-swiper-button-prev`,
        },
        pagination: {
          el: `.mySwiper-${categoria_principal} .custom-swiper-pagination`,
          clickable: true,
        },
        breakpoints: {
          140: { slidesPerView: 1, spaceBetween: 1 },
          540: { slidesPerView: 2, spaceBetween: 1 },
          790: { slidesPerView: 3, spaceBetween: 1 },
          1124: { slidesPerView: 4, spaceBetween: 1 },
          1500: { slidesPerView: 5.5, spaceBetween: 0.5 },
        },
      });
      return () => swiper.destroy(); // Limpeza da instância do Swiper ao desmontar
    }
  }, [livros, categoria_principal]);

  const handleCardClick = (id: string) => {
    router.push(`/livro/${id}`);
  };

  return (
    <div className={styles.categoriaContainer}>
      <h3 className={styles.categoria}>{categoria_principal}</h3>
      <div className={`swiper mySwiper-${categoria_principal}`}>
        <div className="swiper-wrapper">
          {livros.map((livro) => (
            <div
              key={livro.id_livro}
              className="swiper-slide"
              onClick={() => handleCardClick(livro.id_livro)}
              style={{ cursor: "pointer" }}
            >
              <div className={styles.cardLivro}>
                <img
                  src={livro.foto_capa}
                  alt={livro.nome_livro}
                  className="livro-capa"
                />
                <h2>{livro.nome_livro}</h2>
                <h4>Autor: {livro.autor}</h4>
                <p>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const media = livro.media_avaliacoes; // Média do livro
                    const isFull = media >= star; // Estrela completa
                    const isHalf = media >= star - 0.5 && media < star; // Estrela parcial

                    return (
                      <span
                        key={star}
                        className={`${styles.estrela} ${
                          isFull
                            ? styles.estrelaAtiva // Estrela completa
                            : isHalf
                            ? styles.estrelaParcial // Estrela parcial
                            : styles.estrelaInativa // Estrela vazia
                        }`}
                      >
                        ★
                      </span>
                    );
                  })}
                </p>
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
