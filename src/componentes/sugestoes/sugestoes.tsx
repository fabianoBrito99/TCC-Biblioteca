import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./sugestoes.module.css"; // Importando CSS module

interface Livro {
  id_livro: number;
  nome_livro: string;
  nome_autor: string;
  foto_capa: any; // Pode vir como Buffer ou Base64
}

interface Props {
  categoria: string;
}

export default function SugestoesLivros({ categoria }: Props) {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const livrosPorPagina = 20;
  const router = useRouter();

  useEffect(() => {
    async function fetchLivros() {
      try {
        const response = await fetch(`http://localhost:4000/livro/categoria/${encodeURIComponent(categoria)}`);
        if (!response.ok) throw new Error("Erro ao buscar livros.");
        const data = await response.json();
        setLivros(data.livros);
      } catch (error) {
        console.error(error);
      }
    }

    if (categoria) {
      fetchLivros();
    }
  }, [categoria]);

  // Função para converter Buffer para Base64
  const getImagemBase64 = (fotoCapa: any) => {
    if (!fotoCapa) return "/img/default-book.png"; // Se não houver imagem, usa placeholder
    if (typeof fotoCapa === "string" && fotoCapa.includes("data:image")) return fotoCapa; // Já é Base64
    if (fotoCapa.type === "Buffer") {
      return `data:image/jpeg;base64,${Buffer.from(fotoCapa.data).toString("base64")}`;
    }
    return "/img/default-book.png";
  };

  // Paginação
  const totalPaginas = Math.ceil(livros.length / livrosPorPagina);
  const livrosExibidos = livros.slice(
    (paginaAtual - 1) * livrosPorPagina,
    paginaAtual * livrosPorPagina
  );

  return (
    <div className={styles.container}>
  
      <div className={styles.grid}>
        {livrosExibidos.map((livro) => (
          <div 
            key={livro.id_livro} 
            className={styles.cardLivro} 
            onClick={() => router.push(`/livro/${livro.id_livro}`)}
          >
            <img 
              src={getImagemBase64(livro.foto_capa)}
              alt={livro.nome_livro} 
              width={150} 
              height={220} 
              style={{ objectFit: "cover", width: "auto", height: "auto" }}
            />
            <h3>{livro.nome_livro}</h3>
            <p>{livro.nome_autor}</p>
          </div>
        ))}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaAtual === 1}
          >
            ⬅️ Anterior
          </button>
          <span> Página {paginaAtual} de {totalPaginas} </span>
          <button
            onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
            disabled={paginaAtual === totalPaginas}
          >
            Próxima ➡️
          </button>
        </div>
      )}
    </div>
  );
}
