"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./livros.module.css";

/** Ajuste se precisar apontar para outro host */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api.helenaramazzotte.online";
/** Página de cadastro/edição */
const CADASTRAR_PATH = "/editar";

type Livro = {
  id_livro: number | string;
  nome_livro: string;
  foto_capa_url?: string | null;
  capa?: string | null;
  autor?: string | null;
  categoria_principal?: string | null;
  media_avaliacoes: number;
};

export default function ListarLivrosPage() {
  const router = useRouter();
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const carregar = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/livro`, { cache: "no-store" });
      if (!resp.ok) throw new Error("Falha ao listar livros");
      const data = await resp.json();
      setLivros(Array.isArray(data?.livros) ? data.livros : []);
    } catch (e) {
      console.error(e);
      setLivros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const s = busca.trim().toLowerCase();
    if (!s) return livros;
    return livros.filter((l) => {
      const nome = (l.nome_livro ?? "").toLowerCase();
      const autor = (l.autor ?? "").toLowerCase();
      const cat = (l.categoria_principal ?? "").toLowerCase();
      return nome.includes(s) || autor.includes(s) || cat.includes(s);
    });
  }, [livros, busca]);

  const excluir = async (id: number | string) => {
    const ok = window.confirm(
      "Tem certeza que deseja excluir este livro? Essa ação não pode ser desfeita."
    );
    if (!ok) return;
    try {
      const resp = await fetch(
        `${API_BASE}/livro/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.erro || "Falha ao excluir");
      }
      setLivros((prev) =>
        prev.filter((x) => String(x.id_livro) !== String(id))
      );
    } catch (e) {
      console.error(e);
      alert("Não foi possível excluir o livro.");
    }
  };

  const editar = (id: number | string) => {
    router.push(`${CADASTRAR_PATH}/${id}`);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1>Livros</h1>
        <div className={styles.tools}>
          <input
            className={styles.search}
            placeholder="Buscar por nome, autor ou categoria…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button
            className={styles.refresh}
            onClick={carregar}
            disabled={loading}
          >
            {loading ? "Carregando..." : "Atualizar"}
          </button>
          <button
            className={styles.new}
            onClick={() => router.push(CADASTRAR_PATH)}
          >
            + Novo Livro
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando…</div>
      ) : filtrados.length === 0 ? (
        <div className={styles.empty}>Nenhum livro encontrado.</div>
      ) : (
        <div className={styles.grid}>
          {filtrados.map((livro) => {
            const capa =
              livro.foto_capa_url || livro.capa || "/placeholder-cover.png";
            return (
              <div key={livro.id_livro} className={styles.card}>
                <div className={styles.cover}>
                  <Image
                    src={capa}
                    alt={livro.nome_livro}
                    width={140}
                    height={210}
                    style={{ objectFit: "cover", borderRadius: 8 }}
                  />
                </div>
                <div className={styles.body}>
                  <h3 className={styles.title}>{livro.nome_livro}</h3>
                  <p className={styles.muted}>
                    {livro.autor ? `Autor: ${livro.autor}` : "Autor: —"}
                  </p>
                  <p className={styles.mutedSmall}>
                    {livro.categoria_principal || "Sem categoria"}
                  </p>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.edit}
                    onClick={() => editar(livro.id_livro)}
                  >
                    Editar
                  </button>
                  <button
                    className={styles.delete}
                    onClick={() => excluir(livro.id_livro)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
