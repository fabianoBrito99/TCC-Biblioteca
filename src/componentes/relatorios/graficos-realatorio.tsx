"use client";

import React, { useState, useEffect } from "react";
import {
  VictoryBar,
  VictoryChart,
  VictoryPie,
  VictoryAxis,
  VictoryLabel,
} from "victory";
import styles from "./graficos2.module.css";

interface Emprestimo {
  usuario: string;
  livro: string;
  dataPrevista: string;
  status: string;
}

interface FaixaEtaria {
  faixa_etaria?: string;
  faixa?: string;
  quantidade: number;
}

interface LivroEmprestado {
  mes: string;
  quantidade: number;
}

interface DadosGraficos {
  livrosEmprestados: LivroEmprestado[];
  faixaEtaria: FaixaEtaria[];
  emprestimosAtrasados: Emprestimo[];
}

const Relatorios = () => {
  const hoje = new Date();
  const dataFimDefault = hoje.toISOString().split("T")[0];
  const dataInicioDefault = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [dataInicio, setDataInicio] = useState(dataInicioDefault);
  const [dataFim, setDataFim] = useState(dataFimDefault);
  const [rangeSelecionado, setRangeSelecionado] = useState("30 dias");
  const [carregando] = useState(false);
  const [erro, setErro] = useState("");
  const [dadosGraficos, setDadosGraficos] = useState<DadosGraficos | null>(
    null
  );

  const ranges = [
    { label: "30 dias", dias: 30 },
    { label: "60 dias", dias: 60 },
    { label: "90 dias", dias: 90 },
    { label: "1 ano", dias: 365 },
  ];

  const handleRangeSelecionado = (dias: number) => {
    const hoje = new Date();
    const dataInicio = new Date(hoje.getTime() - dias * 24 * 60 * 60 * 1000);
    setDataInicio(dataInicio.toISOString().split("T")[0]);
    setDataFim(hoje.toISOString().split("T")[0]);
    setRangeSelecionado(`${dias} dias`);
  };

  useEffect(() => {
    if (dataInicio && dataFim) {
      console.log("Buscando relatórios para o intervalo:", dataInicio, dataFim);

      let isCancelled = false;

      const fetchData = async () => {
        try {
          const response = await fetch(
            `http://localhost:4000/api/relatorios?dataInicio=${dataInicio}&dataFim=${dataFim}`
          );
          const data = await response.json();

          if (response.ok) {
            if (!isCancelled) {
              console.log("Dados recebidos da API:", data);
              setDadosGraficos(data);
            }
          } else {
            throw new Error("Erro na resposta da API");
          }
        } catch (error) {
          console.error("Erro ao buscar dados dos relatórios:", error);
          setErro("Erro ao carregar os dados.");
        }
      };

      fetchData();

      return () => {
        isCancelled = true;
      };
    } else {
      console.warn("Datas não definidas, abortando chamada da API.");
    }
  }, [dataInicio, dataFim]);

  const formatarFaixaEtaria = (faixa: FaixaEtaria) => {
    return faixa.faixa_etaria || faixa.faixa || "Desconhecida";
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>Relatórios da Biblioteca</h1>

      <div className={styles.filtros}>
        <div className={styles.inputGroup}>
          <label htmlFor="dataInicio">Data Início:</label>
          <input
            id="dataInicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="dataFim">Data Fim:</label>
          <input
            id="dataFim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
        <div className={styles.selectGroup}>
          <label htmlFor="range">Período:</label>
          <select
            id="range"
            value={rangeSelecionado}
            onChange={(e) => {
              const dias = ranges.find((r) => r.label === e.target.value)?.dias;
              if (dias) handleRangeSelecionado(dias);
            }}
          >
            {ranges.map((range) => (
              <option key={range.dias} value={range.label}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {carregando && <p>Carregando dados...</p>}
      {erro && <p className={styles.erro}>{erro}</p>}

      {dadosGraficos && (
        <div className={styles.graficos}>
          <div>
            <VictoryChart domainPadding={20}>
              <VictoryLabel
                text="Livros Emprestados"
                x={225}
                y={30}
                textAnchor="middle"
                style={{ fontSize: 16, fontWeight: "bold" }}
              />
              <VictoryAxis />
              <VictoryAxis dependentAxis />
              <VictoryBar
                data={dadosGraficos.livrosEmprestados}
                x="mes"
                y="quantidade"
                labels={({ datum }) => `${datum.quantidade}`}
                style={{ data: { fill: "#4caf50" }, labels: { fill: "#333" } }}
              />
            </VictoryChart>
          </div>

          <div>
            <VictoryPie
              data={dadosGraficos.faixaEtaria.map((faixa: FaixaEtaria) => ({
                x: formatarFaixaEtaria(faixa),
                y: faixa.quantidade,
                label: `${faixa.quantidade} livros`,
              }))}
              labels={({ datum }) => `${datum.label}`}
              style={{
                labels: { fontSize: 12, fill: "#fff" },
                data: { fill: ({ datum }) => datum.color || "#4caf50" },
              }}
            />
          </div>

          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Livro</th>
                <th>Data Prevista</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dadosGraficos.emprestimosAtrasados.map(
                (item: Emprestimo, idx: number) => (
                  <tr key={idx}>
                    <td>{item.usuario}</td>
                    <td>{item.livro}</td>
                    <td>{new Date(item.dataPrevista).toLocaleDateString()}</td>
                    <td>{item.status}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Relatorios;
