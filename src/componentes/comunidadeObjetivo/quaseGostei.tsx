
import React, { useEffect, useRef, useState } from "react";
import styles from "./progresso.module.css";

interface UsuarioProgresso {
  nome_login: string;
  paginas_lidas: number;
  total_paginas: number;
}

interface ProgressoObjetivoProps {
  idObjetivo: number;
  progressoAtualizado: boolean;
  paginasInseridas: number;
  usuarioAtual: string;
}

const ProgressoObjetivo: React.FC<ProgressoObjetivoProps> = ({
  idObjetivo,
  progressoAtualizado,
  paginasInseridas,
  usuarioAtual,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [usuarios, setUsuarios] = useState<UsuarioProgresso[]>([]);
  const [animacaoAtiva, setAnimacaoAtiva] = useState(false);
  const [usuarioAnimando, setUsuarioAnimando] = useState<string>("");

  const velocidadeCenario = 2;
  const gravidade = 0.4;
  const forcaPulo = -10;

  const desenharParte = (ctx: CanvasRenderingContext2D, fn: () => void) => {
    ctx.save();
    fn();
    ctx.strokeStyle = "#5a3825";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };

  const hashCode = (str: string) => {
    return str.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  };

  const intToRGB = (i: number) =>
    "#" +
    ((i >> 24) & 0xff).toString(16).padStart(2, "0") +
    ((i >> 16) & 0xff).toString(16).padStart(2, "0") +
    ((i >> 8) & 0xff).toString(16).padStart(2, "0");

  const desenharJesusParado = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
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
  };

  const desenharJesusCorrendo = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    nome: string
  ) => {
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

    const corFundo = intToRGB(hashCode(nome));
    ctx.fillStyle = corFundo;
    ctx.fillRect(x - 20, 75, nome.length * 7 + 10, 18);
    ctx.fillStyle = "black";
    ctx.font = "10px Arial";
    ctx.fillText(nome, x - nome.length * 3, 88);
  };


  useEffect(() => {
    const carregarProgressoInicial = async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/comunidade/objetivo/${idObjetivo}/progresso`
        );
        const data: UsuarioProgresso[] = await res.json();
        setUsuarios(data);
      } catch (err) {
        console.error("Erro ao carregar progresso inicial:", err);
      }
    };

    carregarProgressoInicial();
  }, [idObjetivo]);

  useEffect(() => {
    if (!progressoAtualizado) return;

    const fetchProgresso = async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/comunidade/objetivo/${idObjetivo}/progresso`
        );
        const data: UsuarioProgresso[] = await res.json();
        setUsuarios(data);

        if (paginasInseridas > 0) {
          setAnimacaoAtiva(true);
          setUsuarioAnimando(usuarioAtual);
        }
      } catch (err) {
        console.error("Erro ao buscar progresso:", err);
      }
    };

    fetchProgresso();
  }, [progressoAtualizado, paginasInseridas, usuarioAtual]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || animacaoAtiva) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const desenhar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f7f7f7";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#b5651d";
      ctx.fillRect(0, 150, canvas.width, 50);

      usuarios.forEach((u) => {
        const posX = (u.paginas_lidas / u.total_paginas) * canvas.width;
        const cor = "#ccc";
        ctx.fillStyle = cor;
        ctx.fillRect(posX - 20, 75, u.nome_login.length * 7 + 10, 18);
        ctx.fillStyle = "black";
        ctx.font = "10px Arial";
        ctx.fillText(u.nome_login, posX - u.nome_login.length * 3, 88);
        desenharJesusParado(ctx, posX, 130);
      });
    };

    desenhar();
  }, [usuarios, animacaoAtiva]);


  useEffect(() => {
    if (!animacaoAtiva) return;
  
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    let personagemX = 0;
    let personagemY = 130;
    let velocidadeY = 0;
  
    const usuario = usuarios.find((u) => u.nome_login === usuarioAnimando);
    const destinoX = usuario
      ? (usuario.paginas_lidas / usuario.total_paginas) * canvas.width
      : 50;
    const posicaoInicial = usuario ? destinoX - paginasInseridas * 10 : 50;
    personagemX = posicaoInicial;
  
    console.log("🚀 Animando usuário:", usuarioAnimando);
    console.log("👉 Início:", posicaoInicial, "| Destino:", destinoX);
  
    const cactos = Array.from({ length: paginasInseridas }, (_, i) => ({
      x: 300 + i * 100,
    }));
  
    const desenharCacto = (x: number) => {
      ctx.fillStyle = "green";
      ctx.strokeStyle = "#5a3825";
      ctx.fillRect(x + 10, 100, 20, 70);
      ctx.strokeRect(x + 10, 100, 20, 70);
      ctx.beginPath();
      ctx.arc(x + 20, 100, 10, Math.PI, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(x, 120, 8, 30);
      ctx.strokeRect(x, 120, 8, 30);
      ctx.beginPath();
      ctx.arc(x + 4, 120, 4, Math.PI, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(x + 32, 120, 8, 30);
      ctx.strokeRect(x + 32, 120, 8, 30);
      ctx.beginPath();
      ctx.arc(x + 36, 120, 4, Math.PI, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    };
  
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // fundo
      ctx.fillStyle = "#f7f7f7";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // chão
      ctx.fillStyle = "#b5651d";
      ctx.fillRect(0, 150, canvas.width, 50);
  
      // desenhar cactos e verificar pulo
      cactos.forEach((c) => {
        c.x -= velocidadeCenario;
        desenharCacto(c.x);
  
        if (
          c.x > personagemX &&
          c.x < personagemX + 50 &&
          personagemY === 130
        ) {
          velocidadeY = forcaPulo;
        }
      });
  
      // desenhar os outros usuários (menos o que está correndo)
      usuarios.forEach((u) => {
        const pos = (u.paginas_lidas / u.total_paginas) * canvas.width;
        if (u.nome_login !== usuarioAnimando) {
          ctx.fillStyle = "#ccc";
          ctx.fillRect(pos - 20, 75, u.nome_login.length * 7 + 10, 18);
          ctx.fillStyle = "black";
          ctx.font = "10px Arial";
          ctx.fillText(u.nome_login, pos - u.nome_login.length * 3, 88);
          desenharJesusParado(ctx, pos, 130);
        }
      });
  
      // verificar se ultrapassou outro usuário e pular
      usuarios
        .filter((u) => u.nome_login !== usuarioAnimando)
        .forEach((u) => {
          const pos = (u.paginas_lidas / u.total_paginas) * canvas.width;
          if (
            personagemX + 16 >= pos - 10 &&
            personagemX <= pos + 10 &&
            personagemY === 130
          ) {
            velocidadeY = forcaPulo;
          }
        });
  
      // física
      velocidadeY += gravidade;
      personagemY += velocidadeY;
      if (personagemY >= 130) {
        personagemY = 130;
        velocidadeY = 0;
      }
  
      // mover para frente
      if (personagemX < destinoX) {
        personagemX += 2;
      } else {
        personagemX = destinoX;
        setAnimacaoAtiva(false);
        setUsuarioAnimando("");
      }
  
      // desenhar Jesus correndo com nome
      desenharJesusCorrendo(ctx, personagemX, personagemY, usuarioAnimando);
  
      // loop
      if (animacaoAtiva) requestAnimationFrame(loop);
    };
  
    requestAnimationFrame(loop);
  }, [animacaoAtiva, usuarios, usuarioAnimando]);
  
  
  

  return (
    <canvas
      ref={canvasRef}
      className={styles["game-canvas"]}
      width={800}
      height={200}
    />
  );
};

export default ProgressoObjetivo;
