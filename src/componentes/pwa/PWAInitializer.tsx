"use client";

import { useEffect } from "react";
import {
  registerServiceWorker,
  requestNotificationPermission,
  setupVencimentoChecker,
  getPushSubscription,
  sendNotificationToServer,
} from "@/functions/notification-utils";

interface PWAInitializerProps {
  userId?: string;
  token?: string;
}

export default function PWAInitializer({ userId, token }: PWAInitializerProps) {
  useEffect(() => {
    const initializePWA = async () => {
      try {
        // 1. Registrar Service Worker
        const registration = await registerServiceWorker();
        if (!registration) return;

        console.log("PWA inicializado com sucesso");

        // 2. Se o usuário está logado, solicitar permissão de notificações
        if (userId && token) {
          // Aguardar um pouco para não ser muito agressivo
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const permission = await requestNotificationPermission();

          if (permission === "granted") {
            console.log("Notificações permidas");

            // 3. Tentar se inscrever em notificações push
            const subscription = await getPushSubscription();
            if (subscription) {
              // Enviar subscription para o servidor
              await sendNotificationToServer(userId, subscription, token);

              // 4. Configurar verificação de vencimentos
              setupVencimentoChecker(userId, token);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao inicializar PWA:", error);
      }
    };

    initializePWA();
  }, [userId, token]);

  // Este componente não renderiza nada
  return null;
}
