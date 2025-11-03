# Guia de Integração APOIA.se + Telegram

Este documento descreve como integrar o código deste projeto ao backend real do APOIA.se.

## 📋 Status da Implementação

### ✅ Implementado

1. **Endpoints do APOIA.se** ([apoiaseIntegrationRoutes.ts](backend/src/routes/apoiaseIntegrationRoutes.ts))
   - `POST /api/campaigns/:campaignSlug/integrations/telegram` - Inicia integração
   - `GET /api/campaigns/:campaignSlug/integrations/telegram/callback` - Callback
   - `GET /api/campaigns/:campaignSlug/integrations/telegram` - Lista integrações
   - `DELETE /api/campaigns/:campaignSlug/integrations/telegram/:id` - Remove integração

2. **Serviço de Integração OAuth-like** ([integrationAuthService.ts](backend/src/services/integrationAuthService.ts))
   - Validação de credenciais temporárias via Redis
   - Fluxo OAuth-like seguro
   - Geração de state tokens anti-CSRF

3. **Descoberta Automática de Grupos** ([telegramGroupDiscoveryService.ts](backend/src/services/telegramGroupDiscoveryService.ts))
   - Lista grupos onde bot é admin
   - Valida permissões necessárias
   - Cache de grupos descobertos

4. **Endpoints do Serviço de Integração**
   - `GET /api/integration/authorize` - Inicia fluxo (restaurado para OAuth)
   - `GET /api/integration/available-groups` - Lista grupos disponíveis
   - `POST /api/integration/telegram-auth` - Autentica via Telegram Widget
   - `POST /api/integration/select-group` - Seleciona grupo
   - `POST /api/integration/complete` - Finaliza e redireciona

### 🚧 A Fazer

1. **Frontend**: Atualizar página de autorização para:
   - Aceitar query params (campaign_slug, api_key, bearer_token, redirect_uri)
   - Listar grupos automaticamente (remover input manual)
   - Redirecionar para callback do APOIA.se após sucesso

2. **Backend**: Completar método `completeAuthorization`
   - Remover dependência de `userId`
   - Construir callback URL corretamente

3. **Página no Clone APOIA.se**: Criar página de integrações
   - Botão "Conectar Telegram"
   - Lista de integrações ativas
   - Gerenciamento de integrações

4. **Segurança**: Adicionar
   - Assinatura de webhooks
   - Rate limiting específico
   - Logs de audit trail

## 🔄 Fluxo Completo (Como Será na Produção)

### 1. No Backend do APOIA.se

```typescript
// Adicionar ao backend do APOIA.se
import apoiaseIntegrationRoutes from './routes/apoiaseIntegrationRoutes';

app.use('/api/campaigns', apoiaseIntegrationRoutes);
```

### 2. Na Interface do APOIA.se

**Página**: `/campaigns/:slug/edit#integrations`

```jsx
// Botão para conectar Telegram
<button onClick={async () => {
  const response = await fetch(
    `/api/campaigns/${campaignSlug}/integrations/telegram`,
    { method: 'POST' }
  );

  const { redirectUrl } = await response.json();

  // Redirecionar para serviço de integração
  window.location.href = redirectUrl;
}}>
  Conectar Telegram
</button>
```

### 3. No Serviço de Integração (Este Projeto)

**URL**: `https://telegram-integration.apoia.se/integration/authorize`

Recebe:
- `campaign_slug`: minha-campanha
- `api_key`: credencial temporária (1h)
- `bearer_token`: token temporário
- `redirect_uri`: https://apoia.se/campaigns/minha-campanha/integrations/telegram/callback

Fluxo:
1. Valida credenciais no Redis
2. Mostra Telegram Login Widget
3. **Novo**: Lista grupos automaticamente
4. Usuário seleciona grupo
5. Cria integração
6. **Redireciona de volta**: `redirect_uri?status=success&integration_id=xxx&state=yyy`

### 4. Callback no APOIA.se

