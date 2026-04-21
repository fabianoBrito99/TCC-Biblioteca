"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Comentarios from "@/componentes/comunidade/comentarios";
// Removido import de Graficos (não usado)
import TopLeitores from "@/componentes/comunidade/graficos";
import styles from "../comunidade.module.css";
import GerenciarUsuarios from "@/componentes/comunidade/aceitar-usuario";
import CriarObjetivo from "@/componentes/comunidadeObjetivo/CriarObjetivo";
import ProgressoObjetivo from "@/componentes/comunidadeObjetivo/ProgressoObjetivo";
import RegistrarProgresso from "@/componentes/comunidadeObjetivo/RegistrarProgresso";
import LeituraDiaria from "@/componentes/comunidade/LeituraDiaria";
import IndicadoresLeitura from "@/componentes/comunidade/IndicadoresLeitura";

const API_BASE = "https://api.helenaramazzotte.online/api";

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

interface ObjetivoAtivo {
  id_objetivo: number;
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  total_meta: number;
  tipo_meta: "paginas" | "capitulos";
}

interface Participante {
  id_usuario: number;
  nome_login: string;
  nivel_acesso: "admin" | "auxiliar" | "membro";
}

interface EstatisticasIdade {
  faixa_etaria: string;
  quantidade: number;
}

