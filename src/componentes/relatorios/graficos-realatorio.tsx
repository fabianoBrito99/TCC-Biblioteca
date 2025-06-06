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
import GaugeChart from "react-gauge-chart";
import Image from "next/image";

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

interface LivroPopular {
  nome_livro: string;
  quantidade: number;
}

interface UsuarioPopular {
  nome_login: string;
  quantidade: number;
}

interface LeituraSexo {
  sexo: string;
  quantidade: number;
}
interface Categoria{
  categoria_principal: string; 
  quantidade: number
}

interface DadosGraficos {
  livrosEmprestados: LivroEmprestado[];
  faixaEtaria: FaixaEtaria[];
  emprestimosAtrasados: Emprestimo[];
  totalLivros: number;
  totalAnterior: number;
  topLivros: LivroPopular[];
  topLeitores: UsuarioPopular[];
  topAutores: { nome_autor: string; quantidade: number }[];
  topCategorias: Categoria[];
  leituraPorSexo: LeituraSexo[];
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
      let isCancelled = false;
      const fetchData = async () => {
        try {
          const response = await fetch(
            `http://localhost:4000/api/relatorios?dataInicio=${dataInicio}&dataFim=${dataFim}`
          );
          const data = await response.json();
          if (response.ok && !isCancelled) {
            setDadosGraficos(data);
          } else {
            throw new Error("Erro na resposta da API");
          }
        } catch (error) {
          setErro("Erro ao carregar os dados.");
        }
      };

