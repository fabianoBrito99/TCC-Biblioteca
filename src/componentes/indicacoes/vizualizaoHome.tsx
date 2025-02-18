import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./vizualizacao.module.css";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const IndicacoesDisplay = () => {
  const [indicacoes, setIndicacoes] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch("http://localhost:4000/api/indicacoes")
      .then((res) => res.json())
      .then((data) => {
        const formattedData = data.indicacoes.map((ind: any) => ({
          ...ind,
          foto_capa: `data:image/jpeg;base64,${Buffer.from(
            ind.foto_capa.data
          ).toString("base64")}`,
        }));
        setIndicacoes(formattedData);
      });
  }, []);

  useEffect(() => {
    if (indicacoes.length > 0) {
      const interval = setInterval(() => {
        setIndex((prevIndex) => (prevIndex + 1) % indicacoes.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [indicacoes]);

  const nextSlide = () => {
    setIndex((prevIndex) => (prevIndex + 1) % indicacoes.length);
  };

  const prevSlide = () => {
    setIndex(
      (prevIndex) => (prevIndex - 1 + indicacoes.length) % indicacoes.length
    );
  };

  if (indicacoes.length === 0) return <p>Carregando indicações...</p>;

  return (
    <div className={styles.carouselContainer}>
    
      <div className={styles.grid}>
        <div className={styles.grid1}>
        <button className={styles.arrow1} onClick={prevSlide}>
        <FaArrowLeft />
      </button>
          <h1>{indicacoes[index].nome_livro}</h1>

          <p>
            {indicacoes[index].descricao} Uma tentação constante que cerca a
            vida cristã é a inversão do chamado: a presunção de que Deus precisa
            abençoar nosso caminho e seguir nossos planos e sonhos. Essa postura
            é enganosa e faz parecer que Deus só é fiel quando nos abençoa. Mas
            e se Deus derrubar o nosso sorvete, ele deixa de ser fiel? Claro que
            não! Ele continua sendo um Pai sábio e um Deus misericordioso mesmo
            em meio às nossas frustrações. Às vezes, ele só quer chamar nossa
            atenção para o caminho certo. Você já deve ter testemunhado gente
            adulta se comportando como criança por não ter a vida que pediu a
            Deus. É porque pediu errado! Neste livro, Rodrigo Bibo, do podcast
            Bibotalk, apresenta o caminho do discipulado, o meio para “sonhar” o
            que Deus já planejou. Aprenda a enxergar e seguir a vontade soberana
            de Deus expressa em Sua Palavra, tendo uma vida de serviço dedicada
            a Cristo.
          </p>

          <h4 className={styles.autor}>{indicacoes[index].nome_autor}</h4>
        </div>
        <div className={styles.grid2}>
          <Image
            src={indicacoes[index].foto_capa}
            alt={indicacoes[index].nome_livro}
            width={300}
            height={450}
            className={styles.image}
          />
          <Image
            src={indicacoes[index].foto_capa}
            alt={indicacoes[index].nome_livro}
            width={300}
            height={450}
            className={styles.image1}
          />
          <Image
            src={indicacoes[index].foto_capa}
            alt={indicacoes[index].nome_livro}
            width={300}
            height={450}
            className={styles.image2}
          />
          <button className={styles.arrow2} onClick={nextSlide}>
        <FaArrowRight />
      </button>
        </div>
      </div>
    </div>
  );
};

export default IndicacoesDisplay;
