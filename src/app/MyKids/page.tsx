"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBaby,
  FaChild,
  FaChevronDown,
  FaDoorOpen,
  FaEdit,
  FaHome,
  FaMars,
  FaPeopleArrows,
  FaPlus,
  FaPrint,
  FaSearch,
  FaUser,
  FaUserFriends,
  FaVenus,
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
  gender: "M",
  notes: "",
  room_id: roomId,
});

function PersonIcon({ gender, child = false }: { gender: "M" | "F" | null; child?: boolean }) {
  return (
    <span className={`${styles.personIcon} ${gender === "F" ? styles.femaleIcon : gender === "M" ? styles.maleIcon : styles.neutralIcon}`}>
      {child ? <FaChild /> : <FaUser />}
      {gender === "F" ? <FaVenus className={styles.genderMark} /> : gender === "M" ? <FaMars className={styles.genderMark} /> : null}
    </span>
  );
}

const fallbackPrinter: PrinterSettings = {
  id: 0,
  printer_name: "ZD220-203dpi ZPL",
  bridge_url: "http://127.0.0.1:9123/print",
  label_width: 30,
  label_height: 60,
  is_active: true,
};

function cleanZplText(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\^|~/g, "")
    .trim();
}

function zplLine(value: string | null | undefined, max = 34) {
  return cleanZplText(value).slice(0, max);
}

