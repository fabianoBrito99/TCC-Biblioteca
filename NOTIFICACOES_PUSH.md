# Configuração de Push Notifications - Guia de Implementação

## Visão Geral

O sistema de notificações push foi implementado para avisar usuários sobre vencimentos de empréstimos direto na aba de notificações do celular.

## Componentes Implementados

### Frontend (React/Next.js)

1. **Service Worker** (`/public/sw.js`)
   - Gerencia notificações push
   - Cache de recursos
   - Sincronização em background

2. **Utilities de Notificação** (`/src/functions/notification-utils.ts`)
   - `registerServiceWorker()` - Registra o SW
   - `requestNotificationPermission()` - Pede permissão ao usuário
   - `subscribeToPushNotifications()` - Se inscreve em notificações
   - `checkVencimentosProximos()` - Verifica vencimentos próximos
   - `setupVencimentoChecker()` - Configura verificação periódica

3. **Componente PWAInitializer** (`/src/componentes/pwa/PWAInitializer.tsx`)
   - Inicializa o PWA na página de homecards
   - Gerencia o ciclo de vida das notificações

## Configuração do Backend

### Passo 1: Gerar Chaves VAPID

VAPID (Voluntary Application Server Identification) é necessário para enviar notificações push.

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Isso gerará algo como:
```
Public Key: BJrxxxxxxxxxxx
Private Key: xxxxxxxxxxxxx
```

### Passo 2: Adicionar Variáveis de Ambiente

Adicione ao seu `.env` ou arquivo de configuração:

```env
VAPID_PUBLIC_KEY=BJrxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxx
VAPID_SUBJECT=mailto:seu-email@exemplo.com
```

### Passo 3: Instalar Dependência

```bash
npm install web-push
```

### Passo 4: Criar Tabela de Inscrições Push

Execute o SQL no seu banco de dados:

```sql
CREATE TABLE Push_Subscription (
  id_subscription INT PRIMARY KEY AUTO_INCREMENT,
  fk_id_usuario INT NOT NULL,
  endpoint VARCHAR(1000) NOT NULL,
  p256dh VARCHAR(500) NOT NULL,
  auth VARCHAR(500) NOT NULL,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fk_id_usuario) REFERENCES Usuario(id_usuario),
  UNIQUE KEY unique_endpoint (endpoint)
);
```

### Passo 5: Criar Endpoint para Subscrição

Adicione este endpoint em `/api/routes/notificacoes.routes.js`:

```javascript
router.post('/subscribe', auth, NotificacoesController.subscribePush);
```

### Passo 6: Implementar Controller

Crie `/api/controllers/notificacoes.controller.js`:

