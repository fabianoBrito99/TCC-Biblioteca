"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBaby,
  FaArrowLeft,
  FaChild,
  FaChevronDown,
  FaDoorOpen,
  FaEdit,
  FaHome,
  FaHistory,
  FaMars,
  FaPeopleArrows,
  FaPlus,
  FaPrint,
  FaSearch,
  FaUser,
  FaUserFriends,
  FaVenus,
} from "react-icons/fa";
import { Checkin, Guardian, myKidsApi, PrinterSettings, Room, RoomCloseAlert, RoomHistory } from "@/lib/mykids-api";
import styles from "./page.module.css";

type Tab = "inicio" | "salas" | "checkin" | "pessoas" | "historico";
type PrintMode = "completo" | "crianca";
type ChildDraft = {
  name: string;
  birth_date: string;
  gender: string;
  notes: string;
  has_autism: boolean;
  autism_type: string;
  has_food_restriction: boolean;
  food_restriction_notes: string;
};
type LocalBridgeHealth = {
  ok?: boolean;
  paired?: boolean;
  cloudOnline?: boolean;
  cloudError?: string | null;
  printerOnline?: boolean;
  printerName?: string | null;
  connection?: string | null;
  error?: string | null;
};

const emptyChild = (): ChildDraft => ({
  name: "",
  birth_date: "",
  gender: "M",
  notes: "",
  has_autism: false,
  autism_type: "",
  has_food_restriction: false,
  food_restriction_notes: "",
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

function arrivalCode(checkin: Checkin) {
  return String(checkin.arrival_number || 0).padStart(3, "0");
}

function attentionIcons(hasAutism: boolean, hasFoodRestriction: boolean) {
  // Infinito desenhado com duas alcas e cruzamento central bem definido.
  const autism = hasAutism
    ? "^FO347,186^GE29,17,2,B^FS^FO371,186^GE29,17,2,B^FS^FO367,187^GD11,15,2,B,R^FS^FO367,187^GD11,15,2,B,L^FS"
    : "";
  const foodX = hasAutism ? 410 : 355;
  const food = hasFoodRestriction
    ? `^FO${foodX + 3},178^GB2,10,2^FS^FO${foodX + 7},178^GB2,10,2^FS^FO${foodX + 11},178^GB2,10,2^FS^FO${foodX + 15},178^GB2,10,2^FS^FO${foodX + 3},187^GB14,3,3^FS^FO${foodX + 9},189^GB3,18,3^FS^FO${foodX + 25},178^GB7,18,7^FS^FO${foodX + 27},194^GB3,13,3^FS^FO${foodX},177^GD38,32,2,B,R^FS`
    : "";
  return `${autism}${food}`;
}

function publicLabelUrl(checkin: Checkin) {
  if (typeof window === "undefined") return `/mykids-etiqueta/${checkin.public_code}`;
  return `${window.location.origin}/mykids-etiqueta/${checkin.public_code}`;
}

function localBridgeUrl(configuredUrl: string | null | undefined, endpoint: "print" | "health" | "reconnect") {
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

function printerStatusText(settings: PrinterSettings | null) {
  if (!settings?.bridge_online) return "Ponte Zebra offline - clique em Zebra para reconectar";
  if (!settings.printer_online) {
    return settings.printer_last_error
      ? `Ponte ativa, mas a Zebra esta desconectada: ${settings.printer_last_error}`
      : "Ponte ativa, mas a Zebra USB ainda nao foi reconhecida";
  }
  const name = settings.detected_printer_name || settings.printer_name;
  return name ? `Zebra conectada: ${name}` : "Zebra conectada e pronta para imprimir";
}

async function requestLocalBridge(url: string, method: "GET" | "POST" = "GET", timeout = 4000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { method, cache: "no-store", signal: controller.signal });
    const data = await response.json().catch(() => ({})) as LocalBridgeHealth;
    if (!response.ok || data.ok === false) throw new Error(data.error || "Ponte respondeu com erro");
    return data;
  } finally {
    window.clearTimeout(timer);
  }
}

function launchInstalledBridge() {
  const frame = document.createElement("iframe");
  frame.style.display = "none";
  frame.src = `mykids-zebra://connect?time=${Date.now()}`;
  document.body.appendChild(frame);
  window.setTimeout(() => frame.remove(), 3000);
}

function childZpl(checkin: Checkin, qrContent: string) {
  const number = arrivalCode(checkin);
  const nameParts = cleanZplText(checkin.child_name_snapshot).split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const icons = attentionIcons(Boolean(checkin.child_has_autism_snapshot), Boolean(checkin.child_has_food_restriction_snapshot));
  return `^XA
^CI28
^PW480
^LL320
^FO16,30^BQN,2,5^FDLA,${qrContent}^FS
^FO215,16^A0N,34,34^FD${zplLine(firstName, 12).toUpperCase()}^FS
^FO215,50^A0N,30,30^FD${zplLine(lastName, 14).toUpperCase()}^FS
${icons}
^FO215,86^A0N,20,20^FDResp: ${zplLine(checkin.guardian_name_snapshot, 16)}^FS
^FO215,112^A0N,20,20^FDSala: ${zplLine(checkin.room_name_snapshot, 17)}^FS
^FO215,140^A0N,22,22^FDNumero^FS
^FO215,162^A0N,54,54^FD${number}^FS
^XZ`;
}

function guardianZpl(checkin: Checkin, qrContent: string, family: Checkin[] = [checkin]) {
  const numbers = family.map((item) => String(Number(item.arrival_number || 0))).join(", ");
  const nameParts = cleanZplText(checkin.guardian_name_snapshot).split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const multipleChildren = family.length > 1;
  const childDescription = multipleChildren ? `${family.length} CRIANCAS` : checkin.child_name_snapshot;
  const familyRooms = [...new Set(family.map((item) => cleanZplText(item.room_name_snapshot)))];
  const roomDescription = familyRooms.length > 1 ? `${familyRooms.length} SALAS` : familyRooms[0];
  return `^XA
^CI28
^PW480
^LL320
^FO16,30^BQN,2,5^FDLA,${qrContent}^FS
^FO215,20^A0N,24,24^FDResponsavel^FS
^FO215,48^A0N,32,32^FD${zplLine(firstName, 12).toUpperCase()}^FS
^FO215,80^A0N,28,28^FD${zplLine(lastName, 14).toUpperCase()}^FS
^FO215,116^A0N,20,20^FDCriancas: ${zplLine(childDescription, 14)}^FS
^FO215,142^A0N,18,18^FDSalas: ${zplLine(roomDescription, 22)}^FS
^FO215,170^A0N,19,19^FDNumero da crianca^FS
^FO215,190^A0N,38,38^FD${zplLine(numbers, 12)}^FS
^XZ`;
}

function buildPrintJob(checkin: Checkin, mode: PrintMode) {
  const url = publicLabelUrl(checkin);
  const child = childZpl(checkin, url);
  if (mode === "crianca") return child;
  return `${guardianZpl(checkin, url)}\n${child}`;
}

function buildFamilyPrintJob(checkins: Checkin[]) {
  const first = checkins[0];
  const url = publicLabelUrl(first);
  return `${guardianZpl(first, url, checkins)}\n${checkins.map((item) => childZpl(item, publicLabelUrl(item))).join("\n")}`;
}

export default function MyKidsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("inicio");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomHistory, setRoomHistory] = useState<RoomHistory[]>([]);
  const [closeAlerts, setCloseAlerts] = useState<RoomCloseAlert[]>([]);
  const [roomConfirmation, setRoomConfirmation] = useState<{ room: Room; opening: boolean } | null>(null);
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
      const [roomData, guardianData, todayData, printerData, historyData] = await Promise.all([
        myKidsApi.rooms(),
        myKidsApi.guardians(),
        myKidsApi.today(),
        myKidsApi.printer(),
        myKidsApi.roomHistory(),
      ]);
      setRooms(roomData);
      setGuardians(guardianData);
      setToday(todayData);
      setPrinter(printerData || fallbackPrinter);
      setRoomHistory(historyData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar MyKids");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkRoomAlerts = async () => {
      try { setCloseAlerts(await myKidsApi.roomCloseAlerts()); } catch { /* Mantem a tela funcional offline. */ }
    };
    void checkRoomAlerts();
    const interval = window.setInterval(checkRoomAlerts, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let stopped = false;
    const refreshSharedState = async () => {
      try {
        const [roomData, todayData, historyData] = await Promise.all([myKidsApi.rooms(), myKidsApi.today(), myKidsApi.roomHistory()]);
        if (!stopped) { setRooms(roomData); setToday(todayData); setRoomHistory(historyData); }
      } catch { /* A proxima sincronizacao tenta novamente. */ }
    };
    const onVisible = () => { if (document.visibilityState === "visible") void refreshSharedState(); };
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(refreshSharedState, 5000);
    return () => { stopped = true; document.removeEventListener("visibilitychange", onVisible); window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    const refreshPrinterStatus = async () => {
      try {
        const current = await myKidsApi.printer();
        if (!current) return;
        setPrinter(current);
        setPrinterStatus(printerStatusText(current));
      } catch {
        setPrinterStatus("Nao foi possivel consultar a impressora");
      }
    };
    void refreshPrinterStatus();
    const interval = window.setInterval(refreshPrinterStatus, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const openRooms = rooms.filter((room) => Boolean(room.is_open));
  const printerReady = Boolean(printer?.bridge_online && printer?.printer_online);
  const printerButtonState = printerReady ? styles.printerOnline : printer?.bridge_online ? styles.printerBridgeOnline : "";
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
    setRoomConfirmation({ room, opening: !Boolean(room.is_open) });
  }

  async function confirmToggleRoom() {
    if (!roomConfirmation) return;
    const { room, opening } = roomConfirmation;
    setRoomConfirmation(null);
    try {
      await myKidsApi.updateRoom(room.id, { is_open: opening });
      if (Boolean(room.is_open)) setExpandedRoom(null);
      setCloseAlerts((current) => current.filter((alert) => alert.room_id !== room.id));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar sala");
    }
  }

  async function keepRoomOpen(alert: RoomCloseAlert) {
    try {
      await myKidsApi.snoozeRoomClose(alert.room_id);
      setCloseAlerts((current) => current.filter((item) => item.room_id !== alert.room_id));
      setMessage(`${alert.room_name} permanecera aberta. Um novo aviso aparecera em 2 horas.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao manter a sala aberta"); }
  }

  async function submitGuardian(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await myKidsApi.createGuardian({
        ...guardianForm,
        children: guardianForm.children,
      });
      setGuardianForm({
        name: "",
        email: "",
        phone: "",
        gender: "M",
        status: "visitante",
        children: [emptyChild()],
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
    const selectedRoom = openRooms.find((room) => room.id === roomId);
    setError("");
    setMessage("");
    try {
      const checkin = await myKidsApi.createCheckin({
        guardian_id: guardianId,
        child_id: childId,
        ...(selectedRoom ? { room_id: selectedRoom.id } : {}),
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
        const room = openRooms.find((item) => item.id === child.room_id);
        created.push(await myKidsApi.createCheckin({ guardian_id: guardian.id, child_id: child.id, ...(room ? { room_id: room.id } : {}) }));
      }
      await myKidsApi.print({ zpl: buildFamilyPrintJob(created), printer_name: printer?.printer_name || undefined });
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
      await Promise.all(editingGuardian.children.map((child) => child.id > 0
        ? myKidsApi.updateChild(child.id, child)
        : myKidsApi.createChild(editingGuardian.id, child)));
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
    const bridgeLaunchRequested = !printer?.bridge_online;
    if (bridgeLaunchRequested) launchInstalledBridge();
    setPrinterStatus("Procurando a Zebra conectada por USB...");
    try {
      latestPrinter = await myKidsApi.printer();
      if (latestPrinter) setPrinter(latestPrinter);
    } catch {
      // A deteccao local ainda pode funcionar mesmo se a consulta de status falhar.
    }
    const reconnectUrl = localBridgeUrl(latestPrinter?.bridge_url || fallbackPrinter.bridge_url, "reconnect");
    setError("");
    let data: LocalBridgeHealth | null = null;
    let localError: unknown = null;
    try {
      data = await requestLocalBridge(reconnectUrl, "POST");
    } catch (e) {
      localError = e;
      if (!bridgeLaunchRequested) launchInstalledBridge();
      for (let attempt = 0; attempt < 8 && !data; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        try { data = await requestLocalBridge(reconnectUrl, "POST", 2500); } catch (retryError) { localError = retryError; }
      }
    }

    try {
      if (!data) throw localError instanceof Error ? localError : new Error("Ponte local nao respondeu");
      if (data.paired === false) {
        setPrinterStatus("Ponte instalada, mas sem pareamento. Reinstale usando o codigo exibido abaixo.");
        setShowPrinterSetup(true);
        return;
      }
      if (data.cloudError && /(401|autoriza)/i.test(data.cloudError)) {
        setPrinterStatus("A ponte foi encontrada, mas o codigo de pareamento nao foi aceito. Reinstale e informe o codigo atual.");
        setShowPrinterSetup(true);
        return;
      }
      if (data.printerOnline === false || (!data.printerOnline && !data.printerName)) {
        setPrinterStatus(data.error || "Ponte ativa, mas nenhuma Zebra USB foi reconhecida");
        setShowPrinterSetup(true);
        return;
      }

      const detectedPrinter = typeof data.printerName === "string" && data.printerName ? data.printerName : null;
      const detectedBridgeUrl = localBridgeUrl(reconnectUrl, "print");
      const detectedSettings = {
        ...(latestPrinter || fallbackPrinter),
        bridge_url: detectedBridgeUrl,
        printer_name: detectedPrinter || latestPrinter?.printer_name || fallbackPrinter.printer_name,
        is_active: true,
      };
      const savedSettings = await myKidsApi.updatePrinter(detectedSettings);
      setPrinter({ ...savedSettings, bridge_online: true, printer_online: true, detected_printer_name: detectedPrinter });
      setShowPrinterSetup(false);
      const connection = data.connection ? ` via ${data.connection}` : "";
      setPrinterStatus(detectedPrinter ? `Zebra conectada${connection}: ${detectedPrinter}` : "Zebra conectada e pronta");
    } catch (e) {
      if (latestPrinter?.bridge_online) {
        setPrinterStatus(printerStatusText(latestPrinter));
        setShowPrinterSetup(false);
        return;
      }
      const detail = e instanceof Error && e.message ? `: ${e.message}` : "";
      setPrinterStatus(`Nao foi possivel iniciar a ponte Zebra${detail}`);
      setShowPrinterSetup(true);
    }
  }

  async function checkRemotePrinter() {
    try {
      const current = await myKidsApi.printer();
      if (current) setPrinter(current);
      setPrinterStatus(printerStatusText(current));
    } catch {
      setPrinterStatus("Nao foi possivel consultar o notebook da impressora");
    }
  }

  return (
    <main className={styles.page}>
      {closeAlerts.slice(0, 1).map((alert) => (
        <div className={styles.noticeBackdrop} key={alert.room_id}><div className={styles.brandNotice} role="status">
          <div><strong>O culto pode ter terminado</strong><span>O ultimo check-in de {alert.room_name} foi ha 2 horas. Sem resposta, ela fecha automaticamente em 10 minutos.</span></div>
          <div className={styles.noticeActions}>
            <button className={styles.primaryButton} onClick={() => { const room = rooms.find((item) => item.id === alert.room_id); if (room) setRoomConfirmation({ room, opening: false }); }}>Fechar agora</button>
            <button className={styles.secondaryButton} onClick={() => keepRoomOpen(alert)}>Manter aberta</button>
          </div>
        </div></div>
      ))}
      {roomConfirmation && (
        <div className={styles.noticeBackdrop}><div className={styles.confirmNotice} role="status">
          <div><strong>{roomConfirmation.opening ? "Abrir sala?" : "Fechar sala?"}</strong><span>{roomConfirmation.opening ? `Confirma a abertura de ${roomConfirmation.room.name}?` : `Todas as criancas de ${roomConfirmation.room.name} receberao check-out.`}</span></div>
          <div className={styles.noticeActions}><button className={styles.primaryButton} onClick={confirmToggleRoom}>Confirmar</button><button className={styles.secondaryButton} onClick={() => setRoomConfirmation(null)}>Cancelar</button></div>
        </div></div>
      )}
      {showPrinterSetup && (
        <div className={styles.modalBackdrop}>
          <section className={styles.modal}>
            <h2>Configurar impressora Zebra</h2>
            <p>{printerStatus}</p>
            <ol className={styles.setupSteps}>
              <li>Confirme que a Zebra está ligada, com etiquetas e conectada pelo cabo USB.</li>
              <li>Clique em <strong>Testar novamente</strong> para redetectar automaticamente.</li>
              <li>Se ainda não conectar, baixe e execute novamente <strong>instalar_zebra.bat</strong>.</li>
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
                <div className={styles.attentionOptions}>
                  <label><input type="checkbox" checked={Boolean(child.has_autism)} onChange={(e) => setEditingGuardian({ ...editingGuardian, children: editingGuardian.children.map((item) => item.id === child.id ? { ...item, has_autism: e.target.checked } : item) })} /> Autismo</label>
                  {Boolean(child.has_autism) && <label>Tipo / nivel de suporte<input value={child.autism_type || ""} onChange={(e) => setEditingGuardian({ ...editingGuardian, children: editingGuardian.children.map((item) => item.id === child.id ? { ...item, autism_type: e.target.value } : item) })} /></label>}
                  <label><input type="checkbox" checked={Boolean(child.has_food_restriction)} onChange={(e) => setEditingGuardian({ ...editingGuardian, children: editingGuardian.children.map((item) => item.id === child.id ? { ...item, has_food_restriction: e.target.checked } : item) })} /> Restricao alimentar</label>
                </div>
                {Boolean(child.has_food_restriction) && <label>Qual e a restricao alimentar?<textarea required maxLength={2000} value={child.food_restriction_notes || ""} onChange={(e) => setEditingGuardian({ ...editingGuardian, children: editingGuardian.children.map((item) => item.id === child.id ? { ...item, food_restriction_notes: e.target.value } : item) })} placeholder="Ex.: alergia a leite e derivados" /></label>}
                {Boolean(child.has_autism) && <label>Observacoes de cuidado<textarea value={child.notes || ""} onChange={(e) => setEditingGuardian({ ...editingGuardian, children: editingGuardian.children.map((item) => item.id === child.id ? { ...item, notes: e.target.value } : item) })} /></label>}
              </div>
            ))}
            <button type="button" className={styles.secondaryButton} onClick={() => setEditingGuardian({ ...editingGuardian, children: [...editingGuardian.children, { id: -Date.now(), guardian_id: editingGuardian.id, name: "", birth_date: null, gender: "M", has_autism: false, autism_type: null, has_food_restriction: false, food_restriction_notes: null, notes: null, room_id: null, checkins_count: 0 }] })}><FaPlus /> Adicionar crianca</button>
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
        <a href="/homecards" className={styles.backHome} aria-label="Voltar para a biblioteca" title="Voltar para a biblioteca"><FaArrowLeft /></a>
        <div>
          <span className={styles.kicker}>Ministerio infantil</span>
          <h1>MyKids</h1>
        </div>
        <button className={`${styles.printButton} ${styles.desktopPrinterButton} ${printerButtonState}`} onClick={detectPrinterBridge}>
          <span className={styles.statusDot} />
          <FaPrint />
          Zebra
        </button>
        <button className={`${styles.printButton} ${styles.mobilePrinterButton} ${printerButtonState}`} onClick={checkRemotePrinter}>
          <span className={styles.statusDot} />
          <FaPrint />
          {printerReady ? "Impressora online" : printer?.bridge_online ? "Zebra desconectada" : "Ver impressora"}
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
                              children: [...guardianForm.children, emptyChild()],
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
                            </div>
                            <div className={styles.attentionOptions}>
                              <label><input type="checkbox" checked={child.has_autism} onChange={(event) => updateChildDraft(index, { has_autism: event.target.checked })} /> Autismo</label>
                              {child.has_autism && <label>Tipo / nivel de suporte<input value={child.autism_type} onChange={(event) => updateChildDraft(index, { autism_type: event.target.value })} placeholder="Ex.: nivel 1 de suporte" /></label>}
                              <label><input type="checkbox" checked={child.has_food_restriction} onChange={(event) => updateChildDraft(index, { has_food_restriction: event.target.checked })} /> Restricao alimentar</label>
                            </div>
                            {child.has_food_restriction && <label>Qual e a restricao alimentar?<textarea required maxLength={2000} value={child.food_restriction_notes} onChange={(event) => updateChildDraft(index, { food_restriction_notes: event.target.value })} placeholder="Ex.: alergia a leite e derivados" /></label>}
                            {child.has_autism && <label>Observacoes de cuidado<textarea value={child.notes} onChange={(event) => updateChildDraft(index, { notes: event.target.value })} placeholder="Informacoes importantes para o cuidado" /></label>}
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

          {activeTab === "historico" && (
            <section className={styles.content}>
              <section className={styles.panel}>
                <div className={styles.sectionTitle}><h2>Ultimas salas fechadas</h2><span>Historico dos cultos recentes</span></div>
                <div className={styles.roomList}>
                  {roomHistory.length ? roomHistory.map((item) => (
                    <article className={styles.roomCard} key={item.id}>
                      <div><h3>{item.room_name}</h3><p>{new Date(item.closed_at).toLocaleString("pt-BR")}{Boolean(item.closed_automatically) ? " · fechamento automatico" : ""}</p></div>
                      <div className={styles.roomCount}><strong>{item.children_count}</strong><span>crianca(s)</span></div>
                    </article>
                  )) : <p>Nenhuma sala fechada registrada ainda.</p>}
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
        <button className={activeTab === "historico" ? styles.activeNav : ""} onClick={() => setActiveTab("historico")}><FaHistory />Historico</button>
      </nav>
    </main>
  );
}
