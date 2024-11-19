import React from "react";
import {
  VictoryBar,
  VictoryChart,
  VictoryPie,
  VictoryAxis,
  VictoryLabel,
} from "victory";
import styles from "./graficos.module.css";
import { start } from "repl";

interface Progresso {
  nome_usuario: string;
  paginas_lidas: string; // Agora é string, como no seu exemplo
}

interface EstatisticasIdade {
  faixa_etaria: string;
  quantidade: number;
  paginas_lidas: string;
}

interface GraficosProps {
  progresso: Progresso[];
  idadeStats: EstatisticasIdade[];
}

const generateColor = (value: number, maxValue: number) => {
  const intensity = Math.floor((value / maxValue) * 150);
  return `rgba(22, 0, ${255 - intensity}, 1)`;
};

const Graficos: React.FC<GraficosProps> = ({ progresso, idadeStats }) => {
  // Converte as páginas lidas para números
  const minPaginas = Math.min(
    ...progresso.map((item) => Number(item.paginas_lidas))
  );
  const maxPaginas = Math.max(
    ...progresso.map((item) => Number(item.paginas_lidas))
  );

  // Garantindo que idadeStats seja corretamente formatado
  const idadeStatsWithNumber = idadeStats.map((item) => ({
    faixa_etaria: item.faixa_etaria,
    paginas_lidas: Number(item.paginas_lidas), // Converte para número
  }));

  const maxQuantidade = Math.max(
    ...idadeStatsWithNumber.map((item) => item.paginas_lidas)
  );

  // Calcular a soma total para porcentagens
  const totalQuantidade = idadeStatsWithNumber.reduce(
    (sum, item) => sum + item.paginas_lidas,
    0
  );

  return (
    <div className={styles.graficos}>
      <div>
        <VictoryChart domainPadding={20}>
          <VictoryLabel
            text="Quem está lendo mais" // Texto do título
            x={225} // Posição horizontal do título (ajuste conforme necessário)
            y={30} // Posição vertical do título (ajuste conforme necessário)
            textAnchor="middle" // Centraliza o texto
            style={{ fontSize: 16, fontWeight: "bold", fill: "#001f5c" }}
          />
          <VictoryAxis
            style={{
              tickLabels: { fontSize: 12, angle: -45, fill: "#001f5c" },
            }}
            tickFormat={progresso.map((item) => item.nome_usuario)}
          />
          <VictoryAxis
            dependentAxis
            style={{
              tickLabels: { fontSize: 10, fill: "#001f5c" },
            }}
            tickFormat={(x) => `${x}`}
            domain={{ y: [minPaginas - 5, maxPaginas + 5] }}
          />
          <VictoryBar
            data={progresso.map((item) => ({
              x: item.nome_usuario,
              y: Number(item.paginas_lidas),
              fill: generateColor(Number(item.paginas_lidas), maxPaginas),
            }))}
            labels={({ datum }) => `${datum.y} páginas`}
            style={{
              data: {
                fill: ({ datum }: any) => datum.fill,
                width: 25,
              },
              labels: {
                fill: "#001f5c",
                fontSize: 12,
                fontWeight: "bold",
              },
            }}
          />
        </VictoryChart>
      </div>
      
      {/* Gráfico de Faixa Etária */}
      <div className={styles.chartContainer}>
        {/* Título do gráfico de pizza */}
        <VictoryLabel
          text="Título do Gráfico de Faixa Etária"
          x="50%" // Centraliza horizontalmente
          y={50} // Posiciona o título um pouco acima do gráfico
          textAnchor="middle"
          style={{
            fontSize: 26,
            fontWeight: "bold",
            fill: "#001f5c",
          }}
        />

        {/* Gráfico de Pizza */}
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

      {/* Legenda */}
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
