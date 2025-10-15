import { useEffect, useMemo, useRef } from "react";
import Swiper from "swiper";
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
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, "-")                             // espaços -> -
    .replace(/[^a-z0-9_-]/g, "");                     // limpa resto
}

const CategoriaSwiper: React.FC<{ categoria_principal: string; livros: Livro[] }> = ({
  categoria_principal,
  livros,
}) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const safeId = useMemo(() => slugify(categoria_principal), [categoria_principal]);
  const nextCls = `next-${safeId}`;
  const prevCls = `prev-${safeId}`;
  const pagCls  = `pag-${safeId}`;

  useEffect(() => {
    if (!containerRef.current || livros.length === 0) return;
    const swiper = new Swiper(containerRef.current, {
      slidesPerView: 3,
      spaceBetween: 10,
      navigation: { nextEl: `.${nextCls}`, prevEl: `.${prevCls}` },
      pagination: { el: `.${pagCls}`, clickable: true },
      breakpoints: {
        140: { slidesPerView: 1, spaceBetween: 1 },
        540: { slidesPerView: 2, spaceBetween: 1 },
        790: { slidesPerView: 3, spaceBetween: 1 },
        1124:{ slidesPerView: 4, spaceBetween: 1 },
        1500:{ slidesPerView: 5.5, spaceBetween: .5 },
      },
    });
    return () => swiper.destroy(true, true);
  }, [livros, nextCls, prevCls, pagCls]);

  const handleCardClick = (id: string) => router.push(`/livro/${id}`);

  return (
    <div className={styles.categoriaContainer}>
      <h3 className={styles.categoria}>{categoria_principal}</h3>

      {/* container com ref, sem usar o nome da categoria como classe */}
      <div ref={containerRef} className={`swiper mySwiper-${safeId}`}>
        <div className="swiper-wrapper">
          {livros.map((livro) => (
            <div key={livro.id_livro} className="swiper-slide" onClick={() => handleCardClick(livro.id_livro)} style={{ cursor: "pointer" }}>
              <div className={styles.cardLivro}>
                <Image
                  src={livro.foto_capa_url || livro.capa || "/placeholder-cover.png"}
                  alt={livro.nome_livro ?? "Capa do livro"}
                  className="livro-capa"
                  width={150}
                  height={300}
                />
                <h2 className={styles.tituloLivro}>{livro.nome_livro}</h2>
                <h4 className={styles.autor}>Autor: {livro.autor ?? "—"}</h4>
                <p className={styles.avaliacao}>
                  {[1,2,3,4,5].map((star) => {
                    const m = livro.media_avaliacoes;
                    return (
                      <span key={star}
                        className={`${styles.estrela} ${m >= star ? styles.estrelaAtiva : m >= star - 0.5 ? styles.estrelaParcial : styles.estrelaInativa}`}>
                        ★
                      </span>
                    );
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className={`swiper-pagination custom-swiper-pagination ${pagCls}`}></div>
        <div className={`custom-swiper-button-next ${nextCls}`}></div>
        <div className={`custom-swiper-button-prev ${prevCls}`}></div>
      </div>
    </div>
  );
};

export default CategoriaSwiper;
