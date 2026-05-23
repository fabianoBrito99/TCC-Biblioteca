import { useEffect, useMemo, useRef, useState } from "react";
import Swiper, { type Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useRouter } from "next/navigation";
import styles from "./livroCategorias.module.css";
import Image from "next/image";
import type { Livro } from "@/types/livro";

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

function aplicarHifenOpcional(texto?: string | null) {
  if (!texto) return "";

  return texto
    .split(" ")
    .map((palavra) => {
      const palavraLimpa = palavra.replace(/[.,;:!?()[\]{}"'“”‘’]/g, "");

      if (palavraLimpa.length <= 10) {
        return palavra;
      }

      const pontoQuebra = Math.ceil(palavra.length * 0.65);

      return palavra.slice(0, pontoQuebra) + "\u00AD" + palavra.slice(pontoQuebra);
    })
    .join(" ");
}

const CategoriaSwiper: React.FC<{
  categoria_principal: string;
  livros: Livro[];
}> = ({ categoria_principal, livros }) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  const safeId = useMemo(() => slugify(categoria_principal), [categoria_principal]);
  const nextCls = `next-${safeId}`;
  const prevCls = `prev-${safeId}`;

  useEffect(() => {
    if (!containerRef.current) return;

    const atualizarControles = (swiper: SwiperInstance) => {
      setPodeVoltar(!swiper.isBeginning);
      setPodeAvancar(!swiper.isEnd);
    };

    const swiper = new Swiper(containerRef.current, {
      slidesPerView: "auto",
      spaceBetween: 12,
      freeMode: true,
      navigation: {
        nextEl: `.${nextCls}`,
        prevEl: `.${prevCls}`,
      },
      on: {
        init: atualizarControles,
        slideChange: atualizarControles,
        reachBeginning: atualizarControles,
        reachEnd: atualizarControles,
        fromEdge: atualizarControles,
        resize: atualizarControles,
      },
      breakpoints: {
        700: {
          spaceBetween: 14,
        },
        1100: {
          spaceBetween: 16,
        },
      },
    });

    swiperRef.current = swiper;
    atualizarControles(swiper);

    return () => {
      swiperRef.current = null;
      swiper.destroy(true, true);
    };
  }, [livros, nextCls, prevCls]);

  const handleCardClick = (livro: Livro) => {
    sessionStorage.setItem("livroSelecionadoId", String(livro.id_livro));
    sessionStorage.setItem("livroSelecionadoNome", livro.nome_livro);
    router.push("/livro");
  };

  const handleVerMais = () => {
    const qs = new URLSearchParams({
      categoria: categoria_principal,
      modo: "publico",
    });

    router.push(`/livros?${qs.toString()}`);
  };

  const voltarSlide = () => {
    swiperRef.current?.slidePrev();
  };

  const avancarSlide = () => {
    swiperRef.current?.slideNext();
  };

  return (
    <div className={styles.categoriaContainer}>
      <div className={styles.rowHeader}>
        <h3 className={styles.categoria}>{categoria_principal}</h3>
      </div>

      <div ref={containerRef} className={`swiper ${styles.bookRail} mySwiper-${safeId}`}>
        <div className="swiper-wrapper">
          {livros.map((livro) => (
            <div
              key={livro.id_livro}
              className={`swiper-slide ${styles.bookSlide}`}
              onClick={() => handleCardClick(livro)}
            >
              <div className={styles.cardLivro}>
                <Image
                  src={livro.foto_capa_url || livro.capa || "/placeholder-cover.png"}
                  alt={livro.nome_livro ?? "Capa do livro"}
                  className={styles.capaLivro}
                  width={180}
                  height={270}
                />

                <h2 className={styles.tituloLivro} lang="pt-BR" title={livro.nome_livro}>
                  {aplicarHifenOpcional(livro.nome_livro)}
                </h2>

                <h4 className={styles.autor}>
                  {livro.autor ?? "Autor nao informado"}
                </h4>

                <div className={styles.mediaLivro}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={
                        Number(livro.media_avaliacoes || 0) >= star
                          ? styles.starAtiva
                          : styles.starInativa
                      }
                    >
                      ★
                    </span>
                  ))}

                  <strong>{Number(livro.media_avaliacoes || 0).toFixed(1)}</strong>
                </div>
              </div>
            </div>
          ))}

          <div className={`swiper-slide ${styles.moreSlide}`}>
            <button
              type="button"
              className={styles.verMaisCard}
              onClick={handleVerMais}
            >
              <span>Ver mais</span>
              <strong>{categoria_principal}</strong>
            </button>
          </div>
        </div>

        <button
          type="button"
          className={`${styles.navButton} ${styles.navPrev} ${
            !podeVoltar ? styles.navHidden : ""
          } ${prevCls}`}
          aria-label="Voltar"
          disabled={!podeVoltar}
          onClick={voltarSlide}
        ></button>

        <button
          type="button"
          className={`${styles.navButton} ${styles.navNext} ${
            !podeAvancar ? styles.navHidden : ""
          } ${nextCls}`}
          aria-label="Avancar"
          disabled={!podeAvancar}
          onClick={avancarSlide}
        ></button>
      </div>
    </div>
  );
};

export default CategoriaSwiper;