export default function ComunidadeDetalhesPage() {
  const { id } = useParams();
  const routeCommunityKey = typeof id === "string" ? id : "";
  const [comunidade, setComunidade] = useState<Comunidade | null>(null);

  // Ignora a variável de estado (apenas mantém o setter usado no fetch)
  const [, setProgresso] = useState<Progresso[]>([]);
  const [, setIdadeStats] = useState<EstatisticasIdade[]>([]);

  const [comunidadeId, setComunidadeId] = useState<number | null>(null);
  const [resolvendoComunidade, setResolvendoComunidade] = useState(true);
  const [idObjetivo, setIdObjetivo] = useState<number | null>(null);
  const [objetivoAtivo, setObjetivoAtivo] = useState<ObjetivoAtivo | null>(null);
  const [tipoMeta, setTipoMeta] = useState<"paginas" | "capitulos">("paginas");
  const [loadingObjetivo, setLoadingObjetivo] = useState(true);
  const [editandoObjetivo, setEditandoObjetivo] = useState(false);
  const [salvandoObjetivo, setSalvandoObjetivo] = useState(false);
  const [formObjetivo, setFormObjetivo] = useState({
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    total_meta: 0,
    tipo_meta: "paginas" as "paginas" | "capitulos",
  });

  const [userId, setUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nivelAcesso, setNivelAcesso] = useState<"admin" | "auxiliar" | "membro">("membro");
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [progressoAtualizado, setProgressoAtualizado] = useState(false);
  const [paginasInseridas, setPaginasInseridas] = useState<number>(0);
  const [usuarioAtual, setUsuarioAtual] = useState("");

  const handleProgressoSalvo = ({
    paginas,
    nome,
  }: {
    paginas: number;
    nome: string;
  }) => {
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

  useEffect(() => {
    const resolve = async () => {
      if (!routeCommunityKey) return;
      setResolvendoComunidade(true);
      const asNumber = Number(routeCommunityKey);
      if (Number.isFinite(asNumber) && asNumber > 0) {
        setComunidadeId(asNumber);
        setResolvendoComunidade(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/comunidade/slug/${routeCommunityKey}`);
        if (!res.ok) throw new Error("Comunidade não encontrada");
        const data = await res.json();
        setComunidadeId(Number(data.id_comunidade));
      } catch (error) {
        console.error("Erro ao resolver comunidade por slug:", error);
        setComunidadeId(null);
      } finally {
        setResolvendoComunidade(false);
      }
    };
    resolve();
  }, [routeCommunityKey]);

  // Buscar o objetivo ativo da comunidade
  const carregarObjetivoAtivo = useCallback(async () => {
    if (!comunidadeId) return;

    try {
      const res = await fetch(`${API_BASE}/comunidade/${comunidadeId}/objetivo-ativo2`);
      if (!res.ok) {
        setIdObjetivo(null);
        return;
      }
      const data = await res.json();
      if (data.idObjetivo) {
        setIdObjetivo(Number(data.idObjetivo));
        setTipoMeta(data.objetivo?.tipo_meta === "capitulos" ? "capitulos" : "paginas");
        const objetivo = data.objetivo as ObjetivoAtivo;
        setObjetivoAtivo(objetivo);
        setFormObjetivo({
          titulo: objetivo?.titulo || "",
          descricao: objetivo?.descricao || "",
          data_inicio: objetivo?.data_inicio || "",
          data_fim: objetivo?.data_fim || "",
          total_meta: Number(objetivo?.total_meta || 0),
          tipo_meta: objetivo?.tipo_meta === "capitulos" ? "capitulos" : "paginas",
        });
      } else {
        setIdObjetivo(null);
        setObjetivoAtivo(null);
      }
    } catch (error) {
      console.error("Erro ao buscar objetivo ativo:", error);
    } finally {
      setLoadingObjetivo(false);
    }
  }, [comunidadeId]);

  useEffect(() => {
    carregarObjetivoAtivo();
  }, [carregarObjetivoAtivo]);

  useEffect(() => {
    if (!userId || !comunidadeId) return;
    // Nível será definido pelo retorno dos participantes para evitar inconsistência.
  }, [comunidadeId, userId]);

  const fetchParticipantes = useCallback(async () => {
    if (!comunidadeId) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(`${API_BASE}/comunidade/${comunidadeId}/participantes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erro ao buscar participantes");
      const data = await response.json();
      const lista = Array.isArray(data) ? data : [];
      setParticipantes(lista);

      if (userId) {
        const eu = lista.find((p) => Number(p.id_usuario) === Number(userId));
        const nivel =
          eu?.nivel_acesso === "admin" || eu?.nivel_acesso === "auxiliar"
            ? eu.nivel_acesso
            : "membro";
        setNivelAcesso(nivel);
        setIsAdmin(nivel === "admin" || nivel === "auxiliar");
      }
    } catch (error) {
      console.error("Erro ao buscar participantes:", error);
    }
  }, [comunidadeId, userId]);

  const fetchProgresso = useCallback(async () => {
    if (!idObjetivo) return;

    try {
      const response = await fetch(
        `https://api.helenaramazzotte.online/api/comunidade/objetivo/${idObjetivo}/progresso`
      );

      if (!response.ok) throw new Error("Erro ao buscar progresso");

      const data: Progresso[] = await response.json();

      const progresso = data.map((item) => ({
        ...item,
        paginas_lidas: Number(item.paginas_lidas),
      }));

      console.log("Progresso atualizado:", progresso);
      setProgresso(progresso);
    } catch (error) {
      console.error("Erro ao buscar progresso:", error);
    }
  }, [idObjetivo]);

  // Inclui fetchProgresso como dependência para satisfazer o lint
  useEffect(() => {
    fetchProgresso();
  }, [idObjetivo, fetchProgresso]);

  const fetchEstatisticasIdade = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.helenaramazzotte.online/api/comunidade/${comunidadeId}/estatisticas/idade`
      );
      if (!response.ok) throw new Error("Erro ao buscar estatísticas de idade");
      const data = await response.json();
      setIdadeStats(data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas de idade:", error);
    }
  }, [comunidadeId]);

  const fetchComunidade = useCallback(async () => {
    try {
      if (!comunidadeId) return;
      const response = await fetch(`${API_BASE}/comunidade/${comunidadeId}`);
      if (!response.ok) throw new Error("Erro ao buscar comunidade");
      const data = await response.json();
      setComunidade(data);
    } catch (error) {
      console.error("Erro na requisição da comunidade:", error);
    }
  }, [comunidadeId]);

  useEffect(() => {
    if (!comunidadeId) return;

    fetchComunidade();
    fetchProgresso();
    fetchEstatisticasIdade();
    fetchParticipantes();
  }, [comunidadeId, fetchComunidade, fetchProgresso, fetchEstatisticasIdade, fetchParticipantes]);

  const handleFinalizarObjetivo = async () => {
    if (!idObjetivo) return;
    const confirmou = window.confirm(
      "Deseja encerrar este desafio agora? Após isso será possível criar um novo objetivo."
    );
    if (!confirmou) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/comunidade/objetivo/${idObjetivo}/finalizar`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Não foi possível finalizar o desafio.");
        return;
      }
      alert("Desafio encerrado. Você já pode iniciar um novo objetivo.");
      await carregarObjetivoAtivo();
      setEditandoObjetivo(false);
    } catch (error) {
      console.error("Erro ao finalizar objetivo:", error);
    }
  };

  const handleSalvarEdicaoObjetivo = async () => {
    if (!idObjetivo) return;
    try {
      setSalvandoObjetivo(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/comunidade/objetivo/${idObjetivo}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          titulo: formObjetivo.titulo,
          descricao: formObjetivo.descricao,
          data_inicio: formObjetivo.data_inicio,
          data_fim: formObjetivo.data_fim,
          total_paginas: formObjetivo.total_meta,
          tipo_meta: formObjetivo.tipo_meta,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Não foi possível editar o objetivo.");
        return;
      }
      alert("Objetivo atualizado com sucesso.");
      setEditandoObjetivo(false);
      await carregarObjetivoAtivo();
    } catch (error) {
      console.error("Erro ao editar objetivo:", error);
    } finally {
      setSalvandoObjetivo(false);
    }
  };

  const handleSairComunidade = async () => {
    if (!comunidadeId) return;
    const ok = window.confirm("Deseja sair desta comunidade?");
    if (!ok) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/comunidade/${comunidadeId}/sair`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Não foi possível sair da comunidade.");
        return;
      }
      window.location.href = "/comunidade";
    } catch (error) {
      console.error("Erro ao sair da comunidade:", error);
    }
  };

  const handleExcluirComunidade = async () => {
    if (!comunidadeId) return;
    const ok = window.confirm("Tem certeza que deseja excluir esta comunidade? Essa ação não pode ser desfeita.");
    if (!ok) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/comunidade/${comunidadeId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Não foi possível excluir a comunidade.");
        return;
      }
      window.location.href = "/comunidade";
    } catch (error) {
      console.error("Erro ao excluir comunidade:", error);
    }
  };

  return (
    <div className={styles.containerComu}>
      {resolvendoComunidade && <p>Carregando comunidade...</p>}
      {!resolvendoComunidade && !comunidadeId && <p>Comunidade não encontrada.</p>}
      {comunidade && (
        <>
          <h1>{comunidade.nome}</h1>
          <p>{comunidade.descricao}</p>
          <p className={styles.nivelAtual}>
            Seu nível na comunidade:{" "}
            <strong>
              {nivelAcesso === "admin" ? "Admin" : nivelAcesso === "auxiliar" ? "Auxiliar" : "Membro"}
            </strong>
          </p>

          <div>
            {loadingObjetivo ? (
              <p>Carregando objetivo...</p>
            ) : idObjetivo ? (
              <>
                {objetivoAtivo && (
                  <div className={styles.objetivoCard}>
                    <h3>{objetivoAtivo.titulo}</h3>
                    <p>{objetivoAtivo.descricao}</p>
                    <p>
                      Meta: <strong>{objetivoAtivo.total_meta}</strong>{" "}
                      {objetivoAtivo.tipo_meta === "capitulos" ? "capítulos" : "páginas"}
                    </p>
                    <p>
                      Período: {new Date(objetivoAtivo.data_inicio).toLocaleDateString()} até{" "}
                      {new Date(objetivoAtivo.data_fim).toLocaleDateString()}
                    </p>
                    {isAdmin && (
                      <div className={styles.objetivoAcoes}>
                        <button
                          className={styles.editarObjetivoBtn}
                          onClick={() => setEditandoObjetivo((prev) => !prev)}
                        >
                          {editandoObjetivo ? "Fechar edição" : "Editar objetivo"}
                        </button>
                        <button
                          className={styles.finalizarObjetivoBtn}
                          onClick={handleFinalizarObjetivo}
                        >
                          Encerrar desafio agora
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isAdmin && editandoObjetivo && (
                  <div className={styles.edicaoObjetivoBox}>
                    <h4>Editar objetivo</h4>
                    <input
                      value={formObjetivo.titulo}
                      onChange={(e) =>
                        setFormObjetivo((prev) => ({ ...prev, titulo: e.target.value }))
                      }
                      placeholder="Título"
                    />
                    <input
                      value={formObjetivo.descricao}
                      onChange={(e) =>
                        setFormObjetivo((prev) => ({ ...prev, descricao: e.target.value }))
                      }
                      placeholder="Descrição"
                    />
                    <div className={styles.linhaEdicao}>
                      <input
                        type="date"
                        value={formObjetivo.data_inicio}
                        onChange={(e) =>
                          setFormObjetivo((prev) => ({ ...prev, data_inicio: e.target.value }))
                        }
                      />
                      <input
                        type="date"
                        value={formObjetivo.data_fim}
                        onChange={(e) =>
                          setFormObjetivo((prev) => ({ ...prev, data_fim: e.target.value }))
                        }
                      />
                    </div>
                    <div className={styles.linhaEdicao}>
                      <select
                        value={formObjetivo.tipo_meta}
                        onChange={(e) =>
                          setFormObjetivo((prev) => ({
                            ...prev,
                            tipo_meta: e.target.value as "paginas" | "capitulos",
                          }))
                        }
                      >
                        <option value="paginas">Páginas</option>
                        <option value="capitulos">Capítulos</option>
                      </select>
                      <input
                        type="number"
                        value={formObjetivo.total_meta}
                        onChange={(e) =>
                          setFormObjetivo((prev) => ({
                            ...prev,
                            total_meta: Number(e.target.value),
                          }))
                        }
                        placeholder="Total"
                      />
                    </div>
                    <button
                      className={styles.salvarEdicaoBtn}
                      onClick={handleSalvarEdicaoObjetivo}
                      disabled={salvandoObjetivo}
                    >
                      {salvandoObjetivo ? "Salvando..." : "Salvar edição"}
                    </button>
                  </div>
                )}

                {userId && idObjetivo && comunidadeId && (
                  <RegistrarProgresso
                    comunidadeId={comunidadeId}
                    idObjetivo={idObjetivo}
                    userId={userId}
                    tipoMeta={tipoMeta}
                    onProgressoSalvo={handleProgressoSalvo}
                  />
                )}

                {userId && idObjetivo && (
                  <ProgressoObjetivo
                    idObjetivo={idObjetivo}
                    tipoMeta={tipoMeta}
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
            {isAdmin && !idObjetivo && comunidadeId && (
              <CriarObjetivo comunidadeId={comunidadeId} onObjetivoCriado={carregarObjetivoAtivo} />
            )}
          </div>

          {comunidadeId && (
            <div className={styles.containerLateral}>
              <Comentarios comunidadeId={comunidadeId} />
            </div>
          )}

          <div>
            {comunidadeId && <TopLeitores idComunidade={String(comunidadeId)} />}
          </div>

          <div>
            {userId && comunidadeId && (
              <IndicadoresLeitura
                idUsuario={userId}
                idComunidade={comunidadeId}
              />
            )}
          </div>

          <div>
            {userId && comunidadeId && (
              <div className={styles.leitura_diaria}>
                <LeituraDiaria idUsuario={userId} idComunidade={comunidadeId} />
              </div>
            )}
          </div>

          <div>
            {comunidadeId && (
              <GerenciarUsuarios
                comunidadeId={comunidadeId}
                isAdmin={isAdmin}
                nivelAcesso={nivelAcesso}
              />
            )}
          </div>

          <div className={styles.participantesBox}>
            <h2>Participantes</h2>
            {participantes.length === 0 ? (
              <p>Nenhum participante encontrado.</p>
            ) : (
              <ul className={styles.participantesLista}>
                {participantes.map((participante) => (
                  <li key={participante.id_usuario} className={styles.participanteItem}>
                    <span className={styles.participanteNome}>{participante.nome_login}</span>
                    <span className={`${styles.nivelTag} ${styles[`nivel_${participante.nivel_acesso}`]}`}>
                      {participante.nivel_acesso === "admin"
                        ? "Admin"
                        : participante.nivel_acesso === "auxiliar"
                        ? "Auxiliar"
                        : "Membro"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.comunidadeAcoesFinal}>
            {nivelAcesso === "admin" && (
              <button className={styles.excluirComunidadeBtn} onClick={handleExcluirComunidade}>
                Excluir comunidade
              </button>
            )}
            <button className={styles.sairComunidadeBtn} onClick={handleSairComunidade}>
              Sair da comunidade
            </button>
          </div>
        </>
      )}
    </div>
  );
}
