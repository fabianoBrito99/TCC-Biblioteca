"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useFormStatus } from "react-dom";

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
  // REFS IMPORTANTES
  // ==========================
  const descricaoRef = useRef<HTMLTextAreaElement | null>(null);

  // ==========================
  // OCR
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

  // Debug em produção via ?debug=1
  const [debugOcr, setDebugOcr] = useState<boolean>(false);

  // Modal de escolha do trecho
  const [ocrPickOpen, setOcrPickOpen] = useState<boolean>(false);
  const [ocrText, setOcrText] = useState<string>("");
  const ocrPickRef = useRef<HTMLTextAreaElement | null>(null);

  // ==========================
  // DEBUG PARAM
  // ==========================
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setDebugOcr(params.get("debug") === "1");
    } catch {
      setDebugOcr(false);
    }
  }, []);

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
  // HELPERS OCR
  // ==========================
  const isIOSDevice = (): boolean => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const iPadOS = ua.includes("Macintosh") && navigator.maxTouchPoints > 1;
    return iOS || iPadOS;
  };

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

  const closeCameraModal = (): void => {
    stopStream();
    setOcrOpen(false);
    setOcrBusy(false);
    setOcrProgress(0);
    setOcrMsg("");
    setOcrError(null);
  };

  const normalizeOcrText = (t: string): string => {
    return t
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  };

  // ✅ iPhone: file -> canvas (resolve HEIC e decode)
  const fileToCanvas = async (file: File, maxDim = 2000): Promise<HTMLCanvasElement> => {
    if ("createImageBitmap" in window) {
      try {
        const bitmap = await createImageBitmap(file);
        const { width, height } = bitmap;

        const scale = Math.min(1, maxDim / Math.max(width, height));
        const w = Math.max(1, Math.round(width * scale));
        const h = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Sem contexto 2D");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close?.();
        return canvas;
      } catch {
        // fallback
      }
    }

    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
      reader.readAsDataURL(file);
    });

    const imgEl: HTMLImageElement = await new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Falha ao decodificar imagem"));
      img.src = dataUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(imgEl.naturalWidth, imgEl.naturalHeight));
    const w = Math.max(1, Math.round(imgEl.naturalWidth * scale));
    const h = Math.max(1, Math.round(imgEl.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Sem contexto 2D");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imgEl, 0, 0, w, h);

    return canvas;
  };

  const openOcr = async (): Promise<void> => {
    setOcrError(null);
    setOcrMsg("");
    setOcrProgress(0);

    // iOS Safari costuma bloquear getUserMedia/autoplay; use captura por arquivo direto.
    if (isIOSDevice()) {
      fileInputRef.current?.click();
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setOcrError("A câmera ao vivo precisa de HTTPS. Use 'Usar foto'.");
      fileInputRef.current?.click();
      return;
    }

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

      const startVideo = (): void => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        void video.play();
      };

      // aguarda o modal renderizar
      setTimeout(startVideo, 60);
    } catch (err) {
      console.warn("Falha ao abrir câmera ao vivo, usando fallback:", err);
      fileInputRef.current?.click();
    }
  };

  // ✅ OCR via servidor (funciona em iPhone/Android/PC)
  const runOcrOnServer = async (blob: Blob): Promise<void> => {
    setOcrBusy(true);
    setOcrError(null);
    setOcrMsg("Enviando imagem...");
    setOcrProgress(0);

    try {
      setOcrMsg("Processando OCR no servidor...");
      setOcrProgress(30);

      const formData = new FormData();
      formData.append("image", blob, "sinopse.jpg");

      const resp = await fetch("https://api.helenaramazzotte.online/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = (await resp.json()) as { text?: string; error?: string };
      if (!resp.ok) {
        throw new Error(data.error || "OCR falhou no servidor");
      }

      const texto = normalizeOcrText(data.text || "");
      if (!texto) {
        setOcrError("Não foi possível identificar texto. Aproxima mais e melhora a iluminação.");
        return;
      }

      setOcrText(texto);
      closeCameraModal();
      setOcrPickOpen(true);

      setTimeout(() => {
        ocrPickRef.current?.focus();
      }, 60);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("OCR erro:", error);
      setOcrError(`OCR falhou: ${msg}`);
    } finally {
      setOcrProgress(100);
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

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, 0, 0, w, h);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) {
      setOcrError("Não consegui capturar a imagem da câmera.");
      return;
    }

    await runOcrOnServer(blob);
  };

  const handleFileOcr = async (file: File | null): Promise<void> => {
    if (!file) return;

    // não fecha forçado aqui (iOS pode “matar” a UI); só para stream se existir
    stopStream();

    setOcrBusy(true);
    setOcrError(null);
    setOcrMsg(`Preparando imagem... (${file.type || "sem type"})`);
    setOcrProgress(0);

    try {
      const canvas = await fileToCanvas(file, 2000);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Falha ao gerar imagem para OCR");
      await runOcrOnServer(blob);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("handleFileOcr erro:", err);
      setOcrBusy(false);
      setOcrError(`Não consegui processar a imagem: ${msg}`);
    }
  };

  // ==========================
  // ESCOLHER TRECHO
  // ==========================
  const getSelectedOcrText = (): string => {
    const el = ocrPickRef.current;
    if (!el) return ocrText;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = el.value.slice(start, end).trim();
    return selected.length > 0 ? selected : ocrText;
  };

  const applyOcrTextReplace = (): void => {
    const snippet = getSelectedOcrText();
    setDescricao(snippet);
    setOcrPickOpen(false);
    setOcrText("");
    setTimeout(() => descricaoRef.current?.focus(), 0);
  };

  const applyOcrTextAppend = (): void => {
    const snippet = getSelectedOcrText();
    setDescricao((prev) => (prev.trim() ? `${prev}\n\n${snippet}` : snippet));
    setOcrPickOpen(false);
    setOcrText("");
    setTimeout(() => descricaoRef.current?.focus(), 0);
  };

  const applyOcrTextInsertAtCursor = (): void => {
    const snippet = getSelectedOcrText();
    const target = descricaoRef.current;

    if (!target) {
      setDescricao((prev) => (prev.trim() ? `${prev}\n\n${snippet}` : snippet));
      setOcrPickOpen(false);
      setOcrText("");
      return;
    }

    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;

    const before = descricao.slice(0, start);
    const after = descricao.slice(end);

    const newText = `${before}${snippet}${after}`;
    setDescricao(newText);

    setTimeout(() => {
      target.focus();
      const pos = start + snippet.length;
      target.setSelectionRange(pos, pos);
    }, 0);

    setOcrPickOpen(false);
    setOcrText("");
  };

  const closeOcrPick = (): void => {
    setOcrPickOpen(false);
    setOcrText("");
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

        {/* SINOPSE */}
        <div className={styles.descricaoWrap}>
          <label className={styles.descricaoLabel} htmlFor="descricao">
            Sinopse / Descrição
          </label>

          <button type="button" className={styles.cameraButton} onClick={() => void openOcr()}>
            <span className={styles.cameraText}>📷 Ler com câmera</span>
          </button>

          <textarea
            ref={descricaoRef}
            id="descricao"
            name="descricao"
            className={styles.textarea}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={8}
            placeholder="Escreva a sinopse / descrição do livro..."
          />

          {(ocrBusy || ocrMsg || ocrError) && (
            <div className={styles.ocrInlineStatus}>
              {ocrError ? (
                <span className={styles.ocrInlineError}>{ocrError}</span>
              ) : (
                <span className={styles.ocrInlineMsg}>
                  {ocrMsg || "Processando..."} {ocrProgress ? `(${ocrProgress}%)` : ""}
                </span>
              )}
            </div>
          )}

          {/* ⚠️ iPhone: NÃO pode ser display:none (no CSS) */}
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
          <button type="button" onClick={() => setShowCategoriaSugestoes((p) => !p)} className={styles.dropdownButton}>
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
          <Input label="Cor Topo" name="corCima" type="color" value={corCima} onChange={(e) => setCorCima(e.target.value)} />
          <Input label="Cor Base" name="corBaixo" type="color" value={corBaixo} onChange={(e) => setCorBaixo(e.target.value)} />
        </div>

        <div className={styles.gradientPreview} style={{ background: `linear-gradient(to bottom, ${corCima}, ${corBaixo})` }} />

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
              <button type="button" onClick={() => setShowAutorSugestoes(index)} className={styles.dropdownButton}>
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
          <button type="button" onClick={() => setShowEditoraSugestoes((p) => !p)} className={styles.dropdownButton}>
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
            <Image src={capaPreview} alt="Preview da capa do livro" className={styles.capaPreview} width={200} height={400} />
          </div>
        )}

        <FormButton />
      </form>

      {/* ✅ DEBUG OVERLAY (produção com ?debug=1) */}
      {debugOcr && (
        <div className={styles.debugOverlay}>
          <div>
            <b>OCR msg:</b> {ocrMsg || "-"}
          </div>
          <div>
            <b>OCR progress:</b> {ocrProgress}%
          </div>
          <div>
            <b>OCR error:</b> {ocrError ?? "-"}
          </div>
          <div>
            <b>ocrOpen:</b> {String(ocrOpen)} | <b>ocrBusy:</b> {String(ocrBusy)}
          </div>
          <div>
            <b>iOS:</b> {String(isIOSDevice())} | <b>secure:</b> {String(typeof window !== "undefined" && window.isSecureContext)}
          </div>
        </div>
      )}

      {/* Modal câmera */}
      {ocrOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Ler sinopse com câmera</h3>
              <button type="button" className={styles.modalClose} onClick={closeCameraModal}>
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
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${ocrProgress}%` }} />
                      </div>
                      <p className={styles.ocrPct}>{ocrProgress}%</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={() => fileInputRef.current?.click()} disabled={ocrBusy}>
                Usar foto
              </button>

              <button type="button" className={styles.primaryBtn} onClick={() => void captureFromVideo()} disabled={ocrBusy}>
                Capturar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal escolher trecho */}
      {ocrPickOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Escolha o trecho</h3>
              <button type="button" className={styles.modalClose} onClick={closeOcrPick}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.ocrHint}>
                Selecione o trecho (arrastando) e depois escolha como aplicar. Se não selecionar nada, aplica o texto todo.
              </p>

              <textarea
                ref={ocrPickRef}
                className={styles.ocrPreview}
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                rows={10}
              />
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={applyOcrTextInsertAtCursor}>
                Inserir no cursor
              </button>

              <button type="button" className={styles.secondaryBtn} onClick={applyOcrTextAppend}>
                Adicionar ao final
              </button>

              <button type="button" className={styles.primaryBtn} onClick={applyOcrTextReplace}>
                Substituir descrição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
