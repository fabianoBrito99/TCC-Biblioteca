"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Checkin, Guardian, myKidsApi, PrinterSettings, Room } from "@/lib/mykids-api";
import styles from "./mykids.module.css";

type Tab = "checkin" | "guardians" | "rooms" | "today" | "printer";
type ChildDraft = { name: string; birth_date: string; gender: string; notes: string; room_id: string };
const emptyChild = (): ChildDraft => ({ name: "", birth_date: "", gender: "", notes: "", room_id: "" });

export default function MyKidsPage() {
  const [tab, setTab] = useState<Tab>("checkin");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [today, setToday] = useState<Checkin[]>([]);
  const [printer, setPrinter] = useState<PrinterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedGuardian, setSelectedGuardian] = useState("");
  const [selectedChild, setSelectedChild] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [created, setCreated] = useState<Checkin | null>(null);
  const [search, setSearch] = useState("");
  const [guardianForm, setGuardianForm] = useState({ name: "", email: "", phone: "", status: "visitante", children: [emptyChild()] });
  const [roomForm, setRoomForm] = useState({ name: "", age_range: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [roomData, guardianData, todayData, printerData] = await Promise.all([
        myKidsApi.rooms(), myKidsApi.guardians(), myKidsApi.today(), myKidsApi.printer(),
      ]);
      setRooms(roomData); setGuardians(guardianData); setToday(todayData); setPrinter(printerData);
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao carregar MyKids"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const guardian = guardians.find((item) => item.id === Number(selectedGuardian));
  const openRooms = rooms.filter((room) => Boolean(room.is_open));
  const filteredGuardians = useMemo(() => {
    const term = search.toLocaleLowerCase("pt-BR").trim();
    return term ? guardians.filter((g) => [g.name, g.email, g.phone, ...g.children.map((c) => c.name)].some((v) => v?.toLocaleLowerCase("pt-BR").includes(term))) : guardians;
  }, [guardians, search]);

  async function submitCheckin(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      const checkin = await myKidsApi.createCheckin({ guardian_id: Number(selectedGuardian), child_id: Number(selectedChild), room_id: Number(selectedRoom) });
      setCreated(checkin); setMessage("Check-in realizado e etiqueta criada."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Erro no check-in"); }
  }

  async function submitGuardian(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      await myKidsApi.createGuardian({ ...guardianForm, children: guardianForm.children.map((c) => ({ ...c, room_id: c.room_id ? Number(c.room_id) : null })) });
      setGuardianForm({ name: "", email: "", phone: "", status: "visitante", children: [emptyChild()] });
      setMessage("Responsável e crianças cadastrados."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Erro no cadastro"); }
  }

  async function submitRoom(event: FormEvent) {
    event.preventDefault(); setError("");
    try { await myKidsApi.createRoom({ ...roomForm, is_open: true }); setRoomForm({ name: "", age_range: "" }); setMessage("Sala criada."); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Erro ao criar sala"); }
  }

  async function toggleRoom(room: Room) {
    try { await myKidsApi.updateRoom(room.id, { is_open: !Boolean(room.is_open) }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Erro ao atualizar sala"); }
  }

  async function submitPrinter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!printer) return;
    try { setPrinter(await myKidsApi.updatePrinter(printer)); setMessage("Configuração da impressora salva."); }
    catch (e) { setError(e instanceof Error ? e.message : "Erro ao salvar impressora"); }
  }

  const publicUrl = created && typeof window !== "undefined" ? `${window.location.origin}/mykids-etiqueta/${created.public_code}` : "";

  return <main className={styles.page}>
    <header><p className={styles.eyebrow}>Ministério infantil</p><h1>MyKids</h1><p>Cadastro, check-in e etiquetas em um só lugar.</p></header>
    <nav className={styles.tabs} aria-label="Seções MyKids">
      {([['checkin','Check-in'],['guardians','Responsáveis'],['rooms','Salas'],['today','Hoje'],['printer','Impressora']] as [Tab,string][]).map(([key,label]) =>
        <button key={key} className={tab === key ? styles.active : ""} onClick={() => setTab(key)}>{label}</button>)}
    </nav>
    {error && <p className={styles.error} role="alert">{error}</p>}{message && <p className={styles.success}>{message}</p>}
    {loading ? <div className={styles.card}>Carregando dados...</div> : <>
      {tab === "checkin" && <section className={styles.grid}>
        <form className={styles.card} onSubmit={submitCheckin}><h2>Novo check-in</h2>
          {!openRooms.length && <p className={styles.warning}>Não há sala aberta. Abra uma sala antes de realizar check-in.</p>}
          <label>Responsável<select required value={selectedGuardian} onChange={(e) => { setSelectedGuardian(e.target.value); setSelectedChild(""); }}><option value="">Selecione</option>{guardians.map((g) => <option key={g.id} value={g.id}>{g.name} — {g.status}</option>)}</select></label>
          <label>Criança<select required value={selectedChild} onChange={(e) => { const value=e.target.value; setSelectedChild(value); const child=guardian?.children.find(c=>c.id===Number(value)); setSelectedRoom(child?.room_id ? String(child.room_id) : ""); }}><option value="">Selecione</option>{guardian?.children.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.checkins_count} check-ins)</option>)}</select></label>
          <label>Sala aberta<select required value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}><option value="">Selecione</option>{openRooms.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.age_range}</option>)}</select></label>
          <button className={styles.primary} disabled={!openRooms.length}>Confirmar check-in</button>
        </form>
        <aside className={styles.card}><h2>Última etiqueta</h2>{created ? <><strong className={styles.childName}>{created.child_name_snapshot}</strong><p>{created.room_name_snapshot}</p><code>{created.public_code}</code><a className={styles.linkButton} href={publicUrl} target="_blank" rel="noreferrer">Abrir etiqueta pública</a></> : <p>A etiqueta aparecerá aqui após o check-in.</p>}</aside>
      </section>}
      {tab === "guardians" && <section className={styles.grid}>
        <form className={styles.card} onSubmit={submitGuardian}><h2>Novo responsável</h2>
          <div className={styles.twoCols}><label>Nome<input required value={guardianForm.name} onChange={e=>setGuardianForm({...guardianForm,name:e.target.value})}/></label><label>Status<select value={guardianForm.status} onChange={e=>setGuardianForm({...guardianForm,status:e.target.value})}><option value="visitante">Visitante</option><option value="familia">Família</option></select></label><label>E-mail<input type="email" value={guardianForm.email} onChange={e=>setGuardianForm({...guardianForm,email:e.target.value})}/></label><label>Telefone<input value={guardianForm.phone} onChange={e=>setGuardianForm({...guardianForm,phone:e.target.value})}/></label></div>
          <h3>Crianças</h3>{guardianForm.children.map((child,index)=><fieldset key={index}><legend>Criança {index+1}</legend><div className={styles.twoCols}><label>Nome<input required value={child.name} onChange={e=>{const children=[...guardianForm.children];children[index]={...child,name:e.target.value};setGuardianForm({...guardianForm,children});}}/></label><label>Nascimento<input type="date" value={child.birth_date} onChange={e=>{const children=[...guardianForm.children];children[index]={...child,birth_date:e.target.value};setGuardianForm({...guardianForm,children});}}/></label><label>Gênero<input value={child.gender} onChange={e=>{const children=[...guardianForm.children];children[index]={...child,gender:e.target.value};setGuardianForm({...guardianForm,children});}}/></label><label>Sala<select value={child.room_id} onChange={e=>{const children=[...guardianForm.children];children[index]={...child,room_id:e.target.value};setGuardianForm({...guardianForm,children});}}><option value="">Sem sala</option>{rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label></div><label>Observações<textarea value={child.notes} onChange={e=>{const children=[...guardianForm.children];children[index]={...child,notes:e.target.value};setGuardianForm({...guardianForm,children});}}/></label>{guardianForm.children.length > 1 && <button type="button" className={styles.textButton} onClick={()=>setGuardianForm({...guardianForm,children:guardianForm.children.filter((_,i)=>i!==index)})}>Remover criança</button>}</fieldset>)}
          <button type="button" className={styles.secondary} onClick={()=>setGuardianForm({...guardianForm,children:[...guardianForm.children,emptyChild()]})}>+ Adicionar criança</button><button className={styles.primary}>Salvar cadastro</button>
        </form>
        <div className={styles.card}><h2>Cadastros</h2><input placeholder="Buscar nome, e-mail ou telefone" value={search} onChange={e=>setSearch(e.target.value)}/><div className={styles.list}>{filteredGuardians.map(g=><article key={g.id}><div><strong>{g.name}</strong><span className={styles.badge}>{g.status}</span></div><small>{g.email || "Sem e-mail"} · {g.phone || "Sem telefone"}</small><ul>{g.children.map(c=><li key={c.id}>{c.name} — {c.checkins_count} check-ins</li>)}</ul></article>)}</div></div>
      </section>}
      {tab === "rooms" && <section className={styles.grid}><form className={styles.card} onSubmit={submitRoom}><h2>Nova sala</h2><label>Nome<input required value={roomForm.name} onChange={e=>setRoomForm({...roomForm,name:e.target.value})}/></label><label>Faixa etária<input required placeholder="Ex.: 9 a 11 anos" value={roomForm.age_range} onChange={e=>setRoomForm({...roomForm,age_range:e.target.value})}/></label><button className={styles.primary}>Criar sala</button></form><div className={styles.card}><h2>Salas</h2><div className={styles.list}>{rooms.map(r=><article key={r.id} className={styles.room}><div><strong>{r.name}</strong><small>{r.age_range}</small></div><button className={Boolean(r.is_open)?styles.open:styles.closed} onClick={()=>toggleRoom(r)}>{Boolean(r.is_open)?'Aberta':'Fechada'}</button></article>)}</div></div></section>}
      {tab === "today" && <section className={styles.card}><h2>Check-ins de hoje <span className={styles.count}>{today.length}</span></h2><div className={styles.tableWrap}><table><thead><tr><th>Horário</th><th>Criança</th><th>Responsável</th><th>Sala</th><th>Etiqueta</th></tr></thead><tbody>{today.map(c=><tr key={c.public_code}><td>{new Date(c.created_at.replace(' ','T')).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td><td>{c.child_name_snapshot}</td><td>{c.guardian_name_snapshot}</td><td>{c.room_name_snapshot}</td><td><a href={`/mykids-etiqueta/${c.public_code}`} target="_blank">Abrir</a></td></tr>)}</tbody></table></div></section>}
      {tab === "printer" && <form className={styles.card} onSubmit={submitPrinter}><h2>Configuração da impressora</h2>{printer ? <div className={styles.twoCols}><label>Nome<input value={printer.printer_name||''} onChange={e=>setPrinter({...printer,printer_name:e.target.value})}/></label><label>URL da ponte<input type="url" value={printer.bridge_url||''} onChange={e=>setPrinter({...printer,bridge_url:e.target.value})}/></label><label>Largura (mm)<input type="number" step="0.1" min="1" value={printer.label_width} onChange={e=>setPrinter({...printer,label_width:Number(e.target.value)})}/></label><label>Altura (mm)<input type="number" step="0.1" min="1" value={printer.label_height} onChange={e=>setPrinter({...printer,label_height:Number(e.target.value)})}/></label><label className={styles.checkbox}><input type="checkbox" checked={Boolean(printer.is_active)} onChange={e=>setPrinter({...printer,is_active:e.target.checked})}/> Impressora ativa</label></div>:<p>Configuração não encontrada.</p>}<button className={styles.primary} disabled={!printer}>Salvar configuração</button></form>}
    </>}
  </main>;
}
