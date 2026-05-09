"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./livros.module.css";

/** Ajuste se precisar apontar para outro host */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api.helenaramazzotte.online";
/** Página de cadastro/edição */
const CADASTRAR_PATH = "/editar";
const LIMITE_POR_PAGINA = 24;

type Livro = {
  id_livro: number | string;
  nome_livro: string;
  foto_capa_url?: string | null;
  capa?: string | null;
  autor?: string | null;
  categoria_principal?: string | null;
  media_avaliacoes: number;
  quantidade_estoque?: number | string;
};

type TotaisLivros = {
  livros_unicos: number;
  livros_total_estoque: number;
};

type Paginacao = {
  pagina: number;
  limite: number;
  total_itens: number;
  total_paginas: number;
  tem_proxima: boolean;
  tem_anterior: boolean;
};

export default function ListarLivrosPage() {
  const router = useRouter();
  const [livros, setLivros] = useState<Livro[]>([]);
  const [totais, setTotais] = useState<TotaisLivros>({ livros_unicos: 0, livros_total_estoque: 0 });
  const [paginacao, setPaginacao] = useState<Paginacao>({
    pagina: 1,
    limite: LIMITE_POR_PAGINA,
    total_itens: 0,
    total_paginas: 1,
    tem_proxima: false,
    tem_anterior: false,
  });
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const carregar = useCallback(async (pagina = paginaAtual, termoBusca = buscaDebounced, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("pagina", String(pagina));
      qs.set("limite", String(LIMITE_POR_PAGINA));
      if (termoBusca) qs.set("busca", termoBusca);

      const resp = await fetch(`${API_BASE}/livro?${qs.toString()}`, {
        cache: "no-store",
        signal,
      });
      if (!resp.ok) throw new Error("Falha ao listar livros");
      const data = await resp.json();
      const lista = Array.isArray(data?.livros) ? data.livros : [];
      setLivros(lista);

      const unicos = Number(data?.totais?.livros_unicos ?? 0);
      const totalEstoque = Number(data?.totais?.livros_total_estoque ?? 0);
      setTotais({
        livros_unicos: Number.isFinite(unicos) ? unicos : 0,
        livros_total_estoque: Number.isFinite(totalEstoque) ? totalEstoque : 0,
      });

      const totalPaginasApi = Number(data?.paginacao?.total_paginas ?? 1);
      const totalPaginas = Number.isFinite(totalPaginasApi) && totalPaginasApi > 0 ? totalPaginasApi : 1;
      const pag: Paginacao = {
        pagina: Number(data?.paginacao?.pagina ?? pagina),
        limite: Number(data?.paginacao?.limite ?? LIMITE_POR_PAGINA),
        total_itens: Number(data?.paginacao?.total_itens ?? 0),
        total_paginas: totalPaginas,
        tem_proxima: Boolean(data?.paginacao?.tem_proxima),
        tem_anterior: Boolean(data?.paginacao?.tem_anterior),
      };
      setPaginacao(pag);

      if (pagina > totalPaginas) {
        setPaginaAtual(totalPaginas);
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      console.error(e);
      setLivros([]);
      setTotais({ livros_unicos: 0, livros_total_estoque: 0 });
      setPaginacao({
        pagina: 1,
        limite: LIMITE_POR_PAGINA,
        total_itens: 0,
        total_paginas: 1,
        tem_proxima: false,
        tem_anterior: false,
      });
    } finally {
      setLoading(false);
    }
  }, [buscaDebounced, paginaAtual]);

  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaDebounced(busca.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [buscaDebounced]);

  useEffect(() => {
    const controller = new AbortController();
    carregar(paginaAtual, buscaDebounced, controller.signal);
    return () => controller.abort();
  }, [carregar, paginaAtual, buscaDebounced]);

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
      await carregar(paginaAtual, buscaDebounced);
    } catch (e) {
      console.error(e);
      alert("Não foi possível excluir o livro.");
    }
  };

  const editar = (id: number | string) => {
    router.push(`${CADASTRAR_PATH}/${id}`);
  };

  const paginasExibidas = useMemo(() => {
    const total = paginacao.total_paginas;
    const atual = paginaAtual;
    if (total <= 1) return [1] as Array<number | "...">;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const conjunto = new Set<number>([1, total, atual, atual - 1, atual + 1, atual - 2, atual + 2]);
    const validas = Array.from(conjunto)
      .filter((n) => n >= 1 && n <= total)
      .sort((a, b) => a - b);

    const saida: Array<number | "..."> = [];
    for (let i = 0; i < validas.length; i += 1) {
      const atualNum = validas[i];
      const anterior = validas[i - 1];
      if (i > 0 && atualNum - anterior > 1) {
        saida.push("...");
      }
      saida.push(atualNum);
    }
    return saida;
  }, [paginaAtual, paginacao.total_paginas]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1>Livros</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: "#374151" }}>
            Títulos únicos: <strong>{totais.livros_unicos}</strong>
          </span>
          <span style={{ fontSize: 14, color: "#374151" }}>
            Total em estoque: <strong>{totais.livros_total_estoque}</strong>
          </span>
        </div>
        <div className={styles.tools}>
          <input
            className={styles.search}
            placeholder="Buscar por nome, autor ou categoria…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button
            className={styles.refresh}
            onClick={() => carregar(paginaAtual, buscaDebounced)}
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
      ) : livros.length === 0 ? (
        <div className={styles.empty}>
          {buscaDebounced ? "Nenhum livro encontrado para esta busca." : "Nenhum livro encontrado."}
        </div>
      ) : (
        <div className={styles.grid}>
          {livros.map((livro) => {
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

      <div className={styles.paginationBar}>
        <div className={styles.paginationInfo}>
          Página <strong>{Math.min(paginaAtual, paginacao.total_paginas)}</strong> de{" "}
          <strong>{paginacao.total_paginas}</strong> • {paginacao.total_itens} resultado(s)
        </div>
        <div className={styles.paginationControls}>
          <button
            className={styles.pageBtn}
            onClick={() => setPaginaAtual(1)}
            disabled={loading || paginaAtual <= 1}
          >
            Primeira
          </button>
          <button
            className={styles.pageBtn}
            onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
            disabled={loading || !paginacao.tem_anterior}
          >
            Anterior
          </button>
          {paginasExibidas.map((item, idx) =>
            item === "..." ? (
              <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
                ...
              </span>
            ) : (
              <button
                key={item}
                className={`${styles.pageBtn} ${item === paginaAtual ? styles.pageBtnActive : ""}`}
                onClick={() => setPaginaAtual(item)}
                disabled={loading}
              >
                {item}
              </button>
            )
          )}
          <button
            className={styles.pageBtn}
            onClick={() => setPaginaAtual((p) => Math.min(paginacao.total_paginas, p + 1))}
            disabled={loading || !paginacao.tem_proxima}
          >
            Próxima
          </button>
          <button
            className={styles.pageBtn}
            onClick={() => setPaginaAtual(paginacao.total_paginas)}
            disabled={loading || paginaAtual >= paginacao.total_paginas}
          >
            Última
          </button>
        </div>
      </div>
    </div>
  );
}
