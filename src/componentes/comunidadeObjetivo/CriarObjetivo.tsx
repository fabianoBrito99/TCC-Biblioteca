import React, { useState } from "react";
import styles from "./objetivo.module.css";

interface CriarObjetivoProps {
  comunidadeId: number;
}

const CriarObjetivo: React.FC<CriarObjetivoProps> = ({ comunidadeId }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [totalPaginas, setTotalPaginas] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("http://localhost:4000/api/comunidade/objetivo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fk_id_comunidade: comunidadeId,
        titulo,
        descricao,
        data_inicio: dataInicio,
        data_fim: dataFim,
        total_paginas: totalPaginas,
      }),
    });

    alert("Objetivo criado com sucesso!");
    setModalOpen(false);
  };

  return (
    <div>
      <button className={styles["criar-objetivo-btn"]} onClick={() => setModalOpen(true)}>
        Criar Objetivo
      </button>

      {modalOpen && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <h2>Criar Novo Objetivo</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
              <textarea placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required />
              <input type="number" placeholder="Total de Páginas" value={totalPaginas} onChange={(e) => setTotalPaginas(Number(e.target.value))} required />
              <button type="submit">Salvar</button>
              <button type="button" onClick={() => setModalOpen(false)}>Fechar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriarObjetivo;
