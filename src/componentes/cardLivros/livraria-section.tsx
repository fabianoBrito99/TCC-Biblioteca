"use client";

import { useEffect, useRef, useState } from "react";
import Swiper, { type Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { useRouter } from "next/navigation";
import styles from "./livraria-section.module.css";
import Link from "next/link";

interface LivroBiblioteca {
  id_livro: string;
  nome_livro: string;
  capa?: string | null;
  foto_capa_url?: string | null;
  descricao?: string | null;
}

interface LivroLivraria extends LivroBiblioteca {
  preco?: string | null;
  descricao_sem_preco?: string | null;
}

const LivrariaSectionComponent: React.FC<{ livros: LivroBiblioteca[] }> = ({ livros }) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(true);

  const livrosComPreco = livros.map((livro) => {
    const descricao = livro.descricao || "";
    
    // Extrair preço: "R$ 50.00 ... descrição"
    const match = descricao.match(/^([^\s]*\s+[\d.,]+(?:,\d{2})?)\s*\.\.\.\s*(.*)$/);
    
    if (match) {
      return {
        ...livro,
        preco: match[1].trim(),
        descricao_sem_preco: match[2].trim(),
      };
    }
    
    return {
      ...livro,
      preco: null,
      descricao_sem_preco: descricao,
    };
  }) as LivroLivraria[];

  useEffect(() => {
    if (!containerRef.current) return;

    const swiperInstance = new Swiper(containerRef.current, {
      slidesPerView: 1,
      spaceBetween: 16,
      breakpoints: {
        480: { slidesPerView: 2 },
        768: { slidesPerView: 3 },
        1024: { slidesPerView: 4 },
        1280: { slidesPerView: 6 },
      },
      navigation: {
        nextEl: `.next-livraria`,
        prevEl: `.prev-livraria`,
      },
      on: {
        init: updateNavigationState,
        slideChange: updateNavigationState,
      },
    });

    swiperRef.current = swiperInstance;

    function updateNavigationState() {
      setPodeVoltar(!swiperInstance.isBeginning);
      setPodeAvancar(!swiperInstance.isEnd);
    }

    return () => {
      swiperInstance.destroy();
    };
  }, []);

  return (
    <section className={styles.livrariSection}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>🛍️ Conheça Nossa Livraria</h2>
          <p className={styles.description}>
            Comprando um livro, além de estar edificando você, você também estará edificando nossa biblioteca.
            Com esse dinheiro poderemos comprar novos livros para a biblioteca.
          </p>
        </div>
        <Link href="/livraria" className={styles.seeMoreLink}>
          Conheça mais livros da livraria →
        </Link>
      </div>

      <div className={styles.containerSwiper}>
        <div ref={containerRef} className={`swiper ${styles.swiper}`}>
          <div className="swiper-wrapper">
            {livrosComPreco.slice(0, 6).map((livro) => (
              <div key={livro.id_livro} className={`swiper-slide ${styles.slide}`}>
                <div 
                  className={styles.card}
                  onClick={() => router.push(`/livro/${livro.id_livro}`)}
                >
                  <div className={styles.imageContainer}>
                    <img
                      src={livro.capa || livro.foto_capa_url || "/placeholder-cover.png"}
                      alt={livro.nome_livro}
                      className={styles.image}
                    />
                    {livro.preco && (
                      <div className={styles.priceBadge}>
                        {livro.preco}
                      </div>
                    )}
                  </div>
                  <div className={styles.content}>
                    <h3 className={styles.bookTitle}>{livro.nome_livro}</h3>
                    {livro.preco && (
                      <p className={styles.price}>{livro.preco}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {podeVoltar && (
          <button className={`prev-livraria ${styles.navButton} ${styles.prev}`}>
            ←
          </button>
        )}

        {podeAvancar && (
          <button className={`next-livraria ${styles.navButton} ${styles.next}`}>
            →
          </button>
        )}
      </div>

      <div className={styles.ctaBox}>
        <p>
          <strong>Para comprar um livro:</strong><br />
          Basta ir na lateral da igreja perto do bebedouro ou entrar em contato conosco para mais informações.
        </p>
      </div>
    </section>
  );
};

export default LivrariaSectionComponent;