function formatLabelDate(value: string) {
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function arrivalCode(checkin: Checkin) {
  return String(checkin.arrival_number || 0).padStart(3, "0");
}

function publicLabelUrl(checkin: Checkin) {
  if (typeof window === "undefined") return `/mykids-etiqueta/${checkin.public_code}`;
  return `${window.location.origin}/mykids-etiqueta/${checkin.public_code}`;
}

function localBridgeUrl(configuredUrl: string | null | undefined, endpoint: "print" | "health") {
  const fallback = `http://127.0.0.1:9123/${endpoint}`;
  if (!configuredUrl) return fallback;
  try {
    const url = new URL(configuredUrl);
    // A pagina de producao usa HTTPS. Navegadores bloqueiam HTTP para um IP da
    // rede local, mas permitem loopback para um servico instalado nesta maquina.
    if (typeof window !== "undefined" && window.location.protocol === "https:" && url.protocol === "http:") {
      url.hostname = "127.0.0.1";
    }
    url.pathname = `/${endpoint}`;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return fallback;
  }
}

function childZpl(checkin: Checkin, qrContent: string) {
  const code = checkin.public_code.slice(-6).toUpperCase();
  const date = formatLabelDate(checkin.created_at);
  const number = arrivalCode(checkin);
  return `^XA
^CI28
^PW480
^LL320
^FO16,30^BQN,2,5^FDLA,${qrContent}^FS
^FO215,24^A0N,36,36^FD${zplLine(checkin.child_name_snapshot, 13).toUpperCase()}^FS
^FO215,70^A0N,21,21^FDResp: ${zplLine(checkin.guardian_name_snapshot, 16)}^FS
^FO215,98^A0N,21,21^FDSala: ${zplLine(checkin.room_name_snapshot, 17)}^FS
^FO215,132^A0N,22,22^FDNumero^FS
^FO215,154^A0N,58,58^FD${number}^FS
^FO360,190^A0N,22,22^FD${date}^FS
^FO20,244^A0N,22,22^FD${code}^FS
^XZ`;
}

function guardianZpl(checkin: Checkin, qrContent: string) {
  const code = checkin.public_code.slice(-6).toUpperCase();
  const date = formatLabelDate(checkin.created_at);
  const number = arrivalCode(checkin);
  return `^XA
^CI28
^PW480
^LL320
^FO16,30^BQN,2,5^FDLA,${qrContent}^FS
^FO215,20^A0N,24,24^FDResponsavel^FS
^FO215,50^A0N,34,34^FD${zplLine(checkin.guardian_name_snapshot, 13).toUpperCase()}^FS
^FO215,94^A0N,21,21^FDCrianca: ${zplLine(checkin.child_name_snapshot, 14)}^FS
^FO215,122^A0N,21,21^FDSala: ${zplLine(checkin.room_name_snapshot, 17)}^FS
^FO215,156^A0N,20,20^FDNumero da crianca^FS
^FO215,178^A0N,46,46^FD${number}^FS
^FO360,190^A0N,22,22^FD${date}^FS
^FO20,244^A0N,22,22^FD${code}^FS
^XZ`;
}

function buildPrintJob(checkin: Checkin, mode: PrintMode) {
  const url = publicLabelUrl(checkin);
  const child = childZpl(checkin, url);
  if (mode === "crianca") return child;
  return `${guardianZpl(checkin, url)}\n${child}`;
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
  const [pendingPrint, setPendingPrint] = useState<Checkin | null>(null);
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);
  const [expandedGuardian, setExpandedGuardian] = useState<number | null>(null);
  const [checkinSearch, setCheckinSearch] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [roomForm, setRoomForm] = useState({ name: "", age_range: "" });
  const [guardianForm, setGuardianForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "M" as "M" | "F",
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

  useEffect(() => {
    const refreshPrinterStatus = async () => {
      try {
        const current = await myKidsApi.printer();
        if (!current) return;
        setPrinter(current);
        setPrinterStatus(current.bridge_online
          ? "Notebook conectado a impressora"
          : "Nenhum notebook conectado a impressora");
      } catch {
        setPrinterStatus("Nao foi possivel consultar a impressora");
      }
    };
    void refreshPrinterStatus();
    const interval = window.setInterval(refreshPrinterStatus, 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(max-width: 720px)").matches) return;
    let busy = false;
    let stopped = false;
    const relayPrintJobs = async () => {
      if (busy || stopped) return;
      busy = true;
      try {
        const healthResponse = await fetch("http://127.0.0.1:9123/health", { cache: "no-store" });
        const health = await healthResponse.json().catch(() => ({}));
        if (!healthResponse.ok || health.ok === false) return;
        const job = await myKidsApi.claimPrint();
        if (!job) return;
        try {
          const printResponse = await fetch("http://127.0.0.1:9123/print", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ zpl: job.zpl, printerName: job.printer_name || undefined }),
          });
          const result = await printResponse.json().catch(() => ({}));
          if (!printResponse.ok || result.ok === false) throw new Error(result.error || "Falha na ponte Zebra");
          await myKidsApi.completePrint(job.id, { ok: true });
          setPrinterStatus("Impressao recebida do celular e enviada para a Zebra");
        } catch (e) {
          const detail = e instanceof Error ? e.message : "Falha ao imprimir";
          await myKidsApi.completePrint(job.id, { ok: false, error: detail });
          setPrinterStatus(`Falha ao imprimir chamada recebida: ${detail}`);
        }
      } catch {
        // Notebook sem ponte local: nao reivindica trabalhos da fila.
      } finally {
        busy = false;
      }
    };
    void relayPrintJobs();
    const interval = window.setInterval(relayPrintJobs, 1000);
    return () => { stopped = true; window.clearInterval(interval); };
  }, []);

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
    if (Boolean(room.is_open)) {
      const confirmed = window.confirm("Tem certeza que deseja fechar esta sala? Todas as criancas sairão da sala.");
      if (!confirmed) return;
    }
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
        gender: "M",
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
      setPendingPrint(checkin);
      setMessage("Check-in realizado.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no check-in");
    }
  }

  async function makeFamilyCheckin(guardian: Guardian) {
    const available = guardian.children.filter((child) => !today.some((item) => item.child_id === child.id));
    if (!openRooms.length || !available.length) return;
    setError("");
    try {
      const created: Checkin[] = [];
      for (const child of available) {
        const room = openRooms.find((item) => item.id === child.room_id) || openRooms[0];
        created.push(await myKidsApi.createCheckin({ guardian_id: guardian.id, child_id: child.id, room_id: room.id }));
      }
      for (let index = 0; index < created.length; index += 1) {
        const checkin = created[index];
        await myKidsApi.print({
          zpl: buildPrintJob(checkin, index === 0 ? "completo" : "crianca"),
          printer_name: printer?.printer_name || undefined,
        });
      }
      setMessage(`${created.length} crianca(s) em check-in.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no check-in da familia");
      await load();
    }
  }

  async function savePersonEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingGuardian) return;
    setError("");
    try {
      await myKidsApi.updateGuardian(editingGuardian.id, editingGuardian);
      await Promise.all(editingGuardian.children.map((child) => myKidsApi.updateChild(child.id, child)));
      setEditingGuardian(null);
      setMessage("Dados atualizados.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar dados");
    }
  }

  async function checkout(checkin: Checkin) {
    if (!checkin.id) return;
    setError("");
    setMessage("");
    try {
      await myKidsApi.checkout(checkin.id);
      setMessage(`${checkin.child_name_snapshot} saiu da sala.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no check-out");
    }
  }

  async function printLabel(checkin: Checkin, mode: PrintMode) {
    const settings = printer || fallbackPrinter;
    const zpl = buildPrintJob(checkin, mode);
    try {
      await myKidsApi.print({ zpl, printer_name: settings.printer_name || undefined });
      setPrinterStatus(mode === "completo" ? "Etiquetas do responsavel e da crianca enviadas" : "Etiqueta da crianca enviada");
    } catch (e) {
      const detail = e instanceof Error && e.message ? ` (${e.message})` : "";
      setPrinterStatus(`Nao foi possivel enviar a impressao${detail}`);
    }
    setPendingPrint(null);
  }

  async function detectPrinterBridge() {
    let latestPrinter = printer;
    try {
      latestPrinter = await myKidsApi.printer();
      if (latestPrinter) setPrinter(latestPrinter);
    } catch {
      // A deteccao local ainda pode funcionar mesmo se a consulta de status falhar.
    }
    const healthUrl = localBridgeUrl(latestPrinter?.bridge_url || fallbackPrinter.bridge_url, "health");
    setError("");
    try {
      const response = await fetch(healthUrl, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw new Error(data.error || "Ponte respondeu com erro");
      const detectedPrinter = typeof data.printerName === "string" && data.printerName ? data.printerName : null;
      const detectedBridgeUrl = localBridgeUrl(healthUrl, "print");
      const detectedSettings = {
        ...(latestPrinter || fallbackPrinter),
        bridge_url: detectedBridgeUrl,
        printer_name: detectedPrinter,
        is_active: true,
      };
      const savedSettings = await myKidsApi.updatePrinter(detectedSettings);
      setPrinter(savedSettings);
      setShowPrinterSetup(false);
      setPrinterStatus(detectedPrinter ? `Zebra conectada: ${detectedPrinter}` : "Ponte Zebra conectada");
    } catch (e) {
      if (latestPrinter?.bridge_online) {
        setPrinterStatus("Notebook da Zebra conectado e aguardando impressoes");
        setShowPrinterSetup(false);
        return;
      }
      const detail = e instanceof Error && e.message ? `: ${e.message}` : "";
      setPrinterStatus(`Nao consegui conectar em ${healthUrl}${detail}`);
      setShowPrinterSetup(true);
    }
  }

  async function checkRemotePrinter() {
    try {
      const current = await myKidsApi.printer();
      if (current) setPrinter(current);
      setPrinterStatus(current?.bridge_online
        ? "Notebook conectado a impressora - impressoes liberadas"
        : "Nenhum notebook conectado - ligue a ponte antes do check-in");
    } catch {
      setPrinterStatus("Nao foi possivel consultar o notebook da impressora");
    }
  }

  return (
    <main className={styles.page}>
      {showPrinterSetup && (
        <div className={styles.modalBackdrop}>
          <section className={styles.modal}>
            <h2>Configurar impressora Zebra</h2>
            <p>A ponte ainda não está instalada neste computador. Faça a configuração uma única vez:</p>
            <ol className={styles.setupSteps}>
              <li>Baixe e extraia o instalador.</li>
              <li>Execute <strong>instalar_zebra.bat</strong> e confirme a janela do Windows.</li>
              <li>Volte aqui e clique em “Testar novamente”.</li>
            </ol>
            {printer?.bridge_token && (
              <p>Codigo de pareamento: <strong className={styles.pairingCode}>{printer.bridge_token}</strong></p>
            )}
            <div className={styles.printOptions}>
              <a className={styles.primaryButton} href="/downloads/MyKids-Zebra.zip" download>
                Baixar instalador Zebra
              </a>
              <button className={styles.secondaryButton} onClick={detectPrinterBridge}>Testar novamente</button>
              <button className={styles.linkButton} onClick={() => setShowPrinterSetup(false)}>Fechar</button>
            </div>
          </section>
        </div>
      )}
      {editingGuardian && (
        <div className={styles.modalBackdrop}>
          <form className={`${styles.modal} ${styles.editModal}`} onSubmit={savePersonEdits}>
            <h2>Editar familia</h2>
            <div className={styles.formGrid}>
              <label>Responsavel<input required value={editingGuardian.name} onChange={(e) => setEditingGuardian({ ...editingGuardian, name: e.target.value })} /></label>
              <label>Sexo<select required value={editingGuardian.gender || ""} onChange={(e) => setEditingGuardian({ ...editingGuardian, gender: e.target.value as "M" | "F" })}><option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option></select></label>
              <label>E-mail<input type="email" value={editingGuardian.email || ""} onChange={(e) => setEditingGuardian({ ...editingGuardian, email: e.target.value })} /></label>
              <label>Telefone<input value={editingGuardian.phone || ""} onChange={(e) => setEditingGuardian({ ...editingGuardian, phone: e.target.value })} /></label>
              <label>Status<select value={editingGuardian.status} onChange={(e) => setEditingGuardian({ ...editingGuardian, status: e.target.value as Guardian["status"] })}><option value="visitante">Visitante</option><option value="familia">Familia</option></select></label>
            </div>
            {editingGuardian.children.map((child, index) => (
              <div className={styles.childDraftCard} key={child.id}>
                <strong>Crianca {index + 1}</strong>
                <div className={styles.formGrid}>
                  <label>Nome<input required value={child.name} onChange={(e) => setEditingGuardian({ ...editingGuardian, children: editingGuardian.children.map((item) => item.id === child.id ? { ...item, name: e.target.value } : item) })} /></label>
                  <label>Sexo<select required value={child.gender || ""} onChange={(e) => setEditingGuardian({ ...editingGuardian, children: editingGuardian.children.map((item) => item.id === child.id ? { ...item, gender: e.target.value as "M" | "F" } : item) })}><option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option></select></label>
                  <label>Nascimento<input type="date" value={child.birth_date ? String(child.birth_date).slice(0, 10) : ""} onChange={(e) => setEditingGuardian({ ...editingGuardian, children: editingGuardian.children.map((item) => item.id === child.id ? { ...item, birth_date: e.target.value || null } : item) })} /></label>
                  <label>Sala<select value={child.room_id || ""} onChange={(e) => setEditingGuardian({ ...editingGuardian, children: editingGuardian.children.map((item) => item.id === child.id ? { ...item, room_id: e.target.value ? Number(e.target.value) : null } : item) })}><option value="">Sem sala</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label>
                </div>
                <label>Observacoes<textarea value={child.notes || ""} onChange={(e) => setEditingGuardian({ ...editingGuardian, children: editingGuardian.children.map((item) => item.id === child.id ? { ...item, notes: e.target.value } : item) })} /></label>
              </div>
            ))}
            <div className={styles.modalActions}><button type="button" className={styles.secondaryButton} onClick={() => setEditingGuardian(null)}>Cancelar</button><button className={styles.primaryButton}>Salvar alteracoes</button></div>
          </form>
        </div>
      )}
      {pendingPrint && (
        <div className={styles.modalBackdrop}>
          <section className={styles.modal}>
            <h2>Imprimir adesivo?</h2>
            <p>
              Escolha o kit completo para imprimir uma etiqueta do responsavel e outra da crianca,
              ou imprima somente a etiqueta da crianca.
            </p>
            <div className={styles.printOptions}>
              <button className={styles.primaryButton} onClick={() => printLabel(pendingPrint, "completo")}>
                <FaPrint />
                Completo
              </button>
              <button className={styles.secondaryButton} onClick={() => printLabel(pendingPrint, "crianca")}>
                Apenas crianca
              </button>
              <button className={styles.linkButton} onClick={() => setPendingPrint(null)}>
                Nao imprimir agora
              </button>
            </div>
          </section>
        </div>
      )}

      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>Ministerio infantil</span>
          <h1>MyKids</h1>
        </div>
        <button className={`${styles.printButton} ${styles.desktopPrinterButton} ${printer?.bridge_online ? styles.printerOnline : ""}`} onClick={detectPrinterBridge}>
          <span className={styles.statusDot} />
          <FaPrint />
          Zebra
        </button>
        <button className={`${styles.printButton} ${styles.mobilePrinterButton} ${printer?.bridge_online ? styles.printerOnline : ""}`} onClick={checkRemotePrinter}>
          <span className={styles.statusDot} />
          <FaPrint />
          {printer?.bridge_online ? "Impressora online" : "Ver impressora"}
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
                                <span>
                                  <strong>#{String(checkin.arrival_number || 0).padStart(3, "0")} {checkin.child_name_snapshot}</strong>
                                  <small>{checkin.guardian_name_snapshot}</small>
                                </span>
                                <button className={styles.secondaryButton} onClick={() => checkout(checkin)}>
                                  Check-out
                                </button>
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
                      <div className={styles.personIdentity}>
                        <PersonIcon gender={child.gender} child />
                        <span><strong>{child.name}</strong><small>
                          {guardian.name} - {guardian.status} - {child.checkins_count} check-ins
                        </small></span>
                      </div>
                      <button
                        className={styles.primaryButton}
                        disabled={!openRooms.length || today.some((item) => item.child_id === child.id)}
                        onClick={() => makeCheckin(guardian.id, child.id, child.room_id)}
                      >
                        <FaPrint />
                        {today.some((item) => item.child_id === child.id) ? "Na sala" : "Check-in"}
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
                          Sexo do responsavel *
                          <select required value={guardianForm.gender} onChange={(event) => setGuardianForm({ ...guardianForm, gender: event.target.value as "M" | "F" })}>
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
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
                                Sexo *
                                <select required
                                  value={child.gender}
                                  onChange={(event) => updateChildDraft(index, { gender: event.target.value })}
                                >
                                  <option value="M">Masculino</option>
                                  <option value="F">Feminino</option>
                                </select>
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
                      <div className={styles.guardianHeader}>
                        <button className={styles.guardianExpand} onClick={() => setExpandedGuardian((current) => (current === guardian.id ? null : guardian.id))}>
                          <PersonIcon gender={guardian.gender} />
                          <span><strong>{guardian.name}</strong><small>{guardian.status} - {guardian.children.length} crianca(s)</small></span>
                          <FaChevronDown className={expandedGuardian === guardian.id ? styles.chevronOpen : ""} />
                        </button>
                        <button className={styles.iconAction} title="Editar familia" onClick={() => setEditingGuardian(structuredClone(guardian))}><FaEdit /></button>
                      </div>
                      {expandedGuardian === guardian.id && (
                        <div className={styles.childList}>
                          <button className={styles.primaryButton} disabled={!openRooms.length || guardian.children.every((child) => today.some((item) => item.child_id === child.id))} onClick={() => makeFamilyCheckin(guardian)}>Check-in de todos</button>
                          {guardian.children.map((child) => (
                            <div key={child.id} className={styles.childPersonRow}>
                              <PersonIcon gender={child.gender} child />
                              <span><strong>{child.name}</strong><small>{child.checkins_count} check-ins - {child.room_name || "Sem sala"}</small></span>
                              <button className={styles.secondaryButton} disabled={!openRooms.length || today.some((item) => item.child_id === child.id)} onClick={() => makeCheckin(guardian.id, child.id, child.room_id)}>{today.some((item) => item.child_id === child.id) ? "Na sala" : "Check-in"}</button>
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
