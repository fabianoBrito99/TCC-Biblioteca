"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useFormStatus } from "react-dom";
import type { LoggerMessage, RecognizeResult } from "tesseract.js";

import Button from "@/componentes/forms/button";
import Input from "@/componentes/forms/input";
import styles from "./cadastrarLivro.module.css";

function FormButton() {
  const { pending } = useFormStatus();
  return <>{pending ? <Button disabled>Salvando...</Button> : <Button>Salvar</Button>}</>;
}

type Categoria = {
  categoria_principal: string;
  cor_cima: string;
  cor_baixo: string;
};

type OcrImageSource = HTMLCanvasElement | HTMLImageElement | Blob;

export default function CadastrarLivro({ onToggle }: { onToggle?: () => void }) {
  // ==========================
  // ESTADOS DO FORM
  // ==========================
  const [nomeLivro, setNomeLivro] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [anoPublicacao, setAnoPublicacao] = useState<string>("");
  const [quantidade_paginas, setQuantidadePaginas] = useState<string>("");
  const [quantidade_estoque, setQuantidadeEstoque] = useState<string>("");

  const [categoria, setCategoria] = useState<string>("");
  const [subcategorias, setSubcategorias] = useState<string[]>([""]);

  const [corCima, setCorCima] = useState<string>("#000000");
  const [corBaixo, setCorBaixo] = useState<string>("#FFFFFF");

  const [editora, setEditora] = useState<string>("");
  const [editoraSugestoes, setEditoraSugestoes] = useState<string[]>([]);
  const [showEditoraSugestoes, setShowEditoraSugestoes] = useState<boolean>(false);

  const [categoriaSugestoes, setCategoriaSugestoes] = useState<Categoria[]>([]);
  const [showCategoriaSugestoes, setShowCategoriaSugestoes] = useState<boolean>(false);

  const [autores, setAutores] = useState<string[]>([""]);
  const [autorSugestoes, setAutorSugestoes] = useState<string[]>([]);
  const [showAutorSugestoes, setShowAutorSugestoes] = useState<number | null>(null);

  // Capa
  const [capaLivro, setCapaLivro] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);

  // ==========================
  // OCR (SINOPSE POR CÂMERA)
  // ==========================
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [ocrOpen, setOcrOpen] = useState<boolean>(false);
  const [ocrBusy, setOcrBusy] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrMsg, setOcrMsg] = useState<string>("");
  const [ocrError, setOcrError] = useState<string | null>(null);

  // ==========================
  // SUGESTÕES (API)
  // ==========================
  useEffect(() => {
    async function fetchSuggestions(): Promise<void> {
      try {
        const [categoriaRes, autorRes, editoraRes] = await Promise.all([
          fetch("https://api.helenaramazzotte.online/api/sugestoes/categorias"),
          fetch("https://api.helenaramazzotte.online/api/sugestoes/autores"),
          fetch("https://api.helenaramazzotte.online/api/sugestoes/editoras"),
        ]);

        const categorias = (await categoriaRes.json()) as Categoria[];
        const autoresLista = (await autorRes.json()) as string[];
        const editorasApi = (await editoraRes.json()) as { nome_editora: string }[];

        setCategoriaSugestoes(categorias);
        setAutorSugestoes(autoresLista);
        setEditoraSugestoes(editorasApi.map((e) => e.nome_editora));
      } catch (error) {
        console.error("Erro ao buscar sugestões:", error);
      }
    }

    void fetchSuggestions();
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

  // ==========================
  // OCR HELPERS
  // ==========================
  const stopStream = (): void => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } catch {
      // silencioso
    }
  };

  const closeOcr = (): void => {
    stopStream();
    setOcrOpen(false);
    setOcrBusy(false);
    setOcrProgress(0);
    setOcrMsg("");
    setOcrError(null);
  };

  const openOcr = async (): Promise<void> => {
    setOcrError(null);
    setOcrMsg("");
    setOcrProgress(0);

    // Se não tiver getUserMedia, cai no input (no celular abre câmera também)
    if (!navigator.mediaDevices?.getUserMedia) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      setOcrOpen(true);

      setTimeout(() => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          void video.play();
        }
      }, 60);
    } catch (err) {
      console.warn("Falha ao abrir câmera ao vivo, usando fallback:", err);
      fileInputRef.current?.click();
    }
  };

  // ✅ v5/v6: NÃO existe mais loadLanguage/initialize
  // ✅ passa idioma e logger no createWorker(lang, oem, { logger })
  const runOcrOnImage = async (image: OcrImageSource): Promise<void> => {
    setOcrBusy(true);
    setOcrError(null);
    setOcrMsg("Iniciando OCR...");
    setOcrProgress(0);

    try {
      const tesseract = await import("tesseract.js");
      const createWorker = tesseract.createWorker;

      const worker = await createWorker("por", 1, {
        logger: (m: LoggerMessage) => {
          if (m.status) setOcrMsg(m.status);
          if (typeof m.progress === "number") setOcrProgress(Math.round(m.progress * 100));
        },
      });

      const result: RecognizeResult = await worker.recognize(image);
      const texto: string = result.data.text.trim();

      await worker.terminate();

      if (!texto) {
        setOcrError("Não foi possível identificar texto. Aproxima mais e melhora a iluminação.");
        return;
      }

      setDescricao((prev) => (prev.trim() ? `${prev}\n\n${texto}` : texto));
      closeOcr();
    } catch (error) {
      console.error(error);
      setOcrError("Erro ao processar OCR.");
    } finally {
      setOcrBusy(false);
    }
  };

  const captureFromVideo = async (): Promise<void> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    await runOcrOnImage(canvas);
  };

  const handleFileOcr = async (file: File | null): Promise<void> => {
    if (!file) return;

    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        await runOcrOnImage(img);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setOcrError("Não consegui abrir a imagem selecionada.");
    };

    img.src = url;
  };

  // ==========================
  // FORM HELPERS
  // ==========================
  const handleSubcategoriaChange = (index: number, value: string): void => {
    setSubcategorias((prev) => {
      const novo = [...prev];
      novo[index] = value;
      return novo;
    });
  };

  const addSubcategoryInput = (): void => {
    setSubcategorias((prev) => [...prev, ""]);
  };

  const handleCategoriaSelect = (categoriaNome: string): void => {
    setCategoria(categoriaNome);
    const selecionada = categoriaSugestoes.find((c) => c.categoria_principal === categoriaNome);
    if (selecionada) {
      setCorCima(selecionada.cor_cima);
      setCorBaixo(selecionada.cor_baixo);
    }
    setShowCategoriaSugestoes(false);
  };

  const handleAutorSelect = (index: number, autor: string): void => {
    setAutores((prev) => {
      const novo = [...prev];
      novo[index] = autor;
      return novo;
    });
    setShowAutorSugestoes(null);
  };

  const handleAutorChange = (index: number, value: string): void => {
    setAutores((prev) => {
      const novo = [...prev];
      novo[index] = value;
      return novo;
    });
    setShowAutorSugestoes(index);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
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
    formData.append("editora", editora);

    autores.forEach((autor, i) => formData.append(`autores[${i}]`, autor));
    subcategorias.forEach((sub, i) => formData.append(`subcategorias[${i}]`, sub));
    if (capaLivro) formData.append("foto_capa", capaLivro);

    try {
      const resp = await fetch("https://api.helenaramazzotte.online/livro", {
        method: "POST",
        body: formData,
      });

      if (resp.ok) {
        alert("Livro cadastrado com sucesso!");
        onToggle?.();

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
        const err = (await resp.json().catch(() => ({}))) as unknown;
        console.error("Erro ao cadastrar livro:", err);
        alert("Erro ao cadastrar livro.");
      }
    } catch (error) {
      console.error("Erro no envio:", error);
      alert("Erro ao cadastrar livro (network).");
    }
  };

  // ==========================
  // RENDER
  // ==========================
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

        {/* SINOPSE + CÂMERA */}
        <div className={styles.descricaoWrap}>
          <label className={styles.descricaoLabel} htmlFor="descricao">
            Sinopse / Descrição
          </label>

          <button
            type="button"
            className={styles.cameraButton}
            onClick={() => void openOcr()}
            title="Ler sinopse com a câmera (OCR)"
            aria-label="Ler sinopse com a câmera (OCR)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M9 4.5 7.8 6H6a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-1.8L15 4.5H9Zm3 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
                fill="currentColor"
              />
            </svg>
            <span className={styles.cameraText}>Ler com câmera</span>
          </button>

          <textarea
            id="descricao"
            name="descricao"
            className={styles.textarea}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={6}
            placeholder="Escreva a sinopse / descrição do livro…"
          />

          {/* fallback: câmera/galeria */}
          <input
            ref={fileInputRef}
            className={styles.hiddenFile}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.currentTarget.value = "";
              void handleFileOcr(f);
            }}
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
              {categoriaSugestoes.map((sug, i) => (
                <li key={i} onClick={() => handleCategoriaSelect(sug.categoria_principal)}>
                  {sug.categoria_principal}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cores */}
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
              key={index}
              label="Subcategorias"
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

        {/* Autores */}
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
                  <li
                    key={i}
                    onClick={() => {
                      setEditora(n);
                      setShowEditoraSugestoes(false);
                    }}
                  >
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
          onChange={(e) => setCapaLivro(e.target.files?.[0] ?? null)}
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

      {/* MODAL OCR */}
      {ocrOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Ler sinopse com a câmera</h3>
              <button type="button" className={styles.modalClose} onClick={closeOcr} aria-label="Fechar">
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <video ref={videoRef} className={styles.video} playsInline muted />
              <canvas ref={canvasRef} className={styles.hiddenCanvas} />

              {(ocrBusy || ocrMsg || ocrError) && (
                <div className={styles.ocrStatus}>
                  {ocrError ? (
                    <p className={styles.ocrError}>{ocrError}</p>
                  ) : (
                    <>
                      <p className={styles.ocrMsg}>{ocrMsg || "Processando..."}</p>
                      <div className={styles.progressBar} aria-label="Progresso OCR">
                        <div className={styles.progressFill} style={{ width: `${ocrProgress}%` }} />
                      </div>
                      <p className={styles.ocrPct}>{ocrProgress}%</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrBusy}
              >
                Enviar foto (galeria)
              </button>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => void captureFromVideo()}
                disabled={ocrBusy}
              >
                {ocrBusy ? "Lendo..." : "Capturar e preencher"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
