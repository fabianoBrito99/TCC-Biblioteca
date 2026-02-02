"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Button from "../forms/button";
import Input from "../forms/input";
import styles from "../cadastrrarLivro/cadastrarLivro.module.css"; // reaproveita o css do cadastro

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api.helenaramazzotte.online";

type Props = { id: string };

type Categoria = {
  categoria_principal: string;
  cor_cima: string;
  cor_baixo: string;
};

export default function EditarLivroForm({ id }: Props) {
  // estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nomeLivro, setNomeLivro] = useState("");
  const [descricao, setDescricao] = useState("");
  const [anoPublicacao, setAnoPublicacao] = useState("");
  const [quantidade_paginas, setQuantidadePaginas] = useState("");
  const [quantidade_estoque, setQuantidadeEstoque] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategorias, setSubcategorias] = useState<string[]>([""]);
  const [corCima, setCorCima] = useState("#000000");
  const [corBaixo, setCorBaixo] = useState("#FFFFFF");

  const [autores, setAutores] = useState<string[]>([""]);
  const [editora, setEditora] = useState("");

  // sugestões
  const [categoriaSugestoes, setCategoriaSugestoes] = useState<Categoria[]>([]);
  const [autorSugestoes, setAutorSugestoes] = useState<string[]>([]);
  const [editoraSugestoes, setEditoraSugestoes] = useState<string[]>([]);
  const [showCategoriaSugestoes, setShowCategoriaSugestoes] = useState(false);
  const [showAutorSugestoes, setShowAutorSugestoes] = useState<number | null>(
    null
  );
  const [showEditoraSugestoes, setShowEditoraSugestoes] = useState(false);

  // capa
  const [capaLivro, setCapaLivro] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null); // pode ser URL existente
  const [urlCapaExistente, setUrlCapaExistente] = useState<string | null>(null);

  // carrega sugestões (categorias, autores, editoras)
  useEffect(() => {
    (async () => {
      try {
        const [catRes, autRes, ediRes] = await Promise.all([
          fetch(`${API_BASE}/api/sugestoes/categorias`),
          fetch(`${API_BASE}/api/sugestoes/autores`),
          fetch(`${API_BASE}/api/sugestoes/editoras`),
        ]);
        setCategoriaSugestoes(await catRes.json());
        setAutorSugestoes(await autRes.json());
        const editorasApi: { nome_editora: string }[] = await ediRes.json();
        setEditoraSugestoes(editorasApi.map((e) => e.nome_editora));
      } catch (e) {
        console.error("Erro sugestões:", e);
      }
    })();
  }, []);

  // carrega dados do livro
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const resp = await fetch(`${API_BASE}/livro/${id}`, {
          cache: "no-store",
        });
        if (!resp.ok) throw new Error("Falha ao buscar livro");
        const l = await resp.json();

        setNomeLivro(l?.nome_livro ?? "");
        setDescricao(l?.descricao ?? "");
        setAnoPublicacao(String(l?.ano_publicacao ?? "").slice(0, 10));
        setQuantidadePaginas(String(l?.quantidade_paginas ?? ""));
        setQuantidadeEstoque(String(l?.quantidade_estoque ?? ""));
        setCategoria(l?.categoria_principal ?? "");
        setSubcategorias(
          Array.isArray(l?.subcategorias) && l.subcategorias.length
            ? l.subcategorias
            : [""]
        );
        setAutores(
          Array.isArray(l?.autores) && l.autores.length ? l.autores : [""]
        );
        setEditora(l?.nome_editora ?? "");

        const capaUrl = l?.foto_capa_url || l?.capa || null;
        setUrlCapaExistente(capaUrl);
        setCapaPreview(capaUrl);

        // tenta cores
        const sug = categoriaSugestoes.find(
          (c) => c.categoria_principal === l?.categoria_principal
        );
        if (sug) {
          setCorCima(sug.cor_cima);
          setCorBaixo(sug.cor_baixo);
        }
      } catch (e) {
        console.error(e);
        alert("Não foi possível carregar o livro.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, categoriaSugestoes.length]);

  // preview quando seleciona nova imagem
  useEffect(() => {
    if (capaLivro) {
      const url = URL.createObjectURL(capaLivro);
      setCapaPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCapaPreview(urlCapaExistente);
    }
  }, [capaLivro, urlCapaExistente]);

  const handleSalvar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append("nomeLivro", nomeLivro);
    formData.append("descricao", descricao);
    formData.append("anoPublicacao", anoPublicacao);
    formData.append("categoria_principal", categoria);
    formData.append("quantidade_paginas", quantidade_paginas);
    formData.append("quantidade_estoque", quantidade_estoque);
    formData.append("cor_cima", corCima);
    formData.append("cor_baixo", corBaixo);
    formData.append("editora", editora);

    autores.forEach((a, i) => formData.append(`autores[${i}]`, a));
    subcategorias.forEach((s, i) => formData.append(`subcategorias[${i}]`, s));

    if (capaLivro) formData.append("foto_capa", capaLivro); // mantém a antiga se não enviar

    try {
      const resp = await fetch(`${API_BASE}/livro/${id}`, {
        method: "PUT",
        body: formData,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.erro || "Falha ao salvar");
      }
      alert("Livro atualizado com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubcategoriaChange = (index: number, value: string) => {
    const k = [...subcategorias];
    k[index] = value;
    setSubcategorias(k);
  };
  const addSubcategoria = () => setSubcategorias((s) => [...s, ""]);

  const handleCategoriaSelect = (nome: string) => {
    setCategoria(nome);
    const c = categoriaSugestoes.find((x) => x.categoria_principal === nome);
    if (c) {
      setCorCima(c.cor_cima);
      setCorBaixo(c.cor_baixo);
    }
    setShowCategoriaSugestoes(false);
  };

  if (loading) return <div className={styles.containerCadastrar}>Carregando…</div>;

  return (
    <div className={styles.containerCadastrar}>
      <h1 className={styles.titleCadastrar}>Editar Livro</h1>

      <form className={styles.form} onSubmit={handleSalvar}>
        <Input
          label="Nome do Livro"
          name="nomeLivro"
          type="text"
          value={nomeLivro}
          onChange={(e) => setNomeLivro(e.target.value)}
        />

        <div className={styles.inputContainer}>
    
          <textarea
            id="descricao"
            name="descricao"
            className={styles.textarea}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={6}
            placeholder="Sinopse / descrição…"
          />
        </div>

        <Input
          label="Ano de Publicação"
          name="anoPublicacao"
          type="text"
          value={anoPublicacao}
          onChange={(e) => setAnoPublicacao(e.target.value)}
          placeholder="2018 ou 2018-01-01"
        />
        <Input
          label="Quantidade de Páginas"
          name="quantidade_paginas"
          type="number"
          value={quantidade_paginas}
          onChange={(e) => setQuantidadePaginas(e.target.value)}
        />
        <Input
          label="Quantidade em Estoque"
          name="quantidade_estoque"
          type="number"
          value={quantidade_estoque}
          onChange={(e) => setQuantidadeEstoque(e.target.value)}
        />

        {/* Categoria + sugestões */}
        <div className={styles.suggestionContainer}>
          <Input
            label="Categoria"
            name="categoria"
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            onFocus={() => setShowCategoriaSugestoes(true)}
          />
          <button
            type="button"
            className={styles.dropdownButton}
            onClick={() => setShowCategoriaSugestoes((p) => !p)}
          >
            ▼
          </button>
          {showCategoriaSugestoes && (
            <ul className={styles.suggestionList}>
              {categoriaSugestoes.map((s, i) => (
                <li key={i} onClick={() => handleCategoriaSelect(s.categoria_principal)}>
                  {s.categoria_principal}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* cores */}
        <div className={styles.colorInputs}>
          <Input
            label="Cor Topo"
            name="corCima"
            type="color"
            value={corCima}
            onChange={(e) => setCorCima(e.target.value)}
          />
          <Input
            label="Cor Base"
            name="corBaixo"
            type="color"
            value={corBaixo}
            onChange={(e) => setCorBaixo(e.target.value)}
          />
        </div>

        <div
          className={styles.gradientPreview}
          style={{ background: `linear-gradient(to bottom, ${corCima}, ${corBaixo})` }}
        />

        {/* Subcategorias */}
        <div>
          {subcategorias.map((sub, idx) => (
            <Input
              key={idx}
              label="Subcategorias"
              name={`sub_${idx}`}
              type="text"
              value={sub}
              onChange={(e) => handleSubcategoriaChange(idx, e.target.value)}
            />
          ))}
          <button type="button" onClick={addSubcategoria} className={styles.btSub}>
            Adicionar mais Subcategorias
          </button>
        </div>

        {/* Autores */}
        <div className={styles.inputContainer}>
          {autores.map((autor, i) => (
            <div key={i} className={styles.suggestionContainer}>
              <Input
                label="Autor"
                name={`autor_${i}`}
                type="text"
                value={autor}
                onChange={(e) => {
                  const n = [...autores];
                  n[i] = e.target.value;
                  setAutores(n);
                  setShowAutorSugestoes(i);
                }}
                onFocus={() => setShowAutorSugestoes(i)}
              />
              <button
                type="button"
                className={styles.dropdownButton}
                onClick={() => setShowAutorSugestoes(i)}
              >
                ▼
              </button>
              {showAutorSugestoes === i && (
                <ul className={styles.suggestionList}>
                  {autorSugestoes
                    .filter((s) =>
                      s.toLowerCase().includes((autores[i] || "").toLowerCase())
                    )
                    .map((s, k) => (
                      <li
                        key={k}
                        onClick={() => {
                          const n = [...autores];
                          n[i] = s;
                          setAutores(n);
                          setShowAutorSugestoes(null);
                        }}
                      >
                        {s}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
          <button
            type="button"
            className={styles.btAdd}
            onClick={() => setAutores((a) => [...a, ""])}
          >
            Adicionar Autor
          </button>
        </div>

        {/* Editora */}
        <div className={styles.suggestionContainer}>
          <Input
            label="Editora"
            name="editora"
            type="text"
            value={editora}
            onChange={(e) => setEditora(e.target.value)}
            onFocus={() => setShowEditoraSugestoes(true)}
          />
          <button
            type="button"
            className={styles.dropdownButton}
            onClick={() => setShowEditoraSugestoes((p) => !p)}
          >
            ▼
          </button>
          {showEditoraSugestoes && (
            <ul className={styles.suggestionList}>
              {editoraSugestoes
                .filter((n) => n.toLowerCase().includes(editora.toLowerCase()))
                .map((n, i) => (
                  <li key={i} onClick={() => { setEditora(n); setShowEditoraSugestoes(false); }}>
                    {n}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Capa */}
        <Input
          label="Capa do Livro"
          name="capaLivro"
          type="file"
          accept="image/*"
          onChange={(e) => setCapaLivro(e.target.files?.[0] || null)}
        />
        {capaPreview && (
          <div className={styles.capaContainerLivro}>
            <Image
              src={capaPreview}
              alt="Preview da capa"
              className={styles.capaPreview}
              width={200}
              height={400}
            />
          </div>
        )}

        <Button disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</Button>
      </form>
    </div>
  );
}
