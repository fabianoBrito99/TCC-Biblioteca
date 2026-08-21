"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBaby,
  FaChevronDown,
  FaDoorOpen,
  FaHome,
  FaPeopleArrows,
  FaPlus,
  FaPrint,
  FaSearch,
  FaUserFriends,
} from "react-icons/fa";
import { Checkin, Guardian, myKidsApi, PrinterSettings, Room } from "@/lib/mykids-api";
import styles from "./page.module.css";

type Tab = "inicio" | "salas" | "checkin" | "pessoas";
type PrintMode = "completo" | "crianca";
type ChildDraft = {
  name: string;
  birth_date: string;
  gender: string;
  notes: string;
  room_id: string;
};

const emptyChild = (roomId = ""): ChildDraft => ({
  name: "",
  birth_date: "",
  gender: "",
  notes: "",
  room_id: roomId,
});

const fallbackPrinter: PrinterSettings = {
  id: 0,
  printer_name: "ZD220-203dpi ZPL",
  bridge_url: "http://127.0.0.1:9123/print",
  label_width: 30,
  label_height: 60,
  is_active: true,
};

function cleanZplText(value: string | null | undefined) {
  return String(value || "").replace(/\^|~/g, "").slice(0, 42);
}

function publicLabelUrl(checkin: Checkin) {
  if (typeof window === "undefined") return `/mykids-etiqueta/${checkin.public_code}`;
  return `${window.location.origin}/mykids-etiqueta/${checkin.public_code}`;
}

function childZpl(checkin: Checkin, qrContent: string) {
  const code = checkin.public_code.slice(-6).toUpperCase();
  return `^XA
^PW480
^LL320
^FO28,24^A0N,32,32^FD${cleanZplText(checkin.child_name_snapshot)}^FS
^FO28,66^A0N,22,22^FD${cleanZplText(checkin.room_name_snapshot)}^FS
^FO28,96^A0N,22,22^FDResp: ${cleanZplText(checkin.guardian_name_snapshot)}^FS
^FO28,126^A0N,20,20^FD${new Date(checkin.created_at.replace(" ", "T")).toLocaleString("pt-BR")}^FS
^FO28,158^BQN,2,5^FDLA,${qrContent}^FS
^FO190,176^A0N,24,24^FDCodigo^FS
^FO190,208^A0N,36,36^FD${code}^FS
^XZ`;
}

function guardianZpl(checkin: Checkin, qrContent: string) {
  const code = checkin.public_code.slice(-6).toUpperCase();
  return `^XA
^PW480
^LL320
^FO28,24^A0N,30,30^FDResponsavel^FS
^FO28,62^A0N,28,28^FD${cleanZplText(checkin.guardian_name_snapshot)}^FS
^FO28,98^A0N,22,22^FDCrianca: ${cleanZplText(checkin.child_name_snapshot)}^FS
^FO28,128^A0N,22,22^FDSala: ${cleanZplText(checkin.room_name_snapshot)}^FS
^FO28,158^BQN,2,5^FDLA,${qrContent}^FS
^FO190,176^A0N,24,24^FDCodigo^FS
^FO190,208^A0N,36,36^FD${code}^FS
^XZ`;
}

function buildPrintJob(checkin: Checkin, mode: PrintMode) {
  if (mode === "crianca") {
    const qrText = `NOME:${checkin.child_name_snapshot};SALA:${checkin.room_name_snapshot};CODIGO:${checkin.public_code}`;
    return childZpl(checkin, qrText);
  }

  const url = publicLabelUrl(checkin);
  return `${childZpl(checkin, url)}\n${guardianZpl(checkin, url)}`;
}