      fetchData();
      return () => {
        isCancelled = true;
      };
    }
  }, [dataInicio, dataFim]);

  const formatarFaixaEtaria = (faixa: FaixaEtaria) => {
    switch (faixa.faixa_etaria || faixa.faixa) {
      case "Menor de 18":
        return "< 18 anos";
      case "18-24":
        return "18–24 anos";
      case "25-34":
        return "25–34 anos";
      case "35-44":
        return "35–44 anos";
      case "45+":
        return "45+ anos";
      default:
        return "Desconhecida";
    }
  };

  const formatarSexo = (sexo: string) => {
    return sexo === "M" ? "Masculino" : sexo === "F" ? "Feminino" : "Outro";
  };

  const coresDinamicas = [
    "#4caf50",
    "#2196f3",
    "#ff9800",
    "#9c27b0",
    "#f44336",
  ];

  const calcularVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return (((atual - anterior) / anterior) * 100).toFixed(1);
  };

  let variacao = "0";
  let gaugePercent = 0.5;

  if (dadosGraficos) {
    variacao = calcularVariacao(
      dadosGraficos.totalLivros,
      dadosGraficos.totalAnterior
    );
    gaugePercent = (Number(variacao) + 100) / 200;
  }

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
        <>
          {/* KPIs com estilo */}
          <div style={{ gap: 20, marginBottom: 30 }}>
            <div className={styles.dashboardCards}>
              <div className={`${styles.kpiCard} ${styles.kpiChart}`}>
                <div className={styles.kpiTitle}>📘 Livros lidos</div>
                <div className={styles.kpiValue}>
                  {dadosGraficos.totalLivros}
                </div>
                <div
                  className={styles.kpiVariation}
                  style={{
                    color:
                      dadosGraficos.totalLivros >= dadosGraficos.totalAnterior
                        ? "green"
                        : "red",
                  }}
                >
                  {calcularVariacao(
                    dadosGraficos.totalLivros,
                    dadosGraficos.totalAnterior
                  )}
                  %
                </div>

                <div className={styles.kpiProgress}>
                  <GaugeChart
                    id="gauge-var-chart"
                    nrOfLevels={20}
                    percent={gaugePercent}
                    textColor="#000"
                    arcPadding={0.02}
                    colors={["#f44336", "#e0e0e0", "#4caf50"]}
                    needleColor="#333"
                    formatTextValue={() => `${variacao}%`}
                  />
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiTitle}>🏆 Top Leitor</div>
                <div className={styles.kpiValue}>
                  {dadosGraficos.topLeitores[0]?.nome_login}
                </div>
                <div className={styles.kpiVariation}>
                  {dadosGraficos.topLeitores[0]?.quantidade} leituras
                </div>
                <div>
                  <Image
                    src="/jesus_primeiro.png"
                    alt="primeiro"
                    className={styles.primeiro}
                    width={150}
                    height={300}
                  />
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiTitle}>📖 Livro Mais Lido</div>
                <div className={styles.kpiValue}>
                  {dadosGraficos.topLivros[0]?.nome_livro}
                </div>
                <div className={styles.kpiVariation}>
                  {dadosGraficos.topLivros[0]?.quantidade} leituras
                </div>
                <div>
                  <Image
                    src="/jesus_livro.png"
                    alt="primeiro"
                    className={styles.primeiro}
                    width={150}
                    height={300}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos de Pizza */}
          <div className={styles.graficos}>
            <div>
              <h3 style={{ textAlign: "center" }}>Leitura por Sexo</h3>
              <VictoryPie
                data={dadosGraficos.leituraPorSexo.map((s) => ({
                  x: formatarSexo(s.sexo),
                  y: s.quantidade,
                }))}
                colorScale={coresDinamicas}
                labels={({ datum }) =>
                  `${datum.x}\n${(
                    (datum.y / dadosGraficos.totalLivros) *
                    100
                  ).toFixed(1)}%`
                }
                labelRadius={50}
                style={{
                  labels: { fontSize: 10, fill: "white", fontWeight: "bold" },
                }}
              />
            </div>

            <div>
              <h3 style={{ textAlign: "center" }}>Leitura por Faixa Etária</h3>
              <VictoryPie
                data={dadosGraficos.faixaEtaria.map((f) => ({
                  x: formatarFaixaEtaria(f),
                  y: f.quantidade,
                }))}
                colorScale={coresDinamicas}
                labels={({ datum }) =>
                  `${datum.x}\n${(
                    (datum.y / dadosGraficos.totalLivros) *
                    100
                  ).toFixed(1)}%`
                }
                labelRadius={50}
                style={{
                  labels: { fontSize: 10, fill: "white", fontWeight: "bold" },
                }}
              />
            </div>
          </div>
          <svg style={{ height: 0 }}>
            <defs>
              <linearGradient id="azulGradiente" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="1e3a8a" />
              </linearGradient>
            </defs>
          </svg>
          <div className={styles.gridDoisUm}>
            {/* Gradiente azul global */}

            {/* Leitores */}
            <div>
              <VictoryChart domainPadding={20}>
                <VictoryLabel
                  text="Top 5 Leitores"
                  x={225}
                  y={60}
                  textAnchor="middle"
                  style={{ fontSize: 16, fontWeight: "bold" }}
                />
                <VictoryAxis
                  style={{
                    tickLabels: {
                      angle: -30,
                      fontSize: 14,
                      textAnchor: "end",
                    },
                  }}
                />
                <VictoryAxis dependentAxis />
                <VictoryBar
                  data={dadosGraficos.topLeitores.map((u) => ({
                    x: u.nome_login,
                    y: u.quantidade,
                  }))}
                  style={{ data: { fill: "url(#azulGradiente)" } }}
                />
              </VictoryChart>
            </div>
            <div>
              {/* Livros */}
              <VictoryChart domainPadding={20}>
                <VictoryLabel
                  text="Top 5 Livros"
                  x={225}
                  y={40}
                  textAnchor="middle"
                  style={{ fontSize: 16, fontWeight: "bold" }}
                  dy={10}
                />
                <VictoryAxis
                  style={{
                    tickLabels: {
                      angle: -20,
                      fontSize: 14,
                      textAnchor: "end",
                    },
                  }}
                />
                <VictoryAxis dependentAxis />
                <VictoryBar
                  data={dadosGraficos.topLivros.map((l) => ({
                    x: l.nome_livro,
                    y: l.quantidade,
                  }))}
                  style={{ data: { fill: "url(#azulGradiente)" } }}
                />
              </VictoryChart>
            </div>
            <div>
              {/* Autores */}
              <VictoryChart domainPadding={20}>
                <VictoryLabel
                  text="Top 5 Autores"
                  x={225}
                  y={30}
                  textAnchor="middle"
                  style={{ fontSize: 16, fontWeight: "bold" }}
                />
                <VictoryAxis
                  style={{
                    tickLabels: {
                      angle: -30,
                      fontSize: 14,
                      textAnchor: "end",
                    },
                  }}
                />
                <VictoryAxis dependentAxis />
                <VictoryBar
                  data={dadosGraficos.topAutores.map((a) => ({
                    x: a.nome_autor,
                    y: a.quantidade,
                  }))}
                  style={{ data: { fill: "url(#azulGradiente)" } }}
                />
              </VictoryChart>
            </div>
            <div>
              {/* Categorias */}
              <VictoryChart domainPadding={20}>
                <VictoryLabel
                  text="Top 5 Categorias"
                  x={225}
                  y={30}
                  textAnchor="middle"
                  style={{ fontSize: 16, fontWeight: "bold" }}
                />
                <VictoryAxis
                  style={{
                    tickLabels: {
                      angle: -30,
                      fontSize: 14,
                      textAnchor: "end",
                    },
                  }}
                />
                <VictoryAxis dependentAxis />
                <VictoryBar
                  data={dadosGraficos.topCategorias.map((c) => ({
                    x: c.categoria_principal,
                    y: c.quantidade,
                  }))}
                  style={{ data: { fill: "url(#azulGradiente)" } }}
                />
              </VictoryChart>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Relatorios;
