"use client";
import React, { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Button from "@/componentes/forms/button";
import Input from "@/componentes/forms/input";
import styles from "./cadastrarLivro.module.css";
import Image from "next/image";

function FormButton() {
  const { pending } = useFormStatus();
  return <>{pending ? <Button disabled>Salvando...</Button> : <Button>Salvar</Button>}</>;
}

type Categoria = {
  categoria_principal: string;
  cor_cima: string;
  cor_baixo: string;
};

export default function CadastrarLivro({ onToggle }: { onToggle?: () => void }) {
  // Estados principais
  const [nomeLivro, setNomeLivro] = useState("");
  const [descricao, setDescricao] = useState("");
  const [anoPublicacao, setAnoPublicacao] = useState("");
  const [quantidade_paginas, setQuantidadePaginas] = useState("");
  const [quantidade_estoque, setQuantidadeEstoque] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategorias, setSubcategorias] = useState<string[]>([""]);
  const [corCima, setCorCima] = useState("#000000");
  const [corBaixo, setCorBaixo] = useState("#FFFFFF");

  // Editora – apenas nome
  const [editora, setEditora] = useState("");
  const [editoraSugestoes, setEditoraSugestoes] = useState<string[]>([]);
  const [showEditoraSugestoes, setShowEditoraSugestoes] = useState(false);

  // Capa
  const [capaLivro, setCapaLivro] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);

  // Sugestões
  const [categoriaSugestoes, setCategoriaSugestoes] = useState<Categoria[]>([]);
  const [showCategoriaSugestoes, setShowCategoriaSugestoes] = useState(false);

  const [autores, setAutores] = useState<string[]>([""]);
  const [autorSugestoes, setAutorSugestoes] = useState<string[]>([]);
  const [showAutorSugestoes, setShowAutorSugestoes] = useState<number | null>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const [categoriaRes, autorRes, editoraRes] = await Promise.all([
          fetch("https://api.helenaramazzotte.online/api/sugestoes/categorias"),
          fetch("https://api.helenaramazzotte.online/api/sugestoes/autores"),
          fetch("https://api.helenaramazzotte.online/api/sugestoes/editoras"),
        ]);

        const categorias: Categoria[] = await categoriaRes.json();
        const autoresLista: string[] = await autorRes.json();
        const editorasApi: { nome_editora: string }[] = await editoraRes.json();

        setCategoriaSugestoes(categorias);
        setAutorSugestoes(autoresLista);
        setEditoraSugestoes(editorasApi.map((e) => e.nome_editora));
      } catch (error) {
        console.error("Erro ao buscar sugestões:", error);
      }
    }
    fetchSuggestions();
  }, []);

  // Preview da capa
  useEffect(() => {
    if (capaLivro) {
      const objectUrl = URL.createObjectURL(capaLivro);
      setCapaPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setCapaPreview(null);
  }, [capaLivro]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("nomeLivro", nomeLivro);
    formData.append("descricao", descricao);
    formData.append("anoPublicacao", anoPublicacao);
    formData.append("categoria_principal", categoria);
    formData.append("quantidade_paginas", quantidade_paginas);
    formData.append("quantidade_estoque", quantidade_estoque);
    formData.append("cor_cima", corCima);
    formData.append("cor_baixo", corBaixo);
    formData.append("editora", editora); // apenas o nome

    // autores[] e subcategorias[]
    autores.forEach((autor, index) => formData.append(`autores[${index}]`, autor));
    subcategorias.forEach((sub, index) => formData.append(`subcategorias[${index}]`, sub));

    if (capaLivro) formData.append("foto_capa", capaLivro);

    try {
      const resp = await fetch("https://api.helenaramazzotte.online/livro", {
        method: "POST",
        body: formData,
      });

      if (resp.ok) {
        alert("Livro cadastrado com sucesso!");
        onToggle?.();

        // limpa
        setNomeLivro("");
        setDescricao("");
        setAnoPublicacao("");
        setQuantidadePaginas("");
        setQuantidadeEstoque("");
        setCategoria("");
        setSubcategorias([""]);
        setAutores([""]);
        setCorCima("#000000");
        setCorBaixo("#FFFFFF");
        setEditora("");
        setCapaLivro(null);
        setCapaPreview(null);
      } else {
        const err = await resp.json().catch(() => ({}));
        console.error("Erro ao cadastrar livro:", err);
        alert("Erro ao cadastrar livro.");
      }
    } catch (error) {
      console.error("Erro no envio:", error);
      alert("Erro ao cadastrar livro (network).");
    }
  };

  const handleSubcategoriaChange = (index: number, value: string) => {
    const novas = [...subcategorias];
    novas[index] = value;
    setSubcategorias(novas);
  };

  const addSubcategoryInput = () => setSubcategorias((s) => [...s, ""]);

  const handleCategoriaSelect = (categoriaNome: string) => {
    setCategoria(categoriaNome);
    const selecionada = categoriaSugestoes.find((c) => c.categoria_principal === categoriaNome);
    if (selecionada) {
      setCorCima(selecionada.cor_cima);
      setCorBaixo(selecionada.cor_baixo);
    }
    setShowCategoriaSugestoes(false);
  };

  const handleAutorSelect = (index: number, autor: string) => {
    const novos = [...autores];
    novos[index] = autor;
    setAutores(novos);
    setShowAutorSugestoes(null);
  };

  const handleAutorChange = (index: number, value: string) => {
    const novos = [...autores];
    novos[index] = value;
    setAutores(novos);
    setShowAutorSugestoes(index);
  };

  return (
    <div className={styles.containerCadastrar}>
      <h1 className={styles.titleCadastrar}>Cadastrar Livro</h1>

      <form className={styles.form} onSubmit={handleFormSubmit}>
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
            placeholder="Escreva a sinopse / descrição do livro…"
          />
        </div>

        <Input
          label="Ano de Publicação"
          name="anoPublicacao"
          type="number"
          value={anoPublicacao}
          onChange={(e) => setAnoPublicacao(e.target.value)}
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
            onClick={() => setShowCategoriaSugestoes((p) => !p)}
            className={styles.dropdownButton}
          >
            ▼
          </button>
          {showCategoriaSugestoes && (
            <ul className={styles.suggestionList}>
              {categoriaSugestoes.map((sugestao, i) => (
                <li key={i} onClick={() => handleCategoriaSelect(sugestao.categoria_principal)}>
                  {sugestao.categoria_principal}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cores da categoria */}
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
          {subcategorias.map((sub, index) => (
            <Input
              label="Subcategorias"
              key={index}
              name={`subcategoria_${index}`}
              type="text"
              value={sub}
              onChange={(e) => handleSubcategoriaChange(index, e.target.value)}
            />
          ))}
          <button className={styles.btSub} type="button" onClick={addSubcategoryInput}>
            Adicionar mais Subcategorias
          </button>
        </div>

        {/* Autores + sugestões */}
        <div className={styles.inputContainer}>
          {autores.map((autor, index) => (
            <div key={index} className={styles.suggestionContainer}>
              <Input
                label="Autor"
                name={`autor_${index}`}
                type="text"
                value={autor}
                onChange={(e) => handleAutorChange(index, e.target.value)}
                onFocus={() => setShowAutorSugestoes(index)}
              />
              <button
                type="button"
                onClick={() => setShowAutorSugestoes(index)}
                className={styles.dropdownButton}
              >
                ▼
              </button>

              {showAutorSugestoes === index && (
                <ul className={styles.suggestionList}>
                  {autorSugestoes
                    .filter((s) => s.toLowerCase().includes((autores[index] || "").toLowerCase()))
                    .map((s, i) => (
                      <li key={i} onClick={() => handleAutorSelect(index, s)}>
                        {s}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}

          <button type="button" onClick={() => setAutores((a) => [...a, ""])} className={styles.btAdd}>
            Adicionar Autor
          </button>
        </div>

        {/* Editora – apenas nome + sugestões (opcional) */}
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
            onClick={() => setShowEditoraSugestoes((p) => !p)}
            className={styles.dropdownButton}
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
              alt="Preview da capa do livro"
              className={styles.capaPreview}
              width={200}
              height={400}
            />
          </div>
        )}

        <FormButton />
      </form>
    </div>
  );
}
