"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useFormStatus } from "react-dom";

import Cropper, { Area } from "react-easy-crop";

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

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

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

  // Capa (final recortada)
  const [capaLivro, setCapaLivro] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);

  // Erros do form (ex: capa > 10MB)
  const [formError, setFormError] = useState<string | null>(null);
  const [formMsg, setFormMsg] = useState<string>("");

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
  // CROP DA CAPA
  // ==========================
  const [cropOpen, setCropOpen] = useState(false);
  const [cropBusy, setCropBusy] = useState(false);
  const [cropMsg, setCropMsg] = useState("");
  const [cropError, setCropError] = useState<string | null>(null);

  const [coverRawFile, setCoverRawFile] = useState<File | null>(null);
  const [coverRawUrl, setCoverRawUrl] = useState<string | null>(null);

  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const coverAspect = 2 / 3; // capa vertical (ajuste se quiser: 3/4 etc)

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

  // Preview da capa final
  useEffect(() => {
    if (capaLivro) {
      const objectUrl = URL.createObjectURL(capaLivro);
      setCapaPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setCapaPreview(null);
  }, [capaLivro]);

  // Preview da capa RAW (para crop)
  useEffect(() => {
    if (coverRawFile) {
      const objectUrl = URL.createObjectURL(coverRawFile);
      setCoverRawUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setCoverRawUrl(null);
  }, [coverRawFile]);

  // ==========================
  // HELPERS
  // ==========================
const isIOSDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);

  // iPadOS 13+ se identifica como Macintosh, mas tem touch
  const maxTouchPoints = "maxTouchPoints" in navigator ? navigator.maxTouchPoints : 0;
  const iPadOS = ua.includes("Macintosh") && maxTouchPoints > 1;

  return iOS || iPadOS;
};

  const bytesToMb = (b: number): string => (b / (1024 * 1024)).toFixed(2);

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

  // Ajuste para não "comer" unicode/acentos. Apenas normaliza quebras/espacos.
  const normalizeOcrText = (t: string): string => {
    return (
      t
        // normaliza CRLF -> LF
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        // remove espaços no fim da linha (sem mexer em unicode)
        .replace(/[ \t]+$/gm, "")
        // colapsa linhas em branco excessivas
        .replace(/\n{3,}/g, "\n\n")
        // colapsa tabs repetidos (sem remover acentos)
        .replace(/[ \t]{2,}/g, " ")
        .trim()
    );
  };

  const blobToFile = (blob: Blob, fileName: string): File => {
    const type = blob.type || "image/jpeg";
    return new File([blob], fileName, { type, lastModified: Date.now() });
  };

  const canvasToJpeg = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) return reject(new Error("Falha ao gerar JPEG"));
          resolve(b);
        },
        "image/jpeg",
        quality
      );
    });
  };

  const scaleCanvasToMaxDim = (src: HTMLCanvasElement, maxDim: number): HTMLCanvasElement => {
    const w0 = src.width;
    const h0 = src.height;
    const scale = Math.min(1, maxDim / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));

    if (w === w0 && h === h0) return src;

    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d");
    if (!ctx) return src;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, w, h);
    return out;
  };

  // Compressão progressiva até caber no limite (ou parar no minQ)
  const compressCanvasUnderLimit = async (opts: {
    canvas: HTMLCanvasElement;
    maxBytes: number;
    startQuality: number;
    minQuality: number;
    onStep?: (msg: string, pct?: number) => void;
  }): Promise<Blob> => {
    const { canvas, maxBytes, startQuality, minQuality, onStep } = opts;

    const qualities = [startQuality, 0.65, 0.55, 0.45].filter((q) => q <= startQuality && q >= minQuality);
    let lastBlob: Blob | null = null;

    for (let i = 0; i < qualities.length; i++) {
      const q = qualities[i];
      onStep?.(`Otimizando imagem... (qualidade ${(q * 100).toFixed(0)}%)`, 10 + i * 20);

      const blob = await canvasToJpeg(canvas, q);
      lastBlob = blob;

      if (blob.size <= maxBytes) {
        onStep?.("Imagem otimizada.", 60);
        return blob;
      }
    }

    // Se não coube, devolve o último blob (quem chama decide)
    if (!lastBlob) {
      throw new Error("Falha ao comprimir imagem");
    }
    return lastBlob;
  };

  // ✅ file -> canvas (iPhone) com limite de dimensão
  const fileToCanvas = async (file: File, maxDim = 1600): Promise<HTMLCanvasElement> => {
    // Tenta createImageBitmap primeiro
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

    // Fallback FileReader -> Image
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

  // ==========================
  // CROP HELPERS
  // ==========================
  const onCropComplete = (_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Falha ao carregar imagem"));
      img.src = url;
    });
  };

  const getCroppedCanvas = async (imageUrl: string, pixelCrop: Area): Promise<HTMLCanvasElement> => {
    const img = await loadImage(imageUrl);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(pixelCrop.width));
    canvas.height = Math.max(1, Math.round(pixelCrop.height));

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Sem contexto 2D");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Desenha o recorte
    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas;
  };

  const openCoverCrop = async (file: File | null) => {
    if (!file) return;
    setFormError(null);
    setFormMsg("");

    setCropError(null);
    setCropMsg("");
    setCropBusy(false);

    // Só abre crop — compressão acontece ao confirmar
    setCoverRawFile(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropOpen(true);
  };

  const closeCoverCrop = () => {
    setCropOpen(false);
    setCoverRawFile(null);
    setCroppedAreaPixels(null);
    setCropError(null);
    setCropMsg("");
    setCropBusy(false);
  };

  const confirmCoverCrop = async () => {
    if (!coverRawUrl || !croppedAreaPixels) {
      setCropError("Selecione um recorte antes de confirmar.");
      return;
    }

    setCropBusy(true);
    setCropError(null);
    setCropMsg("Gerando recorte...");
    try {
      // Recorta
      const croppedCanvas = await getCroppedCanvas(coverRawUrl, croppedAreaPixels);

      // Reduz dimensão da CAPA
      const scaled = scaleCanvasToMaxDim(croppedCanvas, 1400);

      // Compressão progressiva
      const blob = await compressCanvasUnderLimit({
        canvas: scaled,
        maxBytes: MAX_UPLOAD_BYTES,
        startQuality: 0.75,
        minQuality: 0.45,
        onStep: (msg) => setCropMsg(msg),
      });

      if (blob.size > MAX_UPLOAD_BYTES) {
        setCropError(
          `A capa ainda ficou muito grande (${bytesToMb(blob.size)}MB). Tente recortar mais fechado ou usar uma foto menor.`
        );
        return;
      }

      const finalFile = blobToFile(blob, "capa.jpg");
      setCapaLivro(finalFile);
      setCropMsg("Capa pronta!");
      setCropOpen(false);
      setCoverRawFile(null);
      setCroppedAreaPixels(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setCropError(`Falha ao recortar/comprimir: ${msg}`);
    } finally {
      setCropBusy(false);
    }
  };

  // ==========================
  // OCR FLOW
  // ==========================
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

      setTimeout(startVideo, 60);
    } catch (err) {
      console.warn("Falha ao abrir câmera ao vivo, usando fallback:", err);
      fileInputRef.current?.click();
    }
  };

  // ✅ OCR via servidor (funciona em iPhone/Android/PC)
  const runOcrOnServer = async (blob: Blob): Promise<void> => {
    // Bloqueio 10MB
    if (blob.size > MAX_UPLOAD_BYTES) {
      setOcrError(
        `A imagem ficou grande demais (${bytesToMb(blob.size)}MB). Recorte mais ou aproxime a câmera. Limite: 10MB.`
      );
      return;
    }

    setOcrBusy(true);
    setOcrError(null);
    setOcrMsg("Enviando imagem...");
    setOcrProgress(0);

    try {
      setOcrMsg("Processando OCR no servidor...");
      setOcrProgress(35);

      const formData = new FormData();
      // nome fixo + JPEG
      formData.append("image", blob, "sinopse.jpg");

      const resp = await fetch("https://api.helenaramazzotte.online/api/ocr", {
        method: "POST",
        body: formData,
      });

      // cuidado: sempre parsear json
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

    setOcrError(null);
    setOcrMsg("Capturando imagem...");
    setOcrProgress(10);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, 0, 0, w, h);

    // OCR: qualidade menor
    const rawBlob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.75));
    if (!rawBlob) {
      setOcrError("Não consegui capturar a imagem da câmera.");
      return;
    }

    // Se o blob ainda for grande, tenta recomprimir (mantendo dimensão)
    setOcrMsg("Otimizando imagem...");
    setOcrProgress(20);

    let finalBlob = rawBlob;
    if (finalBlob.size > MAX_UPLOAD_BYTES) {
      const compressed = await compressCanvasUnderLimit({
        canvas,
        maxBytes: MAX_UPLOAD_BYTES,
        startQuality: 0.75,
        minQuality: 0.45,
        onStep: (msg, pct) => {
          setOcrMsg(msg);
          if (pct) setOcrProgress(Math.min(60, pct));
        },
      });

      finalBlob = compressed;
      if (finalBlob.size > MAX_UPLOAD_BYTES) {
        setOcrError(
          `A imagem ficou grande demais (${bytesToMb(finalBlob.size)}MB). Tente aproximar/recortar mais. Limite: 10MB.`
        );
        return;
      }
    }

    await runOcrOnServer(finalBlob);
  };

  const handleFileOcr = async (file: File | null): Promise<void> => {
    if (!file) return;

    stopStream();

    setOcrBusy(true);
    setOcrError(null);
    setOcrMsg(`Preparando imagem... (${file.type || "sem type"})`);
    setOcrProgress(0);

    try {
      // OCR no iPhone: maxDim 1600 e qualidade 0.75
      const maxDim = 1600;
      const canvas = await fileToCanvas(file, maxDim);

      setOcrMsg("Otimizando imagem...");
      setOcrProgress(15);

      // gera JPEG base
      const baseBlob = await canvasToJpeg(canvas, 0.75);

      // se ainda grande, tenta recomprimir (e/ou diminuir qualidade)
      let finalBlob = baseBlob;

      if (finalBlob.size > MAX_UPLOAD_BYTES) {
        finalBlob = await compressCanvasUnderLimit({
          canvas,
          maxBytes: MAX_UPLOAD_BYTES,
          startQuality: 0.75,
          minQuality: 0.45,
          onStep: (msg, pct) => {
            setOcrMsg(msg);
            if (pct) setOcrProgress(Math.min(60, pct));
          },
        });
      }

      if (finalBlob.size > MAX_UPLOAD_BYTES) {
        setOcrError(
          `A imagem ficou grande demais (${bytesToMb(finalBlob.size)}MB). Recorte mais o texto antes de enviar. Limite: 10MB.`
        );
        setOcrBusy(false);
        return;
      }

      await runOcrOnServer(finalBlob);
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
    setFormError(null);
    setFormMsg("");

    // bloqueia se capa maior que limite (por segurança extra)
    if (capaLivro && capaLivro.size > MAX_UPLOAD_BYTES) {
      setFormError(`A capa está acima de 10MB (${bytesToMb(capaLivro.size)}MB). Recorte/comprima antes de enviar.`);
      return;
    }

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
      setFormMsg("Enviando livro...");
      const resp = await fetch("https://api.helenaramazzotte.online/livro", {
        method: "POST",
        body: formData,
      });

      if (resp.ok) {
        setFormMsg("Livro cadastrado com sucesso!");
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

        // limpa mensagens depois de um tempo
        setTimeout(() => setFormMsg(""), 1500);
      } else {
        setFormError("Erro ao cadastrar livro.");
      }
    } catch (error) {
      console.error("Erro no envio:", error);
      setFormError("Erro ao cadastrar livro (network).");
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
          <Input
            label="Cor Base"
            name="corBaixo"
            type="color"
            value={corBaixo}
            onChange={(e) => setCorBaixo(e.target.value)}
          />
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

        {/* Capa (abre crop) */}
        <Input
          label="Capa do Livro"
          name="capaLivro"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            void openCoverCrop(f);
          }}
        />

        {formError && <div className={styles.formError}>{formError}</div>}
        {!!formMsg && !formError && <div className={styles.formMsg}>{formMsg}</div>}

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
          <div>
            <b>coverRaw:</b> {String(!!coverRawFile)} | <b>cropOpen:</b> {String(cropOpen)}
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

      {/* Modal CROP CAPA */}
      {cropOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Recortar capa</h3>
              <button type="button" className={styles.modalClose} onClick={closeCoverCrop} disabled={cropBusy}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {!coverRawUrl ? (
                <p>Carregando imagem...</p>
              ) : (
                <div className={styles.cropArea}>
                  <Cropper
                    image={coverRawUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={coverAspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    restrictPosition={false}
                    zoomWithScroll={true}
                  />
                </div>
              )}

              <div className={styles.cropControls}>
                <label className={styles.cropLabel}>Zoom</label>
                <input
                  className={styles.cropZoom}
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  disabled={cropBusy}
                />
              </div>

              {(cropBusy || cropMsg || cropError) && (
                <div className={styles.ocrStatus}>
                  {cropError ? (
                    <p className={styles.ocrError}>{cropError}</p>
                  ) : (
                    <>
                      <p className={styles.ocrMsg}>{cropMsg || "Processando..."}</p>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: cropBusy ? "60%" : "0%" }} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={closeCoverCrop} disabled={cropBusy}>
                Cancelar
              </button>

              <button type="button" className={styles.primaryBtn} onClick={() => void confirmCoverCrop()} disabled={cropBusy}>
                Usar este recorte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}