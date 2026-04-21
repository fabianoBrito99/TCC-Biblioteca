import React, { useState, useEffect } from "react";
import styles from "./objetivo.module.css";
import Input from "../forms/input";
import Button from "../forms/button";

interface CriarObjetivoProps {
  comunidadeId: number;
  onObjetivoCriado?: () => void;
}

type TipoMeta = "paginas" | "capitulos";

const CriarObjetivo: React.FC<CriarObjetivoProps> = ({
  comunidadeId,
  onObjetivoCriado,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tipoMeta, setTipoMeta] = useState<TipoMeta>("paginas");
  const [totalMeta, setTotalMeta] = useState<number>(0);
  const [objetivoAtivo, setObjetivoAtivo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Verifica se já existe um objetivo ativo
  useEffect(() => {
    const verificarObjetivoAtivo = async () => {
      try {
        const response = await fetch(
          `https://api.helenaramazzotte.online/api/comunidade/${comunidadeId}/objetivo-ativo`
        );
        const data = await response.json();
        setObjetivoAtivo(data.ativo);
      } catch (error) {
        console.error("Erro ao verificar objetivo ativo:", error);
      }
    };

    verificarObjetivoAtivo();
  }, [comunidadeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (objetivoAtivo) {
      alert("Já existe um objetivo ativo nesta comunidade!");
      return;
    }

    if (totalMeta <= 0) {
      alert("Informe uma meta maior que zero.");
      return;
    }

    setSalvando(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://api.helenaramazzotte.online/api/comunidade/objetivo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            fk_id_comunidade: comunidadeId,
            titulo,
            descricao,
            data_inicio: dataInicio,
            data_fim: dataFim,
            total_paginas: totalMeta,
            tipo_meta: tipoMeta,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error);
        return;
      }

      alert("Objetivo criado com sucesso!");
      setModalOpen(false);
      setObjetivoAtivo(true);
      onObjetivoCriado?.();
    } catch (error) {
      console.error("Erro ao criar objetivo:", error);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div>
      {!objetivoAtivo && (
        <Button
          className={styles["criar-objetivo-btn"]}
          onClick={() => setModalOpen(true)}
        >
          Novo Objetivo
        </Button>
      )}

      {modalOpen && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <h2>Criar Novo Objetivo</h2>
            <form onSubmit={handleSubmit}>
              <Input
                label="Objetivo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
               <Input
                label="Descrição"
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
              />

              <Input
                label="Data Inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
              <Input
                label="Data Fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
              />
              <label className={styles.rotuloMeta} htmlFor="tipo-meta">
                Tipo de Meta
              </label>
              <select
                id="tipo-meta"
                className={styles.selectMeta}
                value={tipoMeta}
                onChange={(e) => setTipoMeta(e.target.value as TipoMeta)}
              >
                <option value="paginas">Páginas</option>
                <option value="capitulos">Capítulos</option>
              </select>
              <Input
                label={`Total de ${tipoMeta === "capitulos" ? "Capítulos" : "Páginas"}`}
                type="number"
                value={totalMeta}
                onChange={(e) => setTotalMeta(Number(e.target.value))}
                required
              />
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
              <div className={styles.fechar}>
                <Button type="button" onClick={() => setModalOpen(false)}>
                  Fechar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriarObjetivo;
