"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getPushSubscription, registerServiceWorker, requestNotificationPermission, sendNotificationToServer, setupVencimentoChecker } from "@/functions/notification-utils";
import styles from "./pwa-initializer.module.css";

interface PWAInitializerProps { userId?: string; token?: string }
interface InstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

export default function PWAInitializer({ userId, token }: PWAInitializerProps) {
  const pathname = usePathname();
  const quietPublicRoute = pathname === "/salaKids";
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [iosInstructionsOpen, setIosInstructionsOpen] = useState(false);
  const [showNotificationInvite, setShowNotificationInvite] = useState(false);

  useEffect(() => {
    if (quietPublicRoute) return;
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    const dismissed = sessionStorage.getItem("pwa-install-dismissed") === "1";
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!standalone && !dismissed && isIos) setShowIosHelp(true);
    const onInstallPrompt = (event: Event) => { event.preventDefault(); if (!standalone && !dismissed) setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    void registerServiceWorker().then(() => {
      const currentUserId = userId || localStorage.getItem("userId") || undefined;
      const currentToken = token || localStorage.getItem("token") || undefined;
      if (currentUserId && currentToken && "Notification" in window && Notification.permission === "default") setShowNotificationInvite(true);
      else if (currentUserId && currentToken && "Notification" in window && Notification.permission === "granted") setupVencimentoChecker(currentUserId, currentToken);
    });
    return () => window.removeEventListener("beforeinstallprompt", onInstallPrompt);
  }, [userId, token, quietPublicRoute]);

  const dismissInstall = () => { sessionStorage.setItem("pwa-install-dismissed", "1"); setInstallPrompt(null); setShowIosHelp(false); };
  const install = async () => { if (!installPrompt) return; await installPrompt.prompt(); await installPrompt.userChoice; dismissInstall(); };
  const enableNotifications = async () => {
    setShowNotificationInvite(false);
    if (await requestNotificationPermission() !== "granted") return;
    const currentUserId = userId || localStorage.getItem("userId") || undefined;
    const currentToken = token || localStorage.getItem("token") || undefined;
    const subscription = await getPushSubscription();
    if (subscription && currentUserId) await sendNotificationToServer(currentUserId, subscription, currentToken);
    if (currentUserId && currentToken) setupVencimentoChecker(currentUserId, currentToken);
  };

  if (quietPublicRoute || (!installPrompt && !showIosHelp && !showNotificationInvite)) return null;
  return <div className={styles.noticeStack}>
    {(installPrompt || showIosHelp) && <div className={styles.notice} role="status"><div><strong>Baixar Biblioteca Helena Ramazzotte</strong><span>{showIosHelp && iosInstructionsOpen ? "No iPhone: toque em Compartilhar e depois em Adicionar à Tela de Início." : "Adicione o aplicativo à tela inicial para acessar a biblioteca mais rápido."}</span></div><div className={styles.actions}>{installPrompt ? <button onClick={install}>Baixar</button> : <button onClick={() => setIosInstructionsOpen(true)}>Baixar</button>}<button className={styles.secondary} onClick={dismissInstall}>Agora não</button></div></div>}
    {showNotificationInvite && <div className={styles.notice} role="status"><div><strong>Ativar notificações?</strong><span>Receba avisos importantes da biblioteca no seu aparelho.</span></div><div className={styles.actions}><button onClick={enableNotifications}>Ativar</button><button className={styles.secondary} onClick={() => setShowNotificationInvite(false)}>Agora não</button></div></div>}
  </div>;
}
