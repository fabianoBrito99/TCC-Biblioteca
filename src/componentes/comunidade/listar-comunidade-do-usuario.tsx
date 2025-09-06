"use client";

import React, { useEffect, useState } from "react";
import styles from "./listar-comunidade.module.css";
import { FaUsers } from "react-icons/fa";

interface Comunidade {
  id_comunidade: number;
  nome: string;
  descricao: string;
  tipo: string;
}

interface ComunidadesUsuarioProps {
  usuarioId?: string;
}

const ComunidadesUsuario: React.FC<ComunidadesUsuarioProps> = ({ usuarioId }) => {
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [mostrarLista, setMostrarLista] = useState(false);

  useEffect(() => {
    const fetchComunidadesUsuario = async () => {
      try {
        const response = await fetch(
          `https://api.helenaramazzotte.online/api/comunidade/usuario/${usuarioId}`
        );
        if (!response.ok) throw new Error("Erro ao buscar comunidades do usuário.");
        const data = await response.json();
        setComunidades(data);
      } catch (error) {
        console.error("Erro ao buscar comunidades do usuário:", error);
      }
    };

    if (usuarioId) {
      fetchComunidadesUsuario();
    }
  }, [usuarioId]);

  return (
    <div className={styles.comunidadesUsuario}>
      <button
        className={styles.toggleButton}
        onClick={() => setMostrarLista(!mostrarLista)}
      >
        <FaUsers size={38}  />
      </button>
      {mostrarLista && (
        <div className={styles.listaComunidades}>
          {comunidades.length > 0 ? (
            comunidades.map((comunidade) => (
              <div key={comunidade.id_comunidade} className={styles.comunidadeCard}>
                <h3>{comunidade.nome}</h3>
                <p>{comunidade.descricao}</p>
                <button onClick={() => window.location.href = `/comunidade/${comunidade.id_comunidade}`}>
                  Acessar
                </button>
              </div>
            ))
          ) : (
            <p>Nenhuma comunidade encontrada.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ComunidadesUsuario;