O APOIA.se recebe o callback e:
- Mostra mensagem de sucesso
- Atualiza lista de integrações
- Salva `integration_id` se necessário

## 📦 Arquivos para Adicionar ao APOIA.se

### Backend

1. **routes/apoiaseIntegrationRoutes.ts** (novo)
   - Endpoints de integração Telegram

2. **Dependência**: Redis client
   ```typescript
   // Já configurado em config/redis.ts
   ```

### Frontend (Página de Integrações)

```typescript
// pages/campaigns/[slug]/edit/integrations.tsx

export default function CampaignIntegrationsPage() {
  const { slug } = useParams();
  const [integrations, setIntegrations] = useState([]);

  const handleConnectTelegram = async () => {
    const res = await fetch(
      `/api/campaigns/${slug}/integrations/telegram`,
      { method: 'POST' }
    );

    const { redirectUrl } = await res.json();
    window.location.href = redirectUrl;
  };

  return (
    <div>
      <h2>Integrações</h2>

      {/* Telegram */}
      <div>
        <h3>Telegram</h3>
        <p>Conecte um grupo do Telegram para dar acesso exclusivo aos seus apoiadores</p>
        <button onClick={handleConnectTelegram}>
          Conectar Telegram
        </button>
      </div>

      {/* Lista de integrações */}
      {integrations.map(int => (
        <div key={int.id}>
          <p>{int.groupTitle}</p>
          <button onClick={() => removeIntegration(int.id)}>Remover</button>
        </div>
      ))}
    </div>
  );
}
```

## 🔐 Segurança

### Credenciais Temporárias (Redis)

```typescript
// Backend do APOIA.se
const apiKey = crypto.randomBytes(32).toString('base64url');
const bearerToken = crypto.randomBytes(32).toString('base64url');

await redis.setex(
  `telegram:integration:${apiKey}`,
  3600, // 1 hora
  JSON.stringify({
    campaignSlug,
    campaignId,
    makerId,
    bearerToken,
    createdAt: new Date(),
  })
);
```

### Validação no Serviço

```typescript
// Serviço de integração valida
const credentials = await redis.get(`telegram:integration:${apiKey}`);

if (!credentials || credentials.bearerToken !== bearerToken) {
  throw new Error('Credenciais inválidas');
}
```

### State Token Anti-CSRF

```typescript
const stateToken = crypto.randomBytes(32).toString('base64url');
// Armazenado na sessão, validado no callback
```

## 🌐 Variáveis de Ambiente

### Backend do APOIA.se

```env
TELEGRAM_INTEGRATION_SERVICE_URL=https://telegram-integration.apoia.se
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Serviço de Integração

```env
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=your_bot_username
REDIS_HOST=localhost  # Mesmo Redis do APOIA.se
REDIS_PORT=6379
```

## 📝 Próximos Passos

1. ✅ Completar método `completeAuthorization` (remover auth JWT)
2. ✅ Atualizar frontend para aceitar query params
3. ✅ Implementar listagem automática de grupos
4. ⏳ Criar página de integrações no clone APOIA.se
5. ⏳ Testar fluxo completo end-to-end
6. ⏳ Adicionar tratamento de erros robusto
7. ⏳ Implementar logs de auditoria
8. ⏳ Deploy do serviço de integração

## 🚀 Deploy

### Serviço de Integração

```bash
# Docker
docker build -t telegram-integration .
docker run -p 3001:3001 telegram-integration

# Ou com docker-compose
docker-compose up -d
```

### DNS

```
telegram-integration.apoia.se → IP do serviço
```

### Reverse Proxy (Nginx)

```nginx
server {
  listen 443 ssl;
  server_name telegram-integration.apoia.se;

  location / {
    proxy_pass http://localhost:3001;
  }
}
```

## 📞 Suporte

- Backend: Endpoints em `apoiaseIntegrationRoutes.ts`
- Serviço: Rotas em `integrationAuthRoutes.ts`
- Docs: Este arquivo