```javascript
const connection = require("../config/mysql.config");
const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function subscribePush(req, res) {
  const { usuario_id, endpoint, p256dh, auth } = req.body;

  if (!usuario_id || !endpoint || !p256dh || !auth) {
    return res.status(400).json({ erro: "Dados incompletos" });
  }

  try {
    // Salvar subscrição no banco
    connection.query(
      `INSERT INTO Push_Subscription (fk_id_usuario, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       p256dh = VALUES(p256dh),
       auth = VALUES(auth),
       criada_em = CURRENT_TIMESTAMP`,
      [usuario_id, endpoint, p256dh, auth],
      (err) => {
        if (err) {
          console.error("Erro ao salvar subscrição:", err);
          return res.status(500).json({ erro: "Erro ao salvar subscrição" });
        }
        res.json({ sucesso: true });
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ erro: error.message });
  }
}

module.exports = { subscribePush };
```

### Passo 7: Endpoint para Enviar Notificações

Adicione este endpoint para enviar notificações:

```javascript
async function enviarNotificacaoVencimento(req, res) {
  const { usuario_id, titulo, mensagem } = req.body;

  try {
    // Buscar subscrições do usuário
    connection.query(
      `SELECT endpoint, p256dh, auth FROM Push_Subscription
       WHERE fk_id_usuario = ?`,
      [usuario_id],
      async (err, subscriptions) => {
        if (err) {
          return res.status(500).json({ erro: "Erro ao buscar subscrições" });
        }

        const payload = JSON.stringify({
          title: titulo,
          body: mensagem,
          icon: "/logo-biblioteca.svg",
          badge: "/logo-biblioteca.svg",
          tag: "biblioteca-notification",
        });

        let enviadas = 0;

        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              payload
            );
            enviadas++;
          } catch (error) {
            console.error("Erro ao enviar notificação:", error.message);
            // Se erro 410 (subscription expired), remover do BD
            if (error.statusCode === 410) {
              connection.query(
                `DELETE FROM Push_Subscription WHERE endpoint = ?`,
                [sub.endpoint]
              );
            }
          }
        }

        res.json({ enviadas, total: subscriptions.length });
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ erro: error.message });
  }
}
```

### Passo 8: Verificar Vencimentos Próximos (Backend)

Adicione este endpoint:

```javascript
async function verificarProximosVencimentos(req, res) {
  const usuarioId = req.params.usuarioId;

  try {
    connection.query(
      `SELECT e.id_emprestimo, l.nome_livro, e.data_devolucao
       FROM Emprestimo e
       JOIN Livro l ON e.fk_id_livros = l.id_livro
       WHERE e.fk_id_usuarios = ? 
       AND e.data_devolucao > NOW()
       AND e.data_devolucao <= DATE_ADD(NOW(), INTERVAL 3 DAY)
       AND e.devolvido = 0
       ORDER BY e.data_devolucao ASC
       LIMIT 5`,
      [usuarioId],
      (err, emprestimos) => {
        if (err) {
          return res.status(500).json({ erro: "Erro ao buscar empréstimos" });
        }
        res.json({ emprestimos: emprestimos || [] });
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ erro: error.message });
  }
}
```

## Como Funciona

1. **Usuário instala o PWA** na tela inicial do celular
2. **Ao abrir o app**, o PWAInitializer:
   - Registra o Service Worker
   - Pede permissão para notificações
   - Se autorizado, se inscreve em notificações push
3. **A subscrição é enviada** para o backend
4. **Periodicamente**, o app verifica vencimentos próximos
5. **Se houver vencimento em 3 dias**, uma notificação é exibida
6. **Notificações chegam na aba de notificações do celular** (não apenas no app)

## Testando Localmente

### 1. Instale web-push para testes:
```bash
npm install -g web-push
```

### 2. Envie uma notificação de teste:
```bash
web-push send-notification \
  --endpoint "ENDPOINT_DA_SUBSCRIÇÃO" \
  --key "CHAVE_PUBLICA" \
  --auth "CHAVE_AUTH" \
  --payload "{\"title\":\"Teste\",\"body\":\"Notificação de teste\"}"
```

## Nota Importante

O sistema de notificações push funciona melhor em:
- ✅ Android (Chrome, Firefox)
- ✅ iOS 16+ (PWA instalado como aplicativo)
- ⚠️ Desktop (depende do navegador)

Para melhor experiência em iOS 16+, o app deve ser instalado como PWA via "Adicionar à tela inicial".

## Segurança

- Sempre use HTTPS em produção
- Mantenha a VAPID_PRIVATE_KEY segura (não commit no git)
- Valide todas as subscrições no backend
- Implemente rate limiting para evitar abuso

## Troubleshooting

### Notificações não aparecem:
1. Verifique se o Service Worker foi registrado (DevTools > Application > Service Workers)
2. Verifique permissões: DevTools > Application > Manifest > Display
3. Teste permissões no console: `Notification.permission`

### Erro "Notification not supported":
- Está usando HTTP? (Precisa de HTTPS)
- Navegador antigo? (Precisa de versão moderna)

### Subscrição expirada:
- O sistema remove automaticamente subscrições com erro 410
- Usuário pode se reinscrever ao abrir o app novamente