export default function MyKidsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("inicio");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [today, setToday] = useState<Checkin[]>([]);
  const [printer, setPrinter] = useState<PrinterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [printerStatus, setPrinterStatus] = useState("Zebra aguardando check-in");
  const [showNewRoomForm, setShowNewRoomForm] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);
  const [expandedGuardian, setExpandedGuardian] = useState<number | null>(null);
  const [checkinSearch, setCheckinSearch] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [roomForm, setRoomForm] = useState({ name: "", age_range: "" });
  const [guardianForm, setGuardianForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "visitante" as Guardian["status"],
    children: [emptyChild()],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [roomData, guardianData, todayData, printerData] = await Promise.all([
        myKidsApi.rooms(),
        myKidsApi.guardians(),
        myKidsApi.today(),
        myKidsApi.printer(),
      ]);
      setRooms(roomData);
      setGuardians(guardianData);
      setToday(todayData);
      setPrinter(printerData || fallbackPrinter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar MyKids");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openRooms = rooms.filter((room) => Boolean(room.is_open));
  const people = useMemo(
    () => guardians.flatMap((guardian) => guardian.children.map((child) => ({ guardian, child }))),
    [guardians]
  );

  const filteredPeople = useMemo(() => {
    const term = checkinSearch.toLocaleLowerCase("pt-BR").trim();
    if (!term) return people;
    return people.filter(({ guardian, child }) =>
      [guardian.name, guardian.email, guardian.phone, child.name]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(term))
    );
  }, [checkinSearch, people]);

  const filteredGuardians = useMemo(() => {
    const term = peopleSearch.toLocaleLowerCase("pt-BR").trim();
    if (!term) return guardians;
    return guardians.filter((guardian) =>
      [guardian.name, guardian.email, guardian.phone, ...guardian.children.map((child) => child.name)]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(term))
    );
  }, [guardians, peopleSearch]);

  const roomTotals = rooms.map((room) => ({
    ...room,
    total: today.filter((checkin) => checkin.room_id === room.id || checkin.room_name_snapshot === room.name).length,
    checkins: today.filter((checkin) => checkin.room_id === room.id || checkin.room_name_snapshot === room.name),
  }));

  function updateChildDraft(index: number, updates: Partial<ChildDraft>) {
    setGuardianForm((current) => ({
      ...current,
      children: current.children.map((child, childIndex) =>
        childIndex === index ? { ...child, ...updates } : child
      ),
    }));
  }

  async function submitRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await myKidsApi.createRoom({ ...roomForm, is_open: true });
      setRoomForm({ name: "", age_range: "" });
      setShowNewRoomForm(false);
      setMessage("Sala criada.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar sala");
    }
  }

  async function toggleRoom(room: Room) {
    try {
      await myKidsApi.updateRoom(room.id, { is_open: !Boolean(room.is_open) });
      if (Boolean(room.is_open)) setExpandedRoom(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar sala");
    }
  }

  async function submitGuardian(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await myKidsApi.createGuardian({
        ...guardianForm,
        children: guardianForm.children.map((child) => ({
          ...child,
          room_id: child.room_id ? Number(child.room_id) : null,
        })),
      });
      setGuardianForm({
        name: "",
        email: "",
        phone: "",
        status: "visitante",
        children: [emptyChild(rooms[0]?.id ? String(rooms[0].id) : "")],
      });
      setShowPersonForm(false);
      setMessage("Responsavel e criancas cadastrados.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no cadastro");
    }
  }

  async function makeCheckin(guardianId: number, childId: number, roomId: number | null) {
    if (!openRooms.length) return;
    const selectedRoom = openRooms.find((room) => room.id === roomId) ?? openRooms[0];
    setError("");
    setMessage("");
    try {
      const checkin = await myKidsApi.createCheckin({
        guardian_id: guardianId,
        child_id: childId,
        room_id: selectedRoom.id,
      });
      setMessage("Check-in realizado.");
      await printLabel(checkin, "completo");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no check-in");
    }
  }

  async function printLabel(checkin: Checkin, mode: PrintMode) {
    const settings = printer || fallbackPrinter;
    const zpl = buildPrintJob(checkin, mode);
    try {
      const response = await fetch(settings.bridge_url || fallbackPrinter.bridge_url || "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zpl, printerName: settings.printer_name || undefined }),
      });
      if (!response.ok) throw new Error("Falha na ponte Zebra");
      setPrinterStatus(mode === "completo" ? "2 etiquetas enviadas para a Zebra" : "Etiqueta enviada para a Zebra");
    } catch {
      setPrinterStatus(`Confira se a ponte Zebra esta rodando em ${settings.bridge_url || fallbackPrinter.bridge_url}`);
    }
  }

  async function detectPrinterBridge() {
    const healthUrl = (printer?.bridge_url || fallbackPrinter.bridge_url || "").replace(/\/print\/?$/, "/health");
    setError("");
    try {
      const response = await fetch(healthUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("Ponte respondeu com erro");
      const data = await response.json().catch(() => ({}));
      const detectedPrinter = typeof data.printerName === "string" && data.printerName ? data.printerName : null;
      setPrinter({
        ...(printer || fallbackPrinter),
        bridge_url: (typeof data.printUrl === "string" && data.printUrl) || printer?.bridge_url || fallbackPrinter.bridge_url,
        printer_name: detectedPrinter,
        is_active: true,
      });
      setPrinterStatus(detectedPrinter ? `Zebra conectada: ${detectedPrinter}` : "Ponte Zebra conectada");
    } catch {
      setPrinterStatus(`Nao consegui conectar em ${healthUrl}`);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>Ministerio infantil</span>
          <h1>MyKids</h1>
        </div>
        <button className={styles.printButton} onClick={detectPrinterBridge}>
          <FaPrint />
          Zebra
        </button>
      </header>

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      {loading ? (
        <section className={styles.content}>
          <div className={styles.panel}>Carregando dados...</div>
        </section>
      ) : (
        <>
          {activeTab === "inicio" && (
            <section className={styles.content}>
              <div className={styles.hero}>
                <div>
                  <span className={styles.kicker}>Culto de hoje</span>
                  <h2>{today.length} criancas em check-in</h2>
                  <p>{openRooms.length} sala(s) aberta(s) agora</p>
                </div>
                <div className={styles.heroBadge}>
                  <FaBaby />
                </div>
              </div>

              <div className={styles.statsGrid}>
                <article>
                  <strong>{guardians.length}</strong>
                  <span>responsaveis</span>
                </article>
                <article>
                  <strong>{people.length}</strong>
                  <span>criancas</span>
                </article>
                <article>
                  <strong>{guardians.filter((item) => item.status === "visitante").length}</strong>
                  <span>visitantes</span>
                </article>
              </div>

              <section className={styles.panel}>
                <div className={styles.sectionTitle}>
                  <h2>Salas agora</h2>
                  <button onClick={() => setActiveTab("salas")}>Gerenciar</button>
                </div>
                <div className={styles.roomList}>
                  {roomTotals.map((room) => (
                    <article key={room.id} className={styles.roomCard}>
                      <div>
                        <h3>{room.name}</h3>
                        <p>{room.age_range}</p>
                      </div>
                      <div className={styles.roomCount}>
                        <strong>{room.total}</strong>
                        <span>{Boolean(room.is_open) ? "aberta" : "fechada"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          )}

          {activeTab === "salas" && (
            <section className={styles.content}>
              <div className={styles.sectionTitle}>
                <h2>Salas</h2>
                <button className={styles.iconAction} onClick={() => setShowNewRoomForm((current) => !current)}>
                  <FaPlus />
                </button>
              </div>

              <div className={styles.roomList}>
                {rooms.map((room) => (
                  <article key={room.id} className={styles.roomCardExpanded}>
                    <button
                      type="button"
                      className={styles.roomSummary}
                      onClick={() => setExpandedRoom((current) => (current === room.id ? null : room.id))}
                    >
                      <div>
                        <h3>{room.name}</h3>
                        <p>{room.age_range}</p>
                      </div>
                      <div className={styles.roomSummaryMeta}>
                        <strong>{roomTotals.find((item) => item.id === room.id)?.total || 0}</strong>
                        <span>crianca(s)</span>
                        <FaChevronDown className={expandedRoom === room.id ? styles.chevronOpen : ""} />
                      </div>
                    </button>

                    {expandedRoom === room.id && (
                      <div className={styles.roomChildren}>
                        {(roomTotals.find((item) => item.id === room.id)?.checkins || []).length ? (
                          roomTotals
                            .find((item) => item.id === room.id)
                            ?.checkins.map((checkin) => (
                              <div key={checkin.public_code}>
                                <strong>{checkin.child_name_snapshot}</strong>
                                <span>{checkin.guardian_name_snapshot}</span>
                              </div>
                            ))
                        ) : (
                          <p>Nenhuma crianca dentro agora.</p>
                        )}
                      </div>
                    )}

                    <button
                      className={Boolean(room.is_open) ? styles.openToggle : styles.closedToggle}
                      onClick={() => toggleRoom(room)}
                    >
                      {Boolean(room.is_open) ? "Aberta" : "Fechada"}
                    </button>
                  </article>
                ))}
              </div>

              {showNewRoomForm && (
                <form className={styles.formPanel} onSubmit={submitRoom}>
                  <h2>Nova sala</h2>
                  <label>
                    Nome da sala
                    <input
                      required
                      value={roomForm.name}
                      onChange={(event) => setRoomForm({ ...roomForm, name: event.target.value })}
                      placeholder="Sala 09 a 11 anos"
                    />
                  </label>
                  <label>
                    Faixa etaria
                    <input
                      required
                      value={roomForm.age_range}
                      onChange={(event) => setRoomForm({ ...roomForm, age_range: event.target.value })}
                      placeholder="9 a 11 anos"
                    />
                  </label>
                  <button className={styles.primaryButton} type="submit">
                    <FaPlus />
                    Criar sala
                  </button>
                </form>
              )}
            </section>
          )}

          {activeTab === "checkin" && (
            <section className={styles.content}>
              {!openRooms.length && <div className={styles.warning}>Abra uma sala antes de fazer check-in.</div>}

              <section className={styles.panel}>
                <div className={styles.sectionTitle}>
                  <h2>Check-in rapido</h2>
                  <span>{printerStatus}</span>
                </div>
                <label className={styles.searchBox}>
                  <FaSearch />
                  <input
                    value={checkinSearch}
                    onChange={(event) => setCheckinSearch(event.target.value)}
                    placeholder="Pesquisar responsavel ou crianca"
                  />
                </label>
                <div className={styles.peopleList}>
                  {filteredPeople.map(({ guardian, child }) => (
                    <article key={child.id} className={styles.personRow}>
                      <div>
                        <strong>{child.name}</strong>
                        <span>
                          {guardian.name} - {guardian.status} - {child.checkins_count} check-ins
                        </span>
                      </div>
                      <button
                        className={styles.primaryButton}
                        disabled={!openRooms.length}
                        onClick={() => makeCheckin(guardian.id, child.id, child.room_id)}
                      >
                        <FaPrint />
                        Check-in
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          )}

          {activeTab === "pessoas" && (
            <section className={styles.content}>
              <section className={styles.panel}>
                <div className={styles.sectionTitle}>
                  <h2>Pessoas</h2>
                  <button className={styles.iconAction} onClick={() => setShowPersonForm((current) => !current)}>
                    <FaPlus />
                  </button>
                </div>
                <label className={styles.searchBox}>
                  <FaSearch />
                  <input
                    value={peopleSearch}
                    onChange={(event) => setPeopleSearch(event.target.value)}
                    placeholder="Pesquisar responsavel ou crianca"
                  />
                </label>

                {showPersonForm && (
                  <form className={styles.formPanel} onSubmit={submitGuardian}>
                    <div className={styles.formSection}>
                      <h3>Responsavel</h3>
                      <div className={styles.formGrid}>
                        <label>
                          Nome do responsavel *
                          <input
                            required
                            value={guardianForm.name}
                            onChange={(event) => setGuardianForm({ ...guardianForm, name: event.target.value })}
                            placeholder="Nome completo"
                          />
                        </label>
                        <label>
                          Status
                          <select
                            value={guardianForm.status}
                            onChange={(event) =>
                              setGuardianForm({ ...guardianForm, status: event.target.value as Guardian["status"] })
                            }
                          >
                            <option value="visitante">Visitante</option>
                            <option value="familia">Familia</option>
                          </select>
                        </label>
                        <label>
                          E-mail
                          <input
                            type="email"
                            value={guardianForm.email}
                            onChange={(event) => setGuardianForm({ ...guardianForm, email: event.target.value })}
                          />
                        </label>
                        <label>
                          Telefone
                          <input
                            value={guardianForm.phone}
                            onChange={(event) => setGuardianForm({ ...guardianForm, phone: event.target.value })}
                          />
                        </label>
                      </div>
                    </div>

                    <div className={styles.formSection}>
                      <div className={styles.sectionTitle}>
                        <h3>Criancas</h3>
                        <button
                          type="button"
                          onClick={() =>
                            setGuardianForm({
                              ...guardianForm,
                              children: [...guardianForm.children, emptyChild(rooms[0]?.id ? String(rooms[0].id) : "")],
                            })
                          }
                        >
                          <FaPlus />
                          Mais crianca
                        </button>
                      </div>

                      <div className={styles.childrenDraftList}>
                        {guardianForm.children.map((child, index) => (
                          <article key={index} className={styles.childDraftCard}>
                            <div className={styles.childDraftHeader}>
                              <strong>Crianca {index + 1}</strong>
                              {guardianForm.children.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setGuardianForm({
                                      ...guardianForm,
                                      children: guardianForm.children.filter((_, childIndex) => childIndex !== index),
                                    })
                                  }
                                >
                                  Remover
                                </button>
                              )}
                            </div>
                            <div className={styles.formGrid}>
                              <label>
                                Nome da crianca *
                                <input
                                  required
                                  value={child.name}
                                  onChange={(event) => updateChildDraft(index, { name: event.target.value })}
                                />
                              </label>
                              <label>
                                Nascimento
                                <input
                                  type="date"
                                  value={child.birth_date}
                                  onChange={(event) => updateChildDraft(index, { birth_date: event.target.value })}
                                />
                              </label>
                              <label>
                                Sexo
                                <input
                                  value={child.gender}
                                  onChange={(event) => updateChildDraft(index, { gender: event.target.value })}
                                />
                              </label>
                              <label>
                                Sala
                                <select
                                  value={child.room_id}
                                  onChange={(event) => updateChildDraft(index, { room_id: event.target.value })}
                                >
                                  <option value="">Sem sala</option>
                                  {rooms.map((room) => (
                                    <option key={room.id} value={room.id}>
                                      {room.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <label>
                              Observacoes
                              <textarea
                                value={child.notes}
                                onChange={(event) => updateChildDraft(index, { notes: event.target.value })}
                              />
                            </label>
                          </article>
                        ))}
                      </div>
                    </div>

                    <button className={styles.primaryButton} type="submit">
                      Salvar responsavel e criancas
                    </button>
                  </form>
                )}

                <div className={styles.peopleList}>
                  {filteredGuardians.map((guardian) => (
                    <article key={guardian.id} className={styles.guardianCard}>
                      <button
                        className={styles.guardianHeader}
                        onClick={() =>
                          setExpandedGuardian((current) => (current === guardian.id ? null : guardian.id))
                        }
                      >
                        <div>
                          <strong>{guardian.name}</strong>
                          <span>{guardian.status} - {guardian.children.length} crianca(s)</span>
                        </div>
                        <FaChevronDown className={expandedGuardian === guardian.id ? styles.chevronOpen : ""} />
                      </button>
                      {expandedGuardian === guardian.id && (
                        <div className={styles.childList}>
                          {guardian.children.map((child) => (
                            <div key={child.id}>
                              <strong>{child.name}</strong>
                              <span>
                                {child.checkins_count} check-ins - {child.room_name || "Sem sala"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            </section>
          )}
        </>
      )}

      <nav className={styles.bottomNav} aria-label="Navegacao MyKids">
        <button className={activeTab === "inicio" ? styles.activeNav : ""} onClick={() => setActiveTab("inicio")}>
          <FaHome />
          Inicio
        </button>
        <button className={activeTab === "salas" ? styles.activeNav : ""} onClick={() => setActiveTab("salas")}>
          <FaDoorOpen />
          Salas
        </button>
        <button className={activeTab === "checkin" ? styles.activeNav : ""} onClick={() => setActiveTab("checkin")}>
          <FaPeopleArrows />
          Check-in
        </button>
        <button className={activeTab === "pessoas" ? styles.activeNav : ""} onClick={() => setActiveTab("pessoas")}>
          <FaUserFriends />
          Pessoas
        </button>
      </nav>
    </main>
  );
}
