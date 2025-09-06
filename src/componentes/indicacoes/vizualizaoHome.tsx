"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./vizualizacao.module.css";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

interface FotoCapaRaw {
  data: number[]; // bytes vindos do backend (ex.: Buffer do MySQL)
}

interface IndicacaoAPI {
  id_indicacao: number;
  nome_livro: string;
  nome_autor: string;
  descricao?: string | null;
  foto_capa?: string | FotoCapaRaw | null; // pode vir já como base64/string ou como bytes
}

interface IndicacoesResp {
  indicacoes: IndicacaoAPI[];
}

interface IndicacaoView {
  id_indicacao: number;
  nome_livro: string;
  nome_autor: string;
  descricao?: string | null;
  foto_capa: string; // sempre uma URL (data:image/jpeg;base64,...) ou placeholder
}

function bytesToDataUrlJPEG(bytes: number[]): string {
  // Converte array de números (0-255) em base64 de forma segura (em chunks)
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.slice(i, i + CHUNK);
    binary += String.fromCharCode(...slice);
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

const IndicacoesDisplay = () => {
  const [indicacoes, setIndicacoes] = useState<IndicacaoView[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch("/api/indicacoes")
      .then((res) => res.json())
      .then((data: IndicacoesResp) => {
        const formatted: IndicacaoView[] = (data?.indicacoes ?? []).map((ind) => {
          let foto = "/placeholder-cover.png";

          if (typeof ind.foto_capa === "string" && ind.foto_capa.trim() !== "") {
            // já veio como URL/base64 string
            foto = ind.foto_capa;
          } else if (
            ind.foto_capa &&
            typeof ind.foto_capa === "object" &&
            Array.isArray((ind.foto_capa as FotoCapaRaw).data)
          ) {
            foto = bytesToDataUrlJPEG((ind.foto_capa as FotoCapaRaw).data);
          }

          return {
            id_indicacao: ind.id_indicacao,
            nome_livro: ind.nome_livro,
            nome_autor: ind.nome_autor,
            descricao: ind.descricao ?? null,
            foto_capa: foto,
          };
        });

        setIndicacoes(formatted);
      })
      .catch((err) => {
        console.error("Erro ao carregar indicações:", err);
        setIndicacoes([]);
      });
  }, []);

  useEffect(() => {
    if (indicacoes.length > 0) {
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % indicacoes.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [indicacoes]);

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % indicacoes.length);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + indicacoes.length) % indicacoes.length);
  };

  if (indicacoes.length === 0) return <p>Carregando indicações...</p>;

  const atual = indicacoes[index];

  return (
    <div className={styles.carouselContainer}>
    
      <div className={styles.grid}>
        <div className={styles.grid1}>
        <button className={styles.arrow1} onClick={prevSlide}>
        <FaArrowLeft />
      </button>
           <h1>{atual.nome_livro}</h1>

          <p>
            {atual.descricao ?? "Uma tentação constante que cerca a vida cristã é a inversão do chamado: a presunção de que Deus precisa abençoar nosso caminho e seguir nossos planos e sonhos. Essa postura é enganosa e faz parecer que Deus só é fiel quando nos abençoa. Mas e se Deus derrubar o nosso sorvete, ele deixa de ser fiel? Claro que não! Ele continua sendo um Pai sábio e um Deus misericordioso mesmo em meio às nossas frustrações. Às vezes, ele só quer chamar nossa atenção para o caminho certo. Você já deve ter testemunhado gente adulta se comportando como criança por não ter a vida que pediu a Deus. É porque pediu errado! Neste livro, Rodrigo Bibo, do podcast Bibotalk, apresenta o caminho do discipulado, o meio para “sonhar” o que Deus já planejou. Aprenda a enxergar e seguir a vontade soberana de Deus expressa em Sua Palavra, tendo uma vida de serviço dedicada a Cristo."}
          </p>

           <h4 className={styles.autor}>{atual.nome_autor}</h4>
        </div>
        <div className={styles.grid2}>
          <Image
            src={atual.foto_capa}
            alt={atual.nome_livro}
            width={300}
            height={450}
            className={styles.image}
          />
          <Image
            src={atual.foto_capa}
            alt={atual.nome_livro}
            width={300}
            height={450}
            className={styles.image1}
          />
          <Image
            src={atual.foto_capa}
            alt={atual.nome_livro}
            width={300}
            height={450}
            className={styles.image2}
          />
          <button className={styles.arrow2} onClick={nextSlide} aria-label="Próximo">
            <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndicacoesDisplay;
