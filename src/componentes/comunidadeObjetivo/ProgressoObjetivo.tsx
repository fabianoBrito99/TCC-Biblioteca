import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "./progresso.module.css";

interface UsuarioProgresso {
  nome_login: string;
  paginas_lidas: number;
  total_paginas: number;
}

interface ProgressoObjetivoProps {
  idObjetivo: number;
  tipoMeta: "paginas" | "capitulos";
  progressoAtualizado: boolean;
  paginasInseridas: number;
  usuarioAtual: string;
}

const velocidadeCenario = 2;
const gravidade = 0.4;
const forcaPulo = -10;
const INTERVALO_ATUALIZACAO_MS = 3000;
const CANVAS_LARGURA = 900;
const CANVAS_ALTURA = 320;
const CHAO_Y = 225;
const BASE_PERSONAGEM_Y = 190;
const MAX_FAIXAS_NOME = 8;
const ESPACO_ENTRE_CACTOS = 220;

const ProgressoObjetivo: React.FC<ProgressoObjetivoProps> = ({
  idObjetivo,
  tipoMeta,
  progressoAtualizado,
  paginasInseridas,
  usuarioAtual,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressoAnteriorRef = useRef<Map<string, number>>(new Map());
  const primeiraCargaRef = useRef(true);
  const animacaoAtivaRef = useRef(false);
  const usuariosRef = useRef<UsuarioProgresso[]>([]);
  const dadosAnimacaoRef = useRef<{
    nome: string;
    paginas: number;
    usuarios: UsuarioProgresso[];
  } | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioProgresso[]>([]);
  const [animacaoAtiva, setAnimacaoAtiva] = useState(false);
  const [usuarioAnimando, setUsuarioAnimando] = useState<string>("");
  const [paginasAnimacao, setPaginasAnimacao] = useState(0);
  const unidade = tipoMeta === "capitulos" ? "capítulos" : "páginas";

 

  const corDoUsuario = useCallback((nome: string) => {
    const hash = Array.from(nome).reduce((acc, char, index) => {
      return acc + char.charCodeAt(0) * (index + 7);
    }, 0);
    const hue = hash % 360;

    return `hsl(${hue}, 82%, 58%)`;
  }, []);

  const primeiroNome = useCallback((nome: string) => {
    const [primeiro] = nome.trim().split(/\s+/);
    if (!primeiro) return "Leitor";
    return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
  }, []);

  const obterFaixaNome = useCallback(
    (x: number, largura: number, faixas: Array<Array<[number, number]>>) => {
      const inicio = x - largura / 2 - 6;
      const fim = x + largura / 2 + 6;

      for (let faixa = 0; faixa < MAX_FAIXAS_NOME; faixa += 1) {
        const ocupada = faixas[faixa] || [];
        const colide = ocupada.some(([a, b]) => inicio < b && fim > a);
        if (!colide) {
          faixas[faixa] = [...ocupada, [inicio, fim]];
          return faixa;
        }
      }

      const ultima = MAX_FAIXAS_NOME - 1;
      faixas[ultima] = [...(faixas[ultima] || []), [inicio, fim]];
      return ultima;
    },
    []
  );

  const desenharCenario = useCallback(
    (ctx: CanvasRenderingContext2D, tempo = performance.now()) => {
      const { width, height } = ctx.canvas;
      const ceu = ctx.createLinearGradient(0, 0, 0, CHAO_Y);
      ceu.addColorStop(0, "#4e8fc3");
      ceu.addColorStop(0.55, "#9fd2f0");
      ceu.addColorStop(1, "#ffe0a0");
      ctx.fillStyle = ceu;
      ctx.fillRect(0, 0, width, height);

      const solX = width * 0.82;
      const solY = 54;
      const brilho = ctx.createRadialGradient(solX, solY, 8, solX, solY, 92);
      brilho.addColorStop(0, "rgba(255, 248, 204, 0.95)");
      brilho.addColorStop(0.35, "rgba(255, 197, 83, 0.55)");
      brilho.addColorStop(1, "rgba(255, 197, 83, 0)");
      ctx.fillStyle = brilho;
      ctx.beginPath();
      ctx.arc(solX, solY, 92, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff4bd";
      ctx.beginPath();
      ctx.arc(solX, solY, 22, 0, Math.PI * 2);
      ctx.fill();

      const desenharNuvem = (x: number, y: number, escala: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(escala, escala);
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.beginPath();
        ctx.ellipse(0, 8, 28, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(22, 5, 22, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(-20, 7, 18, 9, 0, 0, Math.PI * 2);
        ctx.ellipse(5, -2, 20, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      const deslocamento = (tempo / 80) % (width + 220);
      desenharNuvem(width - deslocamento, 46, 0.9);
      desenharNuvem((width * 0.45 - deslocamento * 0.55 + width + 160) % (width + 160) - 80, 74, 0.62);
      desenharNuvem((width * 0.18 - deslocamento * 0.35 + width + 220) % (width + 220) - 90, 34, 0.5);
      desenharNuvem((width * 0.72 - deslocamento * 0.42 + width + 180) % (width + 180) - 90, 96, 0.48);
      desenharNuvem((width * 0.05 - deslocamento * 0.28 + width + 220) % (width + 220) - 80, 84, 0.38);

      ctx.fillStyle = "#b98055";
      ctx.beginPath();
      ctx.moveTo(0, CHAO_Y - 52);
      ctx.lineTo(width * 0.1, CHAO_Y - 152);
      ctx.lineTo(width * 0.28, CHAO_Y - 46);
      ctx.lineTo(width * 0.45, CHAO_Y - 138);
      ctx.lineTo(width * 0.683, CHAO_Y - 53);
      ctx.lineTo(width * 0.78, CHAO_Y - 78);
      ctx.lineTo(width, CHAO_Y - 50);
      ctx.lineTo(width, CHAO_Y + 18);
      ctx.lineTo(0, CHAO_Y + 18);
      ctx.closePath();
      ctx.fill();

      const areia = ctx.createLinearGradient(0, CHAO_Y - 36, 0, height);
      areia.addColorStop(0, "#be963f");
      areia.addColorStop(0.36, "#df9b34");
      areia.addColorStop(0.72, "#bd7023");
      areia.addColorStop(1, "#a77148");
      ctx.fillStyle = areia;
      ctx.beginPath();
      ctx.moveTo(0, CHAO_Y - 28);
      ctx.bezierCurveTo(width * 0.18, CHAO_Y - 58, width * 0.36, CHAO_Y - 4, width * 0.54, CHAO_Y - 34);
      ctx.bezierCurveTo(width * 0.72, CHAO_Y - 68, width * 0.88, CHAO_Y - 20, width, CHAO_Y - 42);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      const dunaClara = ctx.createLinearGradient(0, CHAO_Y - 60, 0, CHAO_Y + 80);
      dunaClara.addColorStop(0, "rgba(224, 186, 89, 0.78)");
      dunaClara.addColorStop(1, "rgba(255, 137, 137, 0)");
      ctx.fillStyle = dunaClara;
      ctx.beginPath();
      ctx.moveTo(0, CHAO_Y - 22);
      ctx.bezierCurveTo(width * 0.22, CHAO_Y - 52, width * 0.4, CHAO_Y - 26, width * 0.58, CHAO_Y - 46);
      ctx.bezierCurveTo(width * 0.77, CHAO_Y - 66, width * 0.9, CHAO_Y - 44, width, CHAO_Y - 56);
      ctx.lineTo(width, CHAO_Y + 28);
      ctx.bezierCurveTo(width * 0.7, CHAO_Y + 4, width * 0.35, CHAO_Y + 22, 0, CHAO_Y + 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(51, 49, 26, 0.04)";
      ctx.lineWidth = 2;
      for (let y = CHAO_Y - 4; y < height; y += 11) {
        ctx.beginPath();
        ctx.moveTo(0, y + Math.sin(y * 0.08) * 4);
        ctx.bezierCurveTo(
          width * 0.262,
          y - 60 + Math.sin(y * 0.8) * 4,
          width * 1.5,
          y - 40,
          width,
          y - 11
        );
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(112, 98, 67, 0.1)";
      for (let x = -50; x < width; x += 38) {
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.bezierCurveTo(x - 124, CHAO_Y + 5, x + 198, CHAO_Y + 32, x + 86, CHAO_Y - 35);
        ctx.stroke();
      }

      const desenharArvoreSeca = (x: number, y: number, escala: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(escala, escala);
        ctx.strokeStyle = "#4e3523";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -48);
        ctx.moveTo(0, -25);
        ctx.lineTo(-22, -48);
        ctx.moveTo(-10, -38);
        ctx.lineTo(-34, -60);
        ctx.moveTo(0, -32);
        ctx.lineTo(22, -54);
        ctx.moveTo(12, -44);
        ctx.lineTo(38, -64);
        ctx.moveTo(0, -17);
        ctx.lineTo(-30, -28);
        ctx.moveTo(0, -15);
        ctx.lineTo(30, -27);
        ctx.moveTo(-15, -22);
        ctx.lineTo(-42, -35);
        ctx.moveTo(16, -24);
        ctx.lineTo(46, -38);
        ctx.stroke();
        ctx.strokeStyle = "#684525";
        ctx.lineWidth = 2;
        for (let i = -38; i <= 38; i += 10) {
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(i, -18 - Math.abs(i) * 0.8);
          ctx.stroke();
        }
        ctx.restore();
      };

      desenharArvoreSeca(width * 0.18, CHAO_Y + 46, 1.05);
      desenharArvoreSeca(width * 0.84, CHAO_Y + 58, 0.95);

      const desenharMontePedras = (x: number, y: number, escala: number) => {
        const pedras = [
          [0, 0, 3],
          [7, 1, 2.4],
          [-6, 2, 2.2],
          [3, -4, 2],
          [-2, -5, 1.8],
          [10, -3, 1.6],
          [-10, -2, 1.6],
        ];

        pedras.forEach(([dx, dy, r], index) => {
          ctx.fillStyle = index % 2 === 0 ? "#8d6a4c" : "#a18462";
          ctx.beginPath();
          ctx.ellipse(
            x + dx * escala,
            y + dy * escala,
            (r + 1.5) * escala,
            r * escala,
            -0.2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
      };

      desenharMontePedras(width * 0.14, CHAO_Y + 76, 0.78);
      desenharMontePedras(width * 0.32, CHAO_Y + 58, 0.9);
      desenharMontePedras(width * 0.58, CHAO_Y + 74, 0.7);
      desenharMontePedras(width * 0.73, CHAO_Y + 48, 0.75);
      desenharMontePedras(width * 0.79, CHAO_Y + 86, 0.62);

      const pilhaX = width - 62;
      const pilhaY = CHAO_Y + 12;
      const pedrasPilha = [
        [0, 54, 34, 11, "#76614c"],
        [-5, 40, 30, 10, "#9a856b"],
        [6, 27, 25, 9, "#b0a083"],
        [-3, 15, 19, 7, "#88745b"],
        [4, 5, 14, 6, "#c2b59a"],
        [0, -3, 9, 4, "#d0c4aa"],
      ];

      pedrasPilha.forEach(([dx, dy, rx, ry, cor]) => {
        ctx.fillStyle = String(cor);
        ctx.strokeStyle = "rgba(68, 45, 30, 0.32)";
        ctx.beginPath();
        ctx.ellipse(
          pilhaX + Number(dx),
          pilhaY + Number(dy),
          Number(rx),
          Number(ry),
          -0.08,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
      });

      ctx.fillStyle = "rgba(82, 42, 18, 0.22)";
      ctx.fillRect(0, height - 18, width, 18);
    },
    []
  );

  const memorizarProgresso = useCallback((lista: UsuarioProgresso[]) => {
    progressoAnteriorRef.current = new Map(
      lista.map((u) => [u.nome_login, Number(u.paginas_lidas) || 0])
    );
  }, []);

  useEffect(() => {
    usuariosRef.current = usuarios;
  }, [usuarios]);

  const iniciarAnimacao = useCallback(
    (nome: string, paginas: number, lista = usuariosRef.current) => {
      if (!nome || paginas <= 0 || animacaoAtivaRef.current) return;
      const paginasNormalizadas = Math.max(1, paginas);
      dadosAnimacaoRef.current = {
        nome,
        paginas: paginasNormalizadas,
        usuarios: lista,
      };
      setPaginasAnimacao(paginasNormalizadas);
      setUsuarioAnimando(nome);
      setAnimacaoAtiva(true);
    },
    []
  );

  useEffect(() => {
    animacaoAtivaRef.current = animacaoAtiva;
  }, [animacaoAtiva]);

  const desenharParte = useCallback(
    (ctx: CanvasRenderingContext2D, fn: () => void) => {
      ctx.save();
      fn();
      ctx.strokeStyle = "#5a3825";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  const desenharTagNome = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      nome: string,
      deslocamentoY: number
    ) => {
      const nomeCurto = primeiroNome(nome);
      const larguraNome = Math.max(46, nomeCurto.length * 7 + 14);
      const tagX = Math.max(
        4,
        Math.min(x - larguraNome / 2, ctx.canvas.width - larguraNome - 4)
      );
      const tagY = y - 56 - deslocamentoY;
      ctx.fillStyle = corDoUsuario(nomeCurto);
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, larguraNome, 18, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(62, 40, 22, 0.28)";
      ctx.stroke();
      ctx.fillStyle = "#2d1a10";
      ctx.font = "bold 10px Arial";
      ctx.fillText(nomeCurto, tagX + 7, tagY + 12);
    },
    [corDoUsuario, primeiroNome]
  );

  const desenharJesusParado = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.fillStyle = "#fdf6e3";
      desenharParte(ctx, () => ctx.rect(x, y - 30, 16, 30));
      ctx.fillRect(x, y - 30, 16, 30);
      ctx.fillStyle = "#fce0b0";
      desenharParte(ctx, () => ctx.rect(x + 2, y - 38, 12, 10));
      ctx.fillRect(x + 2, y - 38, 12, 10);
      ctx.fillStyle = "#5a3825";
      desenharParte(ctx, () => ctx.rect(x + 2, y - 38, 12, 4));
      ctx.fillRect(x + 2, y - 38, 12, 4);
      desenharParte(ctx, () => ctx.rect(x + 1, y - 34, 2, 6));
      ctx.fillRect(x + 1, y - 34, 2, 6);
      desenharParte(ctx, () => ctx.rect(x + 13, y - 34, 2, 6));
      ctx.fillRect(x + 13, y - 34, 2, 6);
      desenharParte(ctx, () => ctx.rect(x + 4, y - 28, 8, 4));
      ctx.fillRect(x + 4, y - 28, 8, 4);
      ctx.fillStyle = "red";
      desenharParte(ctx, () => ctx.rect(x + 2, y - 30, 4, 30));
      ctx.fillRect(x + 2, y - 30, 4, 30);
      ctx.fillStyle = "#fce0b0";
      desenharParte(ctx, () => ctx.rect(x + 2, y, 4, 10));
      ctx.fillRect(x + 2, y, 4, 10);
      desenharParte(ctx, () => ctx.rect(x + 10, y - 5, 4, 10));
      ctx.fillRect(x + 10, y - 5, 4, 10);
      desenharParte(ctx, () => ctx.rect(x - 4, y - 26, 4, 10));
      ctx.fillRect(x - 4, y - 26, 4, 10);
      desenharParte(ctx, () => ctx.rect(x + 16, y - 26, 4, 10));
      ctx.fillRect(x + 16, y - 26, 4, 10);
    },
    [desenharParte]
  );

  const desenharJesusCorrendo = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      const passo = Math.floor(performance.now() / 100) % 2;
      ctx.fillStyle = "#fdf6e3";
      desenharParte(ctx, () => ctx.rect(x, y - 30, 16, 30));
      ctx.fillRect(x, y - 30, 16, 30);
      ctx.fillStyle = "#fce0b0";
      desenharParte(ctx, () => ctx.rect(x + 2, y - 38, 12, 10));
      ctx.fillRect(x + 2, y - 38, 12, 10);
      ctx.fillStyle = "#5a3825";
      desenharParte(ctx, () => ctx.rect(x + 2, y - 38, 12, 4));
      ctx.fillRect(x + 2, y - 38, 12, 4);
      desenharParte(ctx, () => ctx.rect(x + 1, y - 34, 2, 6));
      ctx.fillRect(x + 1, y - 34, 2, 6);
      desenharParte(ctx, () => ctx.rect(x + 13, y - 34, 2, 6));
      ctx.fillRect(x + 13, y - 34, 2, 6);
      desenharParte(ctx, () => ctx.rect(x + 4, y - 28, 8, 4));
      ctx.fillRect(x + 4, y - 28, 8, 4);
      ctx.fillStyle = "red";
      desenharParte(ctx, () => ctx.rect(x + 2, y - 30, 4, 30));
      ctx.fillRect(x + 2, y - 30, 4, 30);
      ctx.fillStyle = "#fce0b0";
      if (passo === 0) {
        desenharParte(ctx, () => ctx.rect(x + 2, y, 4, 10));
        ctx.fillRect(x + 2, y, 4, 10);
        desenharParte(ctx, () => ctx.rect(x + 10, y - 5, 4, 10));
        ctx.fillRect(x + 10, y - 5, 4, 10);
      } else {
        desenharParte(ctx, () => ctx.rect(x + 10, y, 4, 10));
        ctx.fillRect(x + 10, y, 4, 10);
        desenharParte(ctx, () => ctx.rect(x + 2, y - 5, 4, 10));
        ctx.fillRect(x + 2, y - 5, 4, 10);
      }
      desenharParte(ctx, () => ctx.rect(x - 4, y - 26, 4, 10));
      ctx.fillRect(x - 4, y - 26, 4, 10);
      desenharParte(ctx, () => ctx.rect(x + 16, y - 26, 4, 10));
      ctx.fillRect(x + 16, y - 26, 4, 10);
    },
    [desenharParte]
  );

  // Carrega progresso ao montar / quando idObjetivo muda
  useEffect(() => {
    const carregarProgressoInicial = async () => {
      try {
        const res = await fetch(
          `https://api.helenaramazzotte.online/api/comunidade/objetivo/${idObjetivo}/progresso`
        );
        const data: UsuarioProgresso[] = await res.json();
        setUsuarios(data);
        memorizarProgresso(data);
        primeiraCargaRef.current = false;
      } catch (err) {
        console.error("Erro ao carregar progresso inicial:", err);
      }
    };

    carregarProgressoInicial();
  }, [idObjetivo, memorizarProgresso]);

  // Recarrega quando houver atualização e dispara animação
  useEffect(() => {
    if (!progressoAtualizado) return;

    const fetchProgresso = async () => {
      try {
        const res = await fetch(
          `https://api.helenaramazzotte.online/api/comunidade/objetivo/${idObjetivo}/progresso`
        );
        const data: UsuarioProgresso[] = await res.json();
        setUsuarios(data);
        memorizarProgresso(data);

        if (paginasInseridas > 0) {
          iniciarAnimacao(usuarioAtual, paginasInseridas, data);
        }
      } catch (err) {
        console.error("Erro ao buscar progresso:", err);
      }
    };

    fetchProgresso();
  }, [
    progressoAtualizado,
    paginasInseridas,
    usuarioAtual,
    idObjetivo,
    iniciarAnimacao,
    memorizarProgresso,
  ]);

  useEffect(() => {
    if (!idObjetivo) return;

    let cancelado = false;

    const buscarAtualizacoes = async () => {
      try {
        const res = await fetch(
          `https://api.helenaramazzotte.online/api/comunidade/objetivo/${idObjetivo}/progresso`
        );
        if (!res.ok) return;

        const data: UsuarioProgresso[] = await res.json();
        if (cancelado) return;

        const atual = data.map((u) => ({
          ...u,
          paginas_lidas: Number(u.paginas_lidas) || 0,
          total_paginas: Number(u.total_paginas) || 1,
        }));
        const anterior = progressoAnteriorRef.current;
        const alterado = atual.find((u) => {
          const antes = anterior.get(u.nome_login);
          return typeof antes === "number" && u.paginas_lidas > antes;
        });

        setUsuarios(atual);
        memorizarProgresso(atual);

        if (primeiraCargaRef.current) {
          primeiraCargaRef.current = false;
          return;
        }

        if (alterado) {
          const paginasNovas =
            alterado.paginas_lidas - (anterior.get(alterado.nome_login) || 0);
          iniciarAnimacao(alterado.nome_login, paginasNovas, atual);
        }
      } catch (err) {
        console.error("Erro ao atualizar progresso em tempo real:", err);
      }
    };

    const intervalo = window.setInterval(
      buscarAtualizacoes,
      INTERVALO_ATUALIZACAO_MS
    );

    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
    };
  }, [idObjetivo, iniciarAnimacao, memorizarProgresso]);

  // Desenha estado estático (sem animação) sempre que usuários mudam
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || animacaoAtiva) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frameId = 0;

    const desenhar = () => {
      desenharCenario(ctx);
      const faixasNome: Array<Array<[number, number]>> = [];
      usuarios.forEach((u) => {
        const posX = (u.paginas_lidas / u.total_paginas) * canvas.width;
        desenharJesusParado(ctx, posX, BASE_PERSONAGEM_Y);
        const nomeCurto = primeiroNome(u.nome_login);
        const larguraNome = Math.max(46, nomeCurto.length * 7 + 14);
        const faixa = obterFaixaNome(posX + 8, larguraNome, faixasNome);
        desenharTagNome(ctx, posX + 8, BASE_PERSONAGEM_Y, u.nome_login, faixa * 20);
      });

      frameId = requestAnimationFrame(desenhar);
    };

    desenhar();
    return () => cancelAnimationFrame(frameId);
  }, [
    usuarios,
    animacaoAtiva,
    desenharJesusParado,
    desenharTagNome,
    desenharCenario,
    obterFaixaNome,
    primeiroNome,
  ]);

  // Loop da animação
  useEffect(() => {
    if (!animacaoAtiva) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let personagemX = 0;
    let personagemY = BASE_PERSONAGEM_Y;
    let velocidadeY = 0;
    let frameId = 0;

    const dadosAnimacao = dadosAnimacaoRef.current;
    const usuariosDaAnimacao = dadosAnimacao?.usuarios ?? usuariosRef.current;
    const nomeAnimacao = dadosAnimacao?.nome ?? usuarioAnimando;
    const paginasDaAnimacao = dadosAnimacao?.paginas ?? paginasAnimacao;
    const usuario = usuariosDaAnimacao.find(
      (u) => u.nome_login === nomeAnimacao
    );
    let destinoX = usuario
      ? (usuario.paginas_lidas / usuario.total_paginas) * canvas.width
      : 50;

    const existeOutroNoMesmoPonto = usuariosDaAnimacao.some(
      (u) =>
        u.nome_login !== nomeAnimacao &&
        (u.paginas_lidas / u.total_paginas) * canvas.width === destinoX
    );
    if (existeOutroNoMesmoPonto) {
      destinoX += 20;
    }

    const posicaoInicial = usuario ? destinoX - paginasDaAnimacao * 10 : 50;
    personagemX = Math.max(0, posicaoInicial);
    const posicaoInicialJesus = personagemX;
    const primeiroCactoX = Math.max(personagemX + 70, 220);
    const fimDosCactos =
      primeiroCactoX + (paginasDaAnimacao - 1) * ESPACO_ENTRE_CACTOS;

    const cactos = Array.from({ length: paginasDaAnimacao }, (_, i) => ({
      x: primeiroCactoX + i * ESPACO_ENTRE_CACTOS,
    }));

    const desenharCacto = (x: number) => {
      const baseY = CHAO_Y - 12;
      ctx.fillStyle = "#2f8a3c";
      ctx.strokeStyle = "#5a3825";
      ctx.fillRect(x + 10, baseY - 62, 18, 62);
      ctx.strokeRect(x + 10, baseY - 62, 18, 62);
      ctx.beginPath();
      ctx.arc(x + 19, baseY - 62, 9, Math.PI, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(x, baseY - 42, 8, 28);
      ctx.strokeRect(x, baseY - 42, 8, 28);
      ctx.beginPath();
      ctx.arc(x + 4, baseY - 42, 4, Math.PI, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(x + 32, baseY - 42, 8, 28);
      ctx.strokeRect(x + 32, baseY - 42, 8, 28);
      ctx.beginPath();
      ctx.arc(x + 36, baseY - 42, 4, Math.PI, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    };

    const loop = () => {
      desenharCenario(ctx);

      // cactos
      cactos.forEach((c) => {
        c.x -= velocidadeCenario;
        desenharCacto(c.x);

        if (
          c.x > personagemX &&
          c.x < personagemX + 50 &&
          personagemY === BASE_PERSONAGEM_Y
        ) {
          velocidadeY = forcaPulo;
        }
      });

      // outros usuários
      const faixasNome: Array<Array<[number, number]>> = [];
      usuariosDaAnimacao.forEach((u) => {
        if (u.nome_login === nomeAnimacao) return;
        const pos = (u.paginas_lidas / u.total_paginas) * canvas.width;

        const estaNoCaminho =
          personagemX + 16 >= pos - 10 &&
          personagemX <= pos + 10 &&
          personagemY === BASE_PERSONAGEM_Y;

        if (estaNoCaminho) {
          velocidadeY = forcaPulo;
        }

        let posX = pos;

        if (pos <= posicaoInicialJesus) {
          posX = 300 - 60;
        } else if (pos > destinoX) {
          posX = fimDosCactos + 100;
        }

        desenharJesusParado(ctx, posX, BASE_PERSONAGEM_Y);
        const nomeCurto = primeiroNome(u.nome_login);
        const larguraNome = Math.max(46, nomeCurto.length * 7 + 14);
        const faixa = obterFaixaNome(posX + 8, larguraNome, faixasNome);
        desenharTagNome(ctx, posX + 8, BASE_PERSONAGEM_Y, u.nome_login, faixa * 20);
      });

      // física
      velocidadeY += gravidade;
      personagemY += velocidadeY;
      if (personagemY >= BASE_PERSONAGEM_Y) {
        personagemY = BASE_PERSONAGEM_Y;
        velocidadeY = 0;
      }

      // movimento horizontal
      if (personagemX < destinoX) {
        personagemX += 2;
      }

      desenharJesusCorrendo(ctx, personagemX, personagemY);
      const nomeAnimando = primeiroNome(nomeAnimacao);
      const larguraNomeAnimando = Math.max(46, nomeAnimando.length * 7 + 14);
      const faixaAnimando = obterFaixaNome(
        personagemX + 8,
        larguraNomeAnimando,
        faixasNome
      );
      desenharTagNome(
        ctx,
        personagemX + 8,
        personagemY,
        nomeAnimacao,
        faixaAnimando * 20
      );

      const passouTodosOsCactos = cactos.every((c) => c.x + 10 < personagemX);
      if (
        personagemX >= destinoX &&
        personagemY === BASE_PERSONAGEM_Y &&
        passouTodosOsCactos
      ) {
        setAnimacaoAtiva(false);
        setUsuarioAnimando("");
        setPaginasAnimacao(0);
        dadosAnimacaoRef.current = null;
        return;
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [
    animacaoAtiva,
    usuarioAnimando,
    paginasAnimacao,
    desenharCenario,
    desenharJesusParado,
    desenharJesusCorrendo,
    desenharTagNome,
    obterFaixaNome,
    primeiroNome,
  ]);

  return (
    <div className={styles.gameWrapper}>
      <div className={styles.gameLegend}>
        Progresso do desafio em {unidade}
      </div>
      <canvas
        ref={canvasRef}
        className={styles["game-canvas"]}
        width={CANVAS_LARGURA}
        height={CANVAS_ALTURA}
      />
      <div className={styles.progressoLista}>
        {usuarios
          .slice()
          .sort((a, b) => b.paginas_lidas - a.paginas_lidas)
          .map((u) => {
            const total = Number(u.total_paginas) || 1;
            const lido = Number(u.paginas_lidas) || 0;
            const percentual = Math.min(100, Math.round((lido / total) * 100));
            return (
              <div className={styles.progressoItem} key={u.nome_login}>
                <div className={styles.progressoHeader}>
                  <strong>{u.nome_login}</strong>
                  <span>
                    {lido}/{total} {unidade}
                  </span>
                </div>
                <div className={styles.barraBg}>
                  <div
                    className={styles.barraFill}
                    style={{
                      width: `${percentual}%`,
                      background: corDoUsuario(u.nome_login),
                    }}
                  />
                </div>
                <div className={styles.percentual}>{percentual}%</div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ProgressoObjetivo;
