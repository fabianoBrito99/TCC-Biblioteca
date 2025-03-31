"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Comentarios from "@/componentes/comunidade/comentarios";
import Graficos from "@/componentes/comunidade/graficos";
import styles from "../comunidade.module.css";
import GerenciarUsuarios from "@/componentes/comunidade/aceitar-usuario";
import CriarObjetivo from "@/componentes/comunidadeObjetivo/CriarObjetivo";
import ProgressoObjetivo from "@/componentes/comunidadeObjetivo/ProgressoObjetivo";
import RegistrarProgresso from "@/componentes/comunidadeObjetivo/RegistrarProgresso";

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
  const [idObjetivo, setIdObjetivo] = useState<number | null>(null);
  const [loadingObjetivo, setLoadingObjetivo] = useState(true);

  const [userId, setUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [progressoAtualizado, setProgressoAtualizado] = useState(false);
  const [paginasInseridas, setPaginasInseridas] = useState<number>(0);
  const [usuarioAtual, setUsuarioAtual] = useState("");


  const handleProgressoSalvo = ({ paginas, nome }: { paginas: number; nome: string }) => {
    setPaginasInseridas(paginas);
    setUsuarioAtual(nome);
    setProgressoAtualizado((prev) => !prev);
  };
  
  
  // Obtém o ID do usuário logado do localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(parseInt(storedUserId, 10));
    }
  }, []);

  // Buscar o objetivo ativo da comunidade
  useEffect(() => {
    if (!comunidadeId) return;

    fetch(
      `http://localhost:4000/api/comunidade/${comunidadeId}/objetivo-ativo2`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.idObjetivo) {
          console.log("ID do Objetivo carregado:", data.idObjetivo);
          setIdObjetivo(Number(data.idObjetivo)); // Garante que seja número
        } else {
          setIdObjetivo(null);
        }
      })
      .catch((error) => console.error("Erro ao buscar objetivo ativo:", error))
      .finally(() => setLoadingObjetivo(false));
  }, [comunidadeId]);

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
    if (!idObjetivo) return;

    try {
      const response = await fetch(
        `http://localhost:4000/api/comunidade/objetivo/${idObjetivo}/progresso`
      );

      if (!response.ok) throw new Error("Erro ao buscar progresso");

      const data: Progresso[] = await response.json();

      const progresso = data.map((item) => ({
        ...item,
        paginas_lidas: Number(item.paginas_lidas),
      }));

      console.log("Progresso atualizado:", progresso);
      setProgresso(progresso); // Atualiza a interface
    } catch (error) {
      console.error("Erro ao buscar progresso:", error);
    }
  }, [idObjetivo]);

  // Chama o fetchProgresso sempre que o idObjetivo mudar
  useEffect(() => {
    fetchProgresso();
  }, [idObjetivo]);

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

  return (
    <div className={styles.containerComu}>
      {comunidade && (
        <>
          <h1>{comunidade.nome}</h1>
          <p>{comunidade.objetivo}</p>

          {isAdmin && <CriarObjetivo comunidadeId={comunidadeId} />}

          <div>
            {loadingObjetivo ? (
              <p>Carregando objetivo...</p>
            ) : idObjetivo ? (
              <>
              {userId && idObjetivo && comunidadeId && (
                <RegistrarProgresso
                  comunidadeId={comunidadeId}
                  idObjetivo={idObjetivo}
                  userId={userId}
                  onProgressoSalvo={handleProgressoSalvo} 
                />
              )}

              {userId && idObjetivo && (
                <ProgressoObjetivo
                  idObjetivo={idObjetivo}
                  progressoAtualizado={progressoAtualizado}
                  paginasInseridas={paginasInseridas} 
                  usuarioAtual={usuarioAtual}
                />
                )}
              </>
            ) : (
              <p>Nenhum objetivo ativo no momento.</p>
            )}
          </div>
          <div className={styles.criarObjetivo}>
            {isAdmin && !idObjetivo && (
              <CriarObjetivo comunidadeId={comunidadeId} />
            )}
          </div>
          {/* <CriarObjetivo
            comunidadeId={parseInt(typeof id === "string" ? id : "0", 10)}
          /> */}

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
