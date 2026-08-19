"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Checkin, myKidsApi } from "@/lib/mykids-api";
import styles from "./etiqueta.module.css";

export default function EtiquetaPublicaPage() {
  const params = useParams<{ codigo: string }>();
  const [data, setData] = useState<Checkin | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { if (params.codigo) myKidsApi.publicCheckin(params.codigo).then(setData).catch(e=>setError(e instanceof Error?e.message:"Etiqueta não encontrada")); }, [params.codigo]);
  if (error) return <main className={styles.state}><h1>Etiqueta não encontrada</h1><p>{error}</p></main>;
  if (!data) return <main className={styles.state}>Carregando etiqueta...</main>;
  return <main className={styles.page}><section className={styles.label}>
    <p className={styles.brand}>MYKIDS</p><h1>{data.child_name_snapshot}</h1><strong>{data.room_name_snapshot}</strong>
    <dl><div><dt>Responsável</dt><dd>{data.guardian_name_snapshot}</dd></div>{data.guardian_phone_snapshot&&<div><dt>Telefone</dt><dd>{data.guardian_phone_snapshot}</dd></div>}{data.child_notes_snapshot&&<div><dt>Observações</dt><dd>{data.child_notes_snapshot}</dd></div>}</dl>
    <small>Código: {data.public_code}</small>
  </section><button onClick={()=>window.print()}>Imprimir etiqueta</button></main>;
}
