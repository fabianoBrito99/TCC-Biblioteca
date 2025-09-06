import React, { useEffect, useState } from "react";
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryArea,
  VictoryScatter,
} from "victory";

interface LeituraDia {
  dia: string;
  total: number;
}

interface Props {
  idUsuario: number;
  idComunidade: number;
}

interface APILeituraDia {
  dia: string;
  total: number | string;
}

const LeituraDiaria: React.FC<Props> = ({ idUsuario, idComunidade }) => {
  const [dados, setDados] = useState<LeituraDia[]>([]);

  useEffect(() => {
    fetch(
      `https://api.helenaramazzotte.online/api/comunidade/${idComunidade}/usuario/${idUsuario}/leitura-diaria`
    )
      .then((res) => res.json())
      .then((data: APILeituraDia[]) => {
        const formatado: LeituraDia[] = data.map((item) => ({
          dia: item.dia.split("T")[0],
          total: Number(item.total),
        }));
        setDados(formatado);
      })
      .catch((err) => console.error("Erro ao buscar leitura diária:", err));
  }, [idUsuario, idComunidade]);

  if (dados.length < 2) return <p>Sem dados suficientes para exibir gráfico.</p>;

  const segmentos: { data: LeituraDia[]; cor: string }[] = [];
  for (let i = 1; i < dados.length; i++) {
    const anterior = dados[i - 1];
    const atual = dados[i];
    const cor = atual.total >= anterior.total ? "#2ecc71" : "#e74c3c";
    segmentos.push({ data: [anterior, atual], cor });
  }

  return (
    <div>
      <h3>📈 Evolução Diária da Leitura</h3>
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={15}
        padding={{ top: 20, bottom: 60, left: 60, right: 20 }}
        style={{ background: { fill: "#fdf8e2" } }}
      >
        {/* Eixo X */}
        <VictoryAxis
          fixLabelOverlap
          tickFormat={(t: string | number) => {
            if (typeof t === "string" && t.includes("-")) {
              const parts = t.split("-");
              const dia = parts[2];
              const mes = parts[1];
              return `${dia}/${mes}`;
            }
            return typeof t === "number" ? t.toString() : "";
          }}
          style={{
            tickLabels: { fontSize: 10, angle: 45 },
            grid: { stroke: "transparent" },
          }}
        />

        {/* Eixo Y */}
        <VictoryAxis
          dependentAxis
          tickFormat={(x: number) => x.toString()}
          style={{
            tickLabels: { fontSize: 10 },
            grid: { stroke: "#ccc", strokeDasharray: "4 4" },
          }}
        />

        {/* Áreas preenchidas por segmento */}
        {segmentos.map((segmento, i) => (
          <VictoryArea
            key={`area-${i}`}
            data={segmento.data}
            x="dia"
            y="total"
            style={{
              data: { fill: segmento.cor, fillOpacity: 0.2, stroke: "none" },
            }}
          />
        ))}

        {/* Linhas com cor por segmento */}
        {segmentos.map((segmento, i) => (
          <VictoryLine
            key={`line-${i}`}
            data={segmento.data}
            x="dia"
            y="total"
            style={{ data: { stroke: segmento.cor, strokeWidth: 3 } }}
            labels={({ datum }) => `${datum.total}`}
            labelComponent={<VictoryTooltip />}
          />
        ))}

        {/* Bolinhas sobre os pontos */}
        <VictoryScatter
          data={dados}
          x="dia"
          y="total"
          size={4}
          style={{
            data: { fill: "#34495e", stroke: "#fff", strokeWidth: 1 },
          }}
        />
      </VictoryChart>
    </div>
  );
};

export default LeituraDiaria;
