"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Checkin, myKidsApi } from "@/lib/mykids-api";
import styles from "./etiqueta.module.css";

export default function EtiquetaPublicaPage() {
  const params = useParams<{ codigo: string }>();
  const [data, setData] = useState<Checkin | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.codigo) {
      myKidsApi.publicCheckin(params.codigo).then(setData).catch((e) =>
        setError(e instanceof Error ? e.message : "Etiqueta nao encontrada")
      );
    }
  }, [params.codigo]);

  if (error) return <main className={styles.state}><h1>Etiqueta nao encontrada</h1><p>{error}</p></main>;
  if (!data) return <main className={styles.state}>Carregando etiqueta...</main>;

  const children = data.children?.length ? data.children : [data];

  return (
    <main className={styles.page}>
      <section className={styles.label}>
        <p className={styles.brand}>MYKIDS</p>
        <h1>{data.guardian_name_snapshot}</h1>
        <dl>
          {data.guardian_phone_snapshot && <div><dt>Telefone</dt><dd>{data.guardian_phone_snapshot}</dd></div>}
          {data.guardian_email_snapshot && <div><dt>E-mail</dt><dd>{data.guardian_email_snapshot}</dd></div>}
        </dl>
        <h2>Criancas</h2>
        <div className={styles.children}>
          {children.map((child) => (
            <article key={`${child.child_id}-${child.created_at}`}>
              <strong>#{String(child.arrival_number || 0).padStart(3, "0")} {child.child_name_snapshot}</strong>
              <span>{child.room_name_snapshot}</span>
              {child.child_notes_snapshot && <p>{child.child_notes_snapshot}</p>}
              <small>{child.checked_out_at ? "Saiu da sala" : "Dentro da sala"}</small>
            </article>
          ))}
        </div>
        <small>Codigo: {data.public_code}</small>
      </section>
      <button onClick={() => window.print()}>Imprimir etiqueta</button>
    </main>
  );
}
