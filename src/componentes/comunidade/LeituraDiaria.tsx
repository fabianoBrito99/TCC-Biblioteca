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

const LeituraDiaria: React.FC<Props> = ({ idUsuario, idComunidade }) => {
  const [dados, setDados] = useState<LeituraDia[]>([]);

  useEffect(() => {
    fetch(
      `http://localhost:4000/api/comunidade/${idComunidade}/usuario/${idUsuario}/leitura-diaria`
    )
      .then((res) => res.json())
      .then((data) => {
        const formatado = data.map((item: any) => ({
          dia: item.dia.split("T")[0],
          total: Number(item.total),
        }));
        setDados(formatado);
        console.log("📅 Leitura diária:", formatado);
      })
      .catch((err) => console.error("Erro ao buscar leitura diária:", err));
  }, [idUsuario, idComunidade]);

  if (dados.length < 2)
    return <p>Sem dados suficientes para exibir gráfico.</p>;

  const segmentos = [];
  for (let i = 1; i < dados.length; i++) {
    const anterior = dados[i - 1];
    const atual = dados[i];

    const cor = atual.total >= anterior.total ? "#2ecc71" : "#e74c3c"; // verde ou vermelho
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
          tickFormat={(t) => {
            if (typeof t === "string" && t.includes("-")) {
              const [ano, mes, dia] = t.split("-");
              return `${dia}/${mes}`;
            }
            return "";
          }}
          style={{
            tickLabels: { fontSize: 10, angle: 45 },
            grid: { stroke: "transparent" },
          }}
        />

        {/* Eixo Y */}
        <VictoryAxis
          dependentAxis
          tickFormat={(x) => `${x}`}
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
              data: {
                fill: segmento.cor,
                fillOpacity: 0.2,
                stroke: "none",
              },
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
            style={{
              data: {
                stroke: segmento.cor,
                strokeWidth: 3,
              },
            }}
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
            data: {
              fill: "#34495e", // cinza escuro discreto
              stroke: "#fff",
              strokeWidth: 1,
            },
          }}
        />
      </VictoryChart>
    </div>
  );
};

export default LeituraDiaria;
