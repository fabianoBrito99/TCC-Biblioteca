"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Comentarios from "@/componentes/comunidade/comentarios";
import ProgressoForm from "@/componentes/comunidade/progresso";
import Graficos from "@/componentes/comunidade/graficos";
import styles from "../comunidade.module.css";
import Notificacoes from "@/componentes/notificacoes/notificacoes";

interface Comunidade {
  id_comunidade: number;
  nome: string;
  descricao: string;
  objetivo: string;
}

interface Progresso {
  nome_usuario: string;
  paginas_lidas: number;
}

interface EstatisticasIdade {
  faixa_etaria: string;
  quantidade: number;
}

interface Comentario {
  id_comentario: number;
  comentario: string;
  nome_usuario: string;
  foto_usuario: string;
  data_comentario: string;
}

export default function ComunidadeDetalhesPage() {
  const { id } = useParams();
  const [comunidade, setComunidade] = useState<Comunidade | null>(null);
  const [progresso, setProgresso] = useState<Progresso[]>([]);
  const [idadeStats, setIdadeStats] = useState<EstatisticasIdade[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);

  const fetchComentarios = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/comunidade/${id}/comentarios`
      );
      if (!response.ok) throw new Error("Erro ao buscar comentários");
      const data = await response.json();
      setComentarios(data);
    } catch (error) {
      console.error("Erro ao buscar comentários:", error);
    }
  };

  const fetchProgresso = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/comunidade/${id}/progresso`
      );
      if (!response.ok) throw new Error("Erro ao buscar progresso");
      const data = await response.json();
      setProgresso(data);
    } catch (error) {
      console.error("Erro ao buscar progresso:", error);
    }
  };

  const fetchEstatisticasIdade = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/comunidade/${id}/estatisticas/idade`
      );
      if (!response.ok)
        throw new Error("Erro ao buscar estatísticas de idade");
      const data = await response.json();
      setIdadeStats(data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas de idade:", error);
    }
  };

  const atualizarProgresso = () => {
    fetchProgresso(); // Atualiza os dados de progresso
  };

  useEffect(() => {
    if (!id) return;

    fetchComunidade();
    fetchProgresso();
    fetchEstatisticasIdade();
    fetchComentarios();
  }, [id]);

  const fetchComunidade = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/comunidade/${id}`
      );
      if (!response.ok) throw new Error("Erro ao buscar comunidade");
      const data = await response.json();
      setComunidade(data);
    } catch (error) {
      console.error("Erro na requisição da comunidade:", error);
    }
  };

  return (
    <div className={styles.containerComu}>
      {comunidade && (
        <>
          <h1>{comunidade.nome}</h1>
          <p>{comunidade.objetivo}</p>

          <ProgressoForm
            comunidadeId={parseInt(id)}
            onProgressoAdicionado={atualizarProgresso} // Passando a função de atualização para o filho
          />
          <Graficos progresso={progresso} idadeStats={idadeStats} />
          <div className={styles.containerLateral}>
            <Comentarios
              comunidadeId={parseInt(id)}
              comentarios={comentarios}
              atualizarComentarios={fetchComentarios}
            />
          </div>
        </>
      )}
    </div>
  );
}
