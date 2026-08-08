"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Swiper, { type Swiper as SwiperInstance } from "swiper";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./livraria-section.module.css";

interface LivroBiblioteca {
  id_livro: string;
  nome_livro: string;
  capa?: string | null;
  foto_capa_url?: string | null;
  descricao?: string | null;
  media_avaliacoes?: number | null;
  preco?: string | null;
  descricao_sem_preco?: string | null;
}

interface LivroLivraria extends LivroBiblioteca {
  preco?: string | null;
  descricao_sem_preco?: string | null;
}

function obterMediaExibida(media?: number | null) {
  const valor = Number(media);
  return Number.isFinite(valor) && valor > 0 ? valor : 5;
}

function formatarMedia(media?: number | null) {
  const valor = obterMediaExibida(media);
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(1).replace(".", ",");
}

const LivrariaSectionComponent: React.FC<{ livros: LivroBiblioteca[] }> = ({ livros }) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(true);

  const livrosComPreco = useMemo(
    () =>
      livros.map((livro) => {
        const descricao = livro.descricao || "";
        const match = descricao.match(
          /^\s*(R\$ ?\d+(?:[.,]\d{2})?)\s*(?:\.{3}|\u2026)\s*(.*)$/i
        );
        const descricaoApi = livro.descricao_sem_preco?.trim();
        const descricaoApiSemPreco =
          descricaoApi && !descricaoApi.match(/^\s*R\$ ?\d+/i) ? descricaoApi : null;

        if (match) {
          return {
            ...livro,
            preco: livro.preco?.trim() || match[1].trim(),
            descricao_sem_preco: descricaoApiSemPreco || match[2].trim(),
          };
        }

        return {
          ...livro,
          preco: livro.preco?.trim() || null,
          descricao_sem_preco: descricaoApiSemPreco || descricao,
        };
      }) as LivroLivraria[],
    [livros]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const updateNavigationState = (swiper: SwiperInstance) => {
      setPodeVoltar(!swiper.isBeginning);
      setPodeAvancar(!swiper.isEnd);
    };

    const swiperInstance = new Swiper(containerRef.current, {
      init: false,
      slidesPerView: 1,
      spaceBetween: 16,
      breakpoints: {
        0: { slidesPerView: 2, spaceBetween: 12 },
        480: { slidesPerView: 3, spaceBetween: 12 },
        768: { slidesPerView: 4 },
        1024: { slidesPerView: 5 },
        1280: { slidesPerView: 6 },
      },
      navigation: {
        nextEl: ".next-livraria",
        prevEl: ".prev-livraria",
      },
      on: {
        slideChange: updateNavigationState,
        reachBeginning: updateNavigationState,
        reachEnd: updateNavigationState,
        fromEdge: updateNavigationState,
        resize: updateNavigationState,
      },
    });

    swiperRef.current = swiperInstance;
    swiperInstance.init();
    updateNavigationState(swiperInstance);

    return () => {
      swiperRef.current = null;
      swiperInstance.destroy(true, true);
    };
  }, [livrosComPreco.length]);

  return (
    <section className={styles.livrariSection}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Conhe&ccedil;a Nossa Livraria</h2>
          <p className={styles.description}>
            Comprando um livro, al&eacute;m de estar edificando voc&ecirc;, voc&ecirc; tamb&eacute;m
            estar&aacute; edificando nossa biblioteca. Com esse dinheiro poderemos comprar novos
            livros para a biblioteca.
          </p>
        </div>
      </div>

      <div className={styles.containerSwiper}>
        <div ref={containerRef} className={`swiper ${styles.swiper}`}>
          <div className="swiper-wrapper">
            {livrosComPreco.slice(0, 6).map((livro) => {
              const mediaExibida = obterMediaExibida(livro.media_avaliacoes);

              return (
                <div key={livro.id_livro} className={`swiper-slide ${styles.slide}`}>
                  <div
                    className={styles.card}
                    onClick={() => router.push(`/livro/${livro.id_livro}`)}
                    aria-label={`${livro.nome_livro}, avaliacao ${formatarMedia(
                      livro.media_avaliacoes
                    )}`}
                  >
                    <div className={styles.imageContainer}>
                      <img
                        src={livro.capa || livro.foto_capa_url || "/placeholder-cover.png"}
                        alt={livro.nome_livro}
                        className={styles.image}
                      />
                      
                    </div>
                    <div className={styles.content}>
                      <h3 className={styles.bookTitle}>{livro.nome_livro}</h3>
                      {livro.preco && <div className={styles.priceBadge}>{livro.preco}</div>}
                      <p className={styles.rating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={mediaExibida >= star ? styles.starAtiva : styles.starInativa}
                          >
                            &#9733;
                          </span>
                        ))}
                        <strong>{formatarMedia(livro.media_avaliacoes)}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {podeVoltar && <button className={`prev-livraria ${styles.navButton} ${styles.prev}`}>{"<"}</button>}
        {podeAvancar && <button className={`next-livraria ${styles.navButton} ${styles.next}`}>{">"}</button>}
      </div>

      <Link href="/livraria" className={styles.seeMoreLink}>
        Conhe&ccedil;a mais livros da livraria -&gt;
      </Link>

      <div className={styles.ctaBox}>
        <p>
          <strong>Para comprar um livro:</strong>
          <br />
          Basta ir na lateral da igreja perto do bebedouro ou{" "}
          <a
            href="https://api.whatsapp.com/send?text=Ol%C3%A1!%20Tenho%20interesse%20em%20comprar%20um%20livro%20da%20livraria."
            target="_blank"
            rel="noopener noreferrer"
          >
            entrar em contato conosco pelo WhatsApp
          </a>{" "}
          para mais informa&ccedil;&otilde;es.
        </p>
      </div>
    </section>
  );
};

export default LivrariaSectionComponent;
