import React, { useEffect, useState } from "react";
import styles from "./objetivo.module.css";

interface ProgressoObjetivoProps {
  idObjetivo: number;
}

const ProgressoObjetivo: React.FC<ProgressoObjetivoProps> = ({ idObjetivo }) => {
  const [progresso, setProgresso] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  useEffect(() => {
    fetch(`http://localhost:4000/api/comunidade/objetivo/${idObjetivo}/progresso`)
      .then((res) => res.json())
      .then((data) => {
        const paginasLidas = data.reduce((acc:any, curr:any) => acc + curr.paginas_lidas, 0);
        setProgresso(paginasLidas);
        setTotalPaginas(data[0]?.total_paginas || 1);
      });
  }, [idObjetivo]);

  const progressoPercentual = Math.min((progresso / totalPaginas) * 100, 100);

  return (
    <div className={styles["progress-container"]}>
      <div className={styles["progress-bar"]} style={{ width: `${progressoPercentual}%` }} />
      <div className={styles["character"]} style={{ left: `${progressoPercentual}%` }}>
        ✝️🏃‍♂️
      </div>
    </div>
  );
};

export default ProgressoObjetivo;
