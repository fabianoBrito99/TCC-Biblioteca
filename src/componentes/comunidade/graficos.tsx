import React from "react";
import {
  VictoryBar,
  VictoryChart,
  VictoryPie,
  VictoryAxis,
  VictoryLabel,
} from "victory";
import styles from "./graficos.module.css";

interface Progresso {
  nome_usuario: string;
  paginas_lidas: number;
}

interface EstatisticasIdade {
  faixa_etaria: string;
  quantidade: number;
}

interface GraficosProps {
  progresso: Progresso[];
  idadeStats: EstatisticasIdade[];
}


const generateColor = (value: number, maxValue: number) => {
  const intensity = Math.floor((value / maxValue) * 150);
  return `rgba(22, ${250 - intensity}, ${255 - intensity}, 1)`;
};

const Graficos: React.FC<GraficosProps> = ({ progresso, idadeStats }) => {
  const minPaginas = Math.min(
    ...progresso.map((item) => Number(item.paginas_lidas))
  );
  const maxPaginas = Math.max(
    ...progresso.map((item) => Number(item.paginas_lidas))
  );

  const idadeStatsWithNumber = idadeStats.map((item) => ({
    faixa_etaria: item.faixa_etaria,
    paginas_lidas: Number(item.quantidade),
  }));

  const maxQuantidade = Math.max(
    ...idadeStatsWithNumber.map((item) => item.paginas_lidas)
  );

  const totalQuantidade = idadeStatsWithNumber.reduce(
    (sum, item) => sum + item.paginas_lidas,
    0
  );

  return (
    <div className={styles.graficos}>
  <div>
    top 5 que mais está lendo
  </div>

      <div className={styles.chartContainer}>
        <VictoryLabel
          text="Título do Gráfico de Faixa Etária"
          x={200}
          y={50}
          textAnchor="middle"
          style={{
            fontSize: 26,
            fontWeight: "bold",
            fill: "#001f5c",
          }}
        />
        <VictoryPie
          data={idadeStatsWithNumber.map((item) => ({
            x: item.faixa_etaria,
            y: item.paginas_lidas,
            label: `${Math.round(
              (item.paginas_lidas / totalQuantidade) * 100
            )}%`,
          }))}
          labels={({ datum }) => datum.label}
          labelRadius={50}
          style={{
            labels: { fontSize: 12, fill: "#fff", fontWeight: "bold" },
            data: {
              fill: ({ datum }) => generateColor(datum.y, maxQuantidade),
            },
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 500 },
          }}
        />
      </div>

      <div className={styles.legenda}>
        <h4>Legenda</h4>
        {idadeStatsWithNumber.map((item) => {
          const color = generateColor(item.paginas_lidas, maxQuantidade);
          return (
            <div key={item.faixa_etaria} className={styles.legendaItem}>
              <span
                className={styles.legendaCor}
                style={{ backgroundColor: color }}
              ></span>
              {item.faixa_etaria}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Graficos;
