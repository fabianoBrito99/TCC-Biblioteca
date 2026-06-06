// src/functions/notification-utils.ts
// Utilitários para gerenciar notificações push

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Workers não são suportados neste navegador");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("Service Worker registrado com sucesso:", registration);
    return registration;
  } catch (error) {
    console.error("Erro ao registrar Service Worker:", error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("Notificações não são suportadas neste navegador");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  // permission === "default"
  const permission = await Notification.requestPermission();
  return permission;
}

export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push Notifications não são suportadas neste navegador");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log("Inscrito em notificações push:", subscription);
    return subscription;
  } catch (error) {
    console.error("Erro ao se inscrever em notificações push:", error);
    return null;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log("Desinscrito de notificações push");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Erro ao desinscrever de notificações push:", error);
    return false;
  }
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error("Erro ao obter inscrição push:", error);
    return null;
  }
}

export async function sendNotificationToServer(
  userId: string,
  subscription: PushSubscription,
  token: string
): Promise<boolean> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.helenaramazzotte.online";

  try {
    const response = await fetch(`${API_BASE}/api/notificacoes/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        usuario_id: userId,
        subscription: subscription,
        endpoint: subscription.endpoint,
        p256dh: subscription.getKey("p256dh"),
        auth: subscription.getKey("auth"),
      }),
    });

    if (!response.ok) {
      throw new Error("Erro ao enviar inscrição para o servidor");
    }

    console.log("Inscrição enviada ao servidor com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação para o servidor:", error);
    return false;
  }
}

export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Notificações não são suportadas neste navegador");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: "/logo-biblioteca.svg",
      badge: "/logo-biblioteca.svg",
      tag: "biblioteca-notification",
      ...options,
    });
  } catch (error) {
    console.error("Erro ao mostrar notificação:", error);
  }
}

export async function checkVencimentosProximos(
  userId: string,
  token: string
): Promise<void> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.helenaramazzotte.online";

  try {
    const response = await fetch(`${API_BASE}/api/emprestimos/proximos-vencimentos/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json() as { emprestimos?: Array<{ id_emprestimo: string; nome_livro: string; data_devolucao: string }> };
    const emprestimos = data.emprestimos || [];

    if (emprestimos.length > 0) {
      const proximoVencimento = emprestimos[0];
      const dataVencimento = new Date(proximoVencimento.data_devolucao);
      const hoje = new Date();
      const diasAteFecho = Math.ceil(
        (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diasAteFecho <= 3 && diasAteFecho > 0) {
        await showLocalNotification(`Aviso de Vencimento: ${proximoVencimento.nome_livro}`, {
          body: `Este livro vence em ${diasAteFecho} dia${diasAteFecho !== 1 ? "s" : ""}. Devolva-o em tempo!`,
          tag: `vencimento-${proximoVencimento.id_emprestimo}`,
          requireInteraction: true,
        });
      }
    }
  } catch (error) {
    console.error("Erro ao verificar vencimentos próximos:", error);
  }
}

// Auxiliar para converter VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Configurar verificação periódica de vencimentos
export function setupVencimentoChecker(
  userId: string,
  token: string,
  intervalMinutes: number = 60
): void {
  // Verificar imediatamente
  checkVencimentosProximos(userId, token);

  // Verificar periodicamente
  setInterval(() => {
    checkVencimentosProximos(userId, token);
  }, intervalMinutes * 60 * 1000);
}
