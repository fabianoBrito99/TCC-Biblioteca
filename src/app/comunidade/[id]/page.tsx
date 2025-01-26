"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Comentarios from "@/componentes/comunidade/comentarios";
import ProgressoForm from "@/componentes/comunidade/progresso";
import Graficos from "@/componentes/comunidade/graficos";
import styles from "../comunidade.module.css";
import GerenciarUsuarios from "@/componentes/comunidade/aceitar-usuario";

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
  curtidas: number;
  usuario_curtiu: boolean;
  fk_id_usuario: string;
}

export default function ComunidadeDetalhesPage() {
  const { id } = useParams();
  const [comunidade, setComunidade] = useState<Comunidade | null>(null);
  const [progresso, setProgresso] = useState<Progresso[]>([]);
  const [idadeStats, setIdadeStats] = useState<EstatisticasIdade[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const comunidadeId = typeof id === "string" ? parseInt(id, 10) : NaN;

  const [userId, setUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Obtém o ID do usuário logado do localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(parseInt(storedUserId, 10));
    }
  }, []);

  useEffect(() => {
    if (!userId || !id) return;

    const verificarAdmin = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/api/comunidade/${id}/verificar-admin/${userId}`
        );
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } catch (error) {
        console.error("Erro ao verificar admin:", error);
      }
    };

    verificarAdmin();
  }, [id, userId]);

  const fetchComentarios = useCallback(async () => {
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
  }, [id]);

  const fetchProgresso = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/comunidade/${id}/progresso`
      );
      if (!response.ok) throw new Error("Erro ao buscar progresso");
      const data: Progresso[] = await response.json(); // Aqui você pode garantir que o tipo é Progresso[]
  
      const progresso = data.map((item) => ({
        ...item,
        paginas_lidas: Number(item.paginas_lidas), // Convertendo para número
      }));
  
      setProgresso(progresso);
    } catch (error) {
      console.error("Erro ao buscar progresso:", error);
    }
  }, [id]);
  

  const fetchEstatisticasIdade = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/comunidade/${id}/estatisticas/idade`
      );
      if (!response.ok) throw new Error("Erro ao buscar estatísticas de idade");
      const data = await response.json();
      setIdadeStats(data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas de idade:", error);
    }
  }, [id]);

  const fetchComunidade = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    if (!id) return;

    fetchComunidade();
    fetchProgresso();
    fetchEstatisticasIdade();
    fetchComentarios();
  }, [
    id,
    fetchComunidade,
    fetchProgresso,
    fetchEstatisticasIdade,
    fetchComentarios,
  ]);

  const atualizarProgresso = () => {
    fetchProgresso(); // Atualiza os dados de progresso
  };

  return (
    <div className={styles.containerComu}>
      {comunidade && (
        <>
          <h1>{comunidade.nome}</h1>
          <p>{comunidade.objetivo}</p>

          <ProgressoForm
            comunidadeId={parseInt(typeof id === "string" ? id : "0", 10)}
            onProgressoAdicionado={atualizarProgresso} // Passando a função de atualização para o filho
          />
          <Graficos progresso={progresso} idadeStats={idadeStats} />
          <div className={styles.containerLateral}>
            <Comentarios
              comunidadeId={parseInt(typeof id === "string" ? id : "0", 10)}
              comentarios={comentarios as Comentario[]}
              atualizarComentarios={fetchComentarios}
            />
          </div>

          <div>
            <h1>Gerenciar Comunidade</h1>
            <GerenciarUsuarios comunidadeId={comunidadeId} isAdmin={isAdmin} />
          </div>
        </>
      )}
    </div>
  );
}
