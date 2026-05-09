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

type SearchMode = "title" | "author" | "isbn";

type ExternalBookSuggestion = {
  id: string;
  source: "google" | "openlibrary" | "gutendex";
  title: string;
  description?: string;
  publishedYear?: string;
  pageCount?: number;
  authors: string[];
  publisher?: string;
  coverUrl?: string;
  isbn?: string;
};

const CHRISTIAN_HINTS = [
  "cpad",
  "editora vida",
  "vida",
  "graca",
  "graça",
  "orvalho",
  "hagnos",
  "fiel",
  "betania",
  "bethania",
  "mundo cristao",
  "mundo cristão",
  "shedd",
  "bv books",
  "central gospel",
  "evangel",
  "igreja",
  "teologia",
  "devocional",
  "biblia",
  "bíblia",
  "crist",
  "pastor",
  "discipulado",
];

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const LAST_CATEGORY_KEY = "last_book_category_after_save";

export default function CadastrarLivro({ onToggle }: { onToggle?: () => void }) {
  // ==========================
  // ESTADOS DO FORM
  // ==========================
  const [nomeLivro, setNomeLivro] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [anoPublicacao, setAnoPublicacao] = useState<string>("");
  const [quantidade_paginas, setQuantidadePaginas] = useState<string>("");
  const [quantidade_estoque, setQuantidadeEstoque] = useState<string>("1");

  const [categoria, setCategoria] = useState<string>("");

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
  const [bookSuggestions, setBookSuggestions] = useState<ExternalBookSuggestion[]>([]);
  const [showBookSuggestions, setShowBookSuggestions] = useState<boolean>(false);
  const [bookLookupLoading, setBookLookupLoading] = useState<boolean>(false);
  const [bookLookupMsg, setBookLookupMsg] = useState<string>("");

  // ==========================
  // REFS IMPORTANTES
  // ==========================
  const descricaoRef = useRef<HTMLTextAreaElement | null>(null);

  // ==========================
  // OCR
  // ==========================
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const iosCameraInputRef = useRef<HTMLInputElement | null>(null);
  const iosGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [ocrOpen, setOcrOpen] = useState<boolean>(false);
  const [ocrIosMode, setOcrIosMode] = useState<boolean>(false);
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
    try {
      const lastCategory = sessionStorage.getItem(LAST_CATEGORY_KEY);
      if (lastCategory) {
        setCategoria(lastCategory);
      }
    } catch {
      // noop
    }
  }, []);

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

  useEffect(() => {
    if (!categoria || categoriaSugestoes.length === 0) return;
    const selecionada = categoriaSugestoes.find((c) => c.categoria_principal === categoria);
    if (!selecionada) return;
    setCorCima(selecionada.cor_cima);
    setCorBaixo(selecionada.cor_baixo);
  }, [categoria, categoriaSugestoes]);

  useEffect(() => {
    const query = normalizeSpaces(nomeLivro);
    if (query.length < 3) {
      setBookSuggestions([]);
      setBookLookupLoading(false);
      setBookLookupMsg("");
      return;
    }

    const controller = new AbortController();
    const { mode, value } = getSearchMode(query);

    const timer = window.setTimeout(() => {
      void (async () => {
        setBookLookupLoading(true);
        setBookLookupMsg("Buscando sugestões...");
        try {
          const googleQueries = new Set<string>();
          if (mode === "isbn") {
            googleQueries.add(`isbn:${value}`);
          } else if (mode === "author") {
            googleQueries.add(`inauthor:${value}`);
            googleQueries.add(`${value} cristão`);
            googleQueries.add(`${value} inpublisher:cpad`);
            googleQueries.add(`${value} inpublisher:\"editora vida\"`);
          } else {
            googleQueries.add(`intitle:${value}`);
            googleQueries.add(`\"${value}\"`);
            googleQueries.add(`${value} cristão`);
            googleQueries.add(`${value} inpublisher:cpad`);
            googleQueries.add(`${value} inpublisher:\"editora vida\"`);
            googleQueries.add(`${value} inpublisher:graca`);
            googleQueries.add(`${value} inpublisher:orvalho`);
            googleQueries.add(`${value} subject:christian`);
            googleQueries.add(`${value} subject:religion`);
          }

          const googleRequests = Array.from(googleQueries)
            .slice(0, 6)
            .map((q) =>
              fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
                  q
                )}&maxResults=6&langRestrict=pt&printType=books&orderBy=relevance`,
                { signal: controller.signal }
              )
            );

          const openParams = new URLSearchParams();
          openParams.set("limit", "12");
          openParams.set("language", "por");
          if (mode === "isbn") openParams.set("isbn", value);
          if (mode === "author") openParams.set("author", value);
          if (mode === "title") openParams.set("title", value);
          const openUrl = `https://openlibrary.org/search.json?${openParams.toString()}`;

          const gutendexUrl =
            mode === "isbn"
              ? ""
              : `https://gutendex.com/books?search=${encodeURIComponent(value)}`;

          const [googleSettled, openResp, gutendexResp] = await Promise.all([
            Promise.allSettled(googleRequests),
            fetch(openUrl, { signal: controller.signal }),
            gutendexUrl
              ? fetch(gutendexUrl, { signal: controller.signal })
              : Promise.resolve(null as Response | null),
          ]);

          const external: ExternalBookSuggestion[] = [];

          for (const settled of googleSettled) {
            if (settled.status !== "fulfilled" || !settled.value.ok) continue;
            const googleData = (await settled.value.json()) as {
              items?: Array<{
                id: string;
                volumeInfo?: {
                  title?: string;
                  description?: string;
                  publishedDate?: string;
                  pageCount?: number;
                  authors?: string[];
                  publisher?: string;
                  imageLinks?: { thumbnail?: string; small?: string; smallThumbnail?: string };
                  industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
                };
              }>;
            };
            for (const item of googleData.items ?? []) {
              const info = item.volumeInfo ?? {};
              const title = normalizeSpaces(info.title || "");
              if (!title) continue;
              const cover =
                info.imageLinks?.thumbnail || info.imageLinks?.small || info.imageLinks?.smallThumbnail || undefined;
              const isbn = info.industryIdentifiers?.find((id) => /isbn/i.test(id.type || ""))?.identifier;
              external.push({
                id: `g-${item.id}`,
                source: "google",
                title,
                description: info.description ? sanitizeHtml(info.description) : undefined,
                publishedYear: normalizeYear(info.publishedDate),
                pageCount: info.pageCount,
                authors: uniqueNames((info.authors ?? []).map((a) => normalizeSpaces(a))),
                publisher: normalizeSpaces(info.publisher || "") || undefined,
                coverUrl: cover ? cover.replace("http://", "https://") : undefined,
                isbn: isbn ? normalizeSpaces(isbn) : undefined,
              });
            }
          }

          if (openResp.ok) {
            const openData = (await openResp.json()) as {
              docs?: Array<{
                key?: string;
                title?: string;
                first_sentence?: string | { value?: string };
                first_publish_year?: number;
                number_of_pages_median?: number;
                author_name?: string[];
                publisher?: string[];
                cover_i?: number;
                isbn?: string[];
              }>;
            };
            for (const [idx, doc] of (openData.docs ?? []).entries()) {
              const title = normalizeSpaces(doc.title || "");
              if (!title) continue;
              const firstSentence =
                typeof doc.first_sentence === "string"
                  ? doc.first_sentence
                  : normalizeSpaces(doc.first_sentence?.value || "");
              external.push({
                id: `ol-${doc.key || idx}`,
                source: "openlibrary",
                title,
                description: firstSentence ? sanitizeHtml(firstSentence) : undefined,
                publishedYear: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
                pageCount: doc.number_of_pages_median ?? undefined,
                authors: uniqueNames((doc.author_name ?? []).map((a) => normalizeSpaces(a))),
                publisher: normalizeSpaces(doc.publisher?.[0] || "") || undefined,
                coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
                isbn: doc.isbn?.[0] ? normalizeSpaces(doc.isbn[0]) : undefined,
              });
            }
          }

          if (gutendexResp && gutendexResp.ok) {
            const gutData = (await gutendexResp.json()) as {
              results?: Array<{
                id: number;
                title?: string;
                languages?: string[];
                authors?: Array<{ name?: string }>;
                formats?: Record<string, string>;
                subjects?: string[];
              }>;
            };
            for (const result of gutData.results ?? []) {
              const title = normalizeSpaces(result.title || "");
              if (!title) continue;
              const langs = result.languages ?? [];
              if (langs.length > 0 && !langs.includes("pt")) continue;
              external.push({
                id: `gtx-${result.id}`,
                source: "gutendex",
                title,
                description: normalizeSpaces((result.subjects ?? []).slice(0, 2).join(" • ")) || undefined,
                authors: uniqueNames((result.authors ?? []).map((a) => normalizeSpaces(a.name || ""))),
                coverUrl: result.formats?.["image/jpeg"] || result.formats?.["image/png"] || undefined,
              });
            }
          }

          const dedup: ExternalBookSuggestion[] = [];
          const seen = new Set<string>();
          for (const item of external) {
            const signature = [
              removeDiacritics(item.title.toLowerCase()),
              removeDiacritics((item.authors[0] || "").toLowerCase()),
              item.publishedYear || "",
            ].join("|");
            if (seen.has(signature)) continue;
            seen.add(signature);
            dedup.push(item);
          }

          const strict = dedup.filter((item) => isRelevantSuggestion(mode, value, item));
          const relaxed =
            strict.length >= 4
              ? strict
              : dedup.filter((item) => isRelevantSuggestionRelaxed(mode, value, item));

          relaxed.sort((a, b) => suggestionScore(mode, value, b) - suggestionScore(mode, value, a));
          const finalList = relaxed.slice(0, 8);
          setBookSuggestions(finalList);
          setShowBookSuggestions(true);
          setBookLookupMsg(finalList.length ? `Sugestões encontradas (${finalList.length}).` : "Sem sugestões.");
        } catch (error) {
          if ((error as { name?: string })?.name !== "AbortError") {
            console.error("Erro na busca de livros:", error);
            setBookSuggestions([]);
            setShowBookSuggestions(false);
            setBookLookupMsg("Falha ao buscar sugestões.");
          }
        } finally {
          setBookLookupLoading(false);
        }
      })();
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomeLivro]);

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

const isChromeIOS = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /CriOS/i.test(ua);
};

  const normalizeSpaces = (value: string): string => value.replace(/\s+/g, " ").trim();
  const removeDiacritics = (value: string): string =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const sanitizeHtml = (value: string): string =>
    value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const normalizeYear = (value?: string): string | undefined => {
    if (!value) return undefined;
    const match = value.match(/\d{4}/);
    return match ? match[0] : undefined;
  };

  const tokenize = (value: string): string[] =>
    removeDiacritics(normalizeSpaces(value).toLowerCase())
      .split(/[^a-z0-9]+/g)
      .filter((t) => t.length >= 3);

  const getSearchMode = (raw: string): { mode: SearchMode; value: string } => {
    const q = normalizeSpaces(raw);
    if (/^autor:/i.test(q)) {
      return { mode: "author", value: normalizeSpaces(q.replace(/^autor:/i, "")) };
    }
    const cleanIsbn = q.replace(/[^0-9Xx]/g, "");
    if (cleanIsbn.length === 10 || cleanIsbn.length === 13) {
      return { mode: "isbn", value: cleanIsbn };
    }
    return { mode: "title", value: q };
  };

  const preferInternalName = (raw: string, internalList: string[]): string => {
    const target = normalizeSpaces(raw).toLowerCase();
    if (!target) return "";
    const found = internalList.find((item) => normalizeSpaces(item).toLowerCase() === target);
    return found ?? normalizeSpaces(raw);
  };

  const uniqueNames = (list: string[]): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of list) {
      const key = removeDiacritics(normalizeSpaces(item).toLowerCase());
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(normalizeSpaces(item));
    }
    return out;
  };

  const relevanceRatio = (query: string, target: string): number => {
    const q = tokenize(query);
    if (q.length === 0) return 0;
    const t = removeDiacritics(normalizeSpaces(target).toLowerCase());
    const hits = q.filter((tk) => t.includes(tk)).length;
    return hits / q.length;
  };

  const containsChristianHint = (value?: string): boolean => {
    const t = removeDiacritics(normalizeSpaces(value || "").toLowerCase());
    if (!t) return false;
    return CHRISTIAN_HINTS.some((hint) => t.includes(removeDiacritics(hint.toLowerCase())));
  };

  const suggestionScore = (mode: SearchMode, query: string, item: ExternalBookSuggestion): number => {
    const titleRatio = relevanceRatio(query, item.title);
    const authorRatio = relevanceRatio(query, item.authors.join(" "));
    const text = `${item.title} ${item.description || ""} ${item.publisher || ""}`.toLowerCase();
    const christianBoost = containsChristianHint(text) ? 2 : 0;

    if (mode === "author") return authorRatio * 10 + titleRatio * 2 + christianBoost;
    if (mode === "isbn") {
      const q = query.replace(/[^0-9Xx]/g, "").toLowerCase();
      const i = (item.isbn || "").replace(/[^0-9Xx]/g, "").toLowerCase();
      return (q && i && q === i ? 12 : 0) + christianBoost;
    }
    return titleRatio * 10 + authorRatio * 2 + christianBoost;
  };

  const isRelevantSuggestion = (mode: SearchMode, query: string, item: ExternalBookSuggestion): boolean => {
    const titleRatio = relevanceRatio(query, item.title);
    const authorRatio = relevanceRatio(query, item.authors.join(" "));
    if (mode === "isbn") {
      const q = query.replace(/[^0-9Xx]/g, "").toLowerCase();
      const i = (item.isbn || "").replace(/[^0-9Xx]/g, "").toLowerCase();
      return Boolean(q && i && q === i);
    }
    if (mode === "author") return authorRatio >= 0.5 || (authorRatio >= 0.4 && titleRatio >= 0.4);
    return titleRatio >= 0.5 || (titleRatio >= 0.35 && authorRatio >= 0.4);
  };

  const isRelevantSuggestionRelaxed = (mode: SearchMode, query: string, item: ExternalBookSuggestion): boolean => {
    const titleRatio = relevanceRatio(query, item.title);
    const authorRatio = relevanceRatio(query, item.authors.join(" "));
    if (mode === "isbn") {
      const q = query.replace(/[^0-9Xx]/g, "").toLowerCase();
      const i = (item.isbn || "").replace(/[^0-9Xx]/g, "").toLowerCase();
      return Boolean(q && i && q === i);
    }
    if (mode === "author") return authorRatio >= 0.3 || containsChristianHint(item.publisher) || containsChristianHint(item.title);
    return titleRatio >= 0.3 || containsChristianHint(item.publisher) || containsChristianHint(item.title);
  };

  const fetchImageAsFile = async (url: string, baseName: string): Promise<File | null> => {
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const blob = await resp.blob();
      if (!blob.type.startsWith("image/")) return null;
      const ext = blob.type.includes("png") ? "png" : "jpg";
      return new File([blob], `${baseName || "capa-auto"}.${ext}`, {
        type: blob.type,
        lastModified: Date.now(),
      });
    } catch {
      return null;
    }
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
    setOcrIosMode(false);
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

    // iOS (Safari/Chrome): usa fluxo de arquivo/foto, mais confiável que câmera ao vivo.
    if (isIOSDevice()) {
      setOcrIosMode(true);
      setOcrOpen(true);
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

  const openGoogleLens = (): void => {
    const lensUrl = "https://lens.google.com/";
    window.open(lensUrl, "_blank", "noopener,noreferrer");
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
        try {
          sessionStorage.setItem(LAST_CATEGORY_KEY, categoria);
        } catch {
          // noop
        }
        setNomeLivro("");
        window.location.reload();
      } else {
        setFormError("Erro ao cadastrar livro.");
      }
    } catch (error) {
      console.error("Erro no envio:", error);
      setFormError("Erro ao cadastrar livro (network).");
    }
  };

  const applyBookSuggestion = async (item: ExternalBookSuggestion): Promise<void> => {
    setNomeLivro(item.title);
    setShowBookSuggestions(false);

    if (item.description) setDescricao(item.description);
    if (item.publishedYear) setAnoPublicacao(item.publishedYear);
    if (item.pageCount && item.pageCount > 0) setQuantidadePaginas(String(item.pageCount));
    if (item.authors.length > 0) {
      const adjustedAuthors = uniqueNames(item.authors.map((name) => preferInternalName(name, autorSugestoes)));
      setAutores(adjustedAuthors.length > 0 ? adjustedAuthors : [""]);
    }
    if (item.publisher) setEditora(preferInternalName(item.publisher, editoraSugestoes));

    if (item.coverUrl) {
      const file = await fetchImageAsFile(item.coverUrl, item.title.replace(/[^\w\d-_]+/g, "-"));
      if (file && file.size <= MAX_UPLOAD_BYTES) {
        setCapaLivro(file);
      }
    }
  };

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className={styles.containerCadastrar}>
      <h1 className={styles.titleCadastrar}>Cadastrar Livro</h1>

      <form className={styles.form} onSubmit={handleFormSubmit}>
        <div className={styles.suggestionContainer}>
          <Input
            label="Nome do Livro"
            name="nomeLivro"
            type="text"
            value={nomeLivro}
            onChange={(e) => {
              setNomeLivro(e.target.value);
              setShowBookSuggestions(true);
            }}
            onFocus={() => setShowBookSuggestions(true)}
          />
          {showBookSuggestions && bookSuggestions.length > 0 && (
            <ul className={styles.bookSuggestionList}>
              {bookSuggestions.map((item) => (
                <li key={item.id} onClick={() => void applyBookSuggestion(item)} className={styles.bookSuggestionItem}>
                  <span className={styles.bookSuggestionTitle}>{item.title}</span>
                  <small className={styles.bookSuggestionMeta}>
                    {item.authors.slice(0, 2).join(", ") || "Autor não informado"}
                    {item.publishedYear ? ` • ${item.publishedYear}` : ""}
                    {item.publisher ? ` • ${item.publisher}` : ""}
                  </small>
                </li>
              ))}
            </ul>
          )}
          {(bookLookupLoading || bookLookupMsg) && (
            <div className={styles.formMsg}>
              {bookLookupLoading ? "Buscando..." : bookLookupMsg}
            </div>
          )}
        </div>

        {/* SINOPSE */}
        <div className={styles.descricaoWrap}>
          <label className={styles.descricaoLabel} htmlFor="descricao">
            Sinopse / Descrição
          </label>

          <button type="button" className={styles.cameraButton} onClick={() => void openOcr()}>
            <span className={styles.cameraText}>📷 Ler com câmera</span>
          </button>
          {isIOSDevice() && (
            <button type="button" className={styles.lensButton} onClick={openGoogleLens}>
              <span className={styles.cameraText}>🔎 Abrir Google Lens</span>
            </button>
          )}

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
          <input
            ref={iosCameraInputRef}
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
          <input
            ref={iosGalleryInputRef}
            className={styles.hiddenFile}
            type="file"
            accept="image/*"
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
            onChange={(e) => {
              setCategoria(e.target.value);
              setShowCategoriaSugestoes(true);
            }}
            onFocus={() => setShowCategoriaSugestoes(true)}
          />
          <button type="button" onClick={() => setShowCategoriaSugestoes((p) => !p)} className={styles.dropdownButton}>
            ▼
          </button>

          {showCategoriaSugestoes && (
            <ul className={styles.suggestionList}>
              {categoriaSugestoes
                .filter((sug) =>
                  sug.categoria_principal.toLowerCase().includes(categoria.toLowerCase())
                )
                .map((sug, i) => (
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
              {ocrIosMode ? (
                <div className={styles.iosHelpBox}>
                  <p>
                    No iPhone, o melhor caminho é tirar a foto da sinopse e extrair o texto aqui.
                  </p>
                  <p>
                    No Chrome iOS não dá para forçar o Lens automaticamente pelo site, mas você pode abrir o Lens em 1 toque.
                  </p>
                </div>
              ) : (
                <>
                  <video ref={videoRef} className={styles.video} playsInline muted />
                  <canvas ref={canvasRef} className={styles.hiddenCanvas} />
                </>
              )}

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
              {ocrIosMode ? (
                <>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => iosGalleryInputRef.current?.click()}
                    disabled={ocrBusy}
                  >
                    Escolher da galeria
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => iosCameraInputRef.current?.click()}
                    disabled={ocrBusy}
                  >
                    Tirar foto
                  </button>
                  {isChromeIOS() && (
                    <button type="button" className={styles.primaryBtn} onClick={openGoogleLens} disabled={ocrBusy}>
                      Abrir Google Lens
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={ocrBusy}
                  >
                    Usar foto
                  </button>

                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => void captureFromVideo()}
                    disabled={ocrBusy}
                  >
                    Capturar
                  </button>
                </>
              )}
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
