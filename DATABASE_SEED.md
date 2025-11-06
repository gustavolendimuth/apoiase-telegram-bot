# Database Seed/Migration Guide

Este guia explica como exportar dados do banco local e importar no servidor de produção.

## 🚀 Seed Automático no Railway (Deploy)

O projeto está configurado para popular automaticamente o banco de dados no primeiro deploy do Railway!

### Como Funciona

1. **Detecção Inteligente**: O script verifica se o banco está vazio antes de popular
2. **Execução Automática**: Roda após `npm install` via hook `postinstall`
3. **Dados de Teste**: Cria 5 usuários e 6 campanhas automaticamente

### Configuração no Railway

**Não precisa fazer nada!** O seed roda automaticamente quando você faz deploy. O script:
- ✅ Verifica se o banco já tem dados (não sobrescreve)
- ✅ Cria usuários de teste com senhas hash
- ✅ Cria 6 campanhas de exemplo com diferentes categorias
- ✅ Exibe credenciais de acesso no log do Railway

### Credenciais de Teste Criadas

```
maker@example.com / test123
joao.silva@example.com / senha123
maria.santos@example.com / senha123
pedro.oliveira@example.com / senha123
admin@example.com / admin123 (admin)
```

### Verificar Logs no Railway

Após o deploy, você verá no log:

```
🌱 Iniciando seed automático...
🔌 Conectando ao MongoDB...
✅ Conectado ao MongoDB!
📦 Banco de dados vazio. Iniciando seed...

👤 Criando usuários...
   ✓ Usuário criado: maker@example.com
   ...

📢 Criando campanhas...
   ✓ Campanha criada: Podcast Histórias do Brasil
   ...

✅ Seed automático concluído com sucesso!
```

### Desabilitar Seed Automático

Se quiser desabilitar o seed automático (ex: em produção com dados reais):

**Opção 1: No Railway (recomendado)**
- Vá em Variables
- Adicione: `AUTO_SEED=false`

**Opção 2: Remover do package.json**
```json
// Remover ou comentar a linha:
"postinstall": "npm run seed:auto",
```

### Rodar Seed Manualmente

```bash
# Via npm script
npm run seed:auto

# Via Railway CLI
railway run npm run seed:auto
```

---

## Visão Geral (Backup/Restore Manual)

Para casos onde você precisa migrar dados específicos entre ambientes, o sistema de seed permite fazer backup completo do banco MongoDB local e restaurar em qualquer ambiente (desenvolvimento, staging, produção).

## Estrutura

```
backend/
├── scripts/
│   ├── exportDatabase.ts    # Script de exportação
│   └── importDatabase.ts    # Script de importação
└── database-exports/         # Diretório de backups (criado automaticamente)
    └── backup-YYYY-MM-DDTHH-mm-ss/
        ├── metadata.json     # Informações do backup
        ├── users.json
        ├── campaigns.json
        ├── supports.json
        ├── integrations.json
        ├── members.json
        ├── eventlogs.json
        ├── integrationauthsessions.json
        └── telegramauthtokens.json
```

## Comandos Disponíveis

### Exportar Dados (Backup)

```bash
# No diretório backend/
npm run db:export
# ou
npm run db:backup
```

**O que faz:**
- Conecta no banco configurado em `MONGODB_URI`
- Exporta todas as coleções para JSON
- Cria diretório com timestamp: `database-exports/backup-YYYY-MM-DDTHH-mm-ss/`
- Salva metadata com informações do backup

**Exemplo de saída:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB
📦 Exporting data to: /backend/database-exports/backup-2025-11-04T14-30-00
  📄 Exporting users...
  ✅ Exported 5 documents from users
  📄 Exporting campaigns...
  ✅ Exported 3 documents from campaigns
  ...

✅ Export completed successfully!
📊 Summary:
   Total collections: 8
   Total documents: 45
   Export location: /backend/database-exports/backup-2025-11-04T14-30-00
```

### Importar Dados (Restore)

```bash
# No diretório backend/
npm run db:import
# ou
npm run db:restore

# Importar backup específico:
npm run db:import backup-2025-11-04T14-30-00
```

**O que faz:**
- Conecta no banco configurado em `MONGODB_URI`
- **DELETA todos os dados existentes** (cuidado!)
- Importa dados do backup mais recente (ou do especificado)
- Exibe resumo da importação

**Exemplo de saída:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB
📦 Using most recent backup: backup-2025-11-04T14-30-00
📊 Backup info:
   Export date: 2025-11-04T14:30:00.000Z
   Total documents: 45

⚠️  WARNING: This will DELETE all existing data and import from backup!
   Target database: mongodb://production-host:27017/apoiase
   Backup location: /backend/database-exports/backup-2025-11-04T14-30-00

  🗑️  Clearing users...
  📄 Importing users...
  ✅ Imported 5 documents to users
  ...

✅ Import completed successfully!
```

## Workflow: Local → Servidor

### Passo 1: Exportar dados locais

```bash
cd backend
npm run db:export
```

Isso cria um diretório `database-exports/backup-YYYY-MM-DDTHH-mm-ss/` com todos os dados.

### Passo 2: Transferir backup para o servidor

**Opção A: Via SCP (se tiver acesso SSH)**
```bash
# Comprimir backup
cd backend/database-exports
tar -czf backup-2025-11-04.tar.gz backup-2025-11-04T14-30-00/

# Enviar para servidor
scp backup-2025-11-04.tar.gz user@servidor:/path/to/backend/database-exports/

# No servidor, descomprimir
ssh user@servidor
cd /path/to/backend/database-exports
tar -xzf backup-2025-11-04.tar.gz
```

**Opção B: Via Git (se backup for pequeno)**
```bash
# Adicionar ao .gitignore uma exceção temporária
echo "!database-exports/backup-production/" >> .gitignore

# Commitar e push
git add database-exports/backup-production/
git commit -m "chore: production database seed"
git push

# No servidor, fazer pull
ssh user@servidor
cd /path/to/backend
git pull
```

**Opção C: Via Docker Volume (se usando Docker)**
```bash
# Copiar para container em execução
docker cp backend/database-exports/backup-2025-11-04T14-30-00 \
  apoiase-backend:/app/backend/database-exports/
```

### Passo 3: Importar no servidor

**No servidor:**

```bash
cd backend

# Configurar variáveis de ambiente do servidor
# Editar .env com MONGODB_URI do servidor

# Importar dados
npm run db:import backup-2025-11-04T14-30-00
```

## Workflow: Servidor → Local (Backup de produção)

Mesmo processo, mas invertido:

```bash
# No servidor
cd backend
npm run db:export

# Transferir para local
scp user@servidor:/path/to/backend/database-exports/backup-YYYY-MM-DD.tar.gz .

# Local: descomprimir e importar
tar -xzf backup-YYYY-MM-DD.tar.gz
npm run db:import backup-YYYY-MM-DDTHH-mm-ss
```

## Automatização com Docker

### Exportar do container local

```bash
# Exportar dentro do container
docker exec apoiase-backend npm run db:export

# Copiar backup para host
docker cp apoiase-backend:/app/backend/database-exports/backup-YYYY-MM-DDTHH-mm-ss \
  ./backend/database-exports/
```

### Importar no container do servidor

```bash
# Copiar backup para container
docker cp ./backend/database-exports/backup-YYYY-MM-DDTHH-mm-ss \
  apoiase-backend:/app/backend/database-exports/

# Importar dentro do container
docker exec apoiase-backend npm run db:import backup-YYYY-MM-DDTHH-mm-ss
```

## Segurança e Boas Práticas

### ⚠️ AVISOS IMPORTANTES

1. **Senhas**: Os backups incluem hashes de senha. Mantenha os arquivos seguros.
2. **Tokens**: Backups contêm API keys e JWT secrets. Não commite no Git público.
3. **GDPR**: Dados pessoais estão incluídos. Siga regulamentações de privacidade.
4. **Backup Destrutivo**: `db:import` DELETA todos os dados existentes antes de importar.

### Recomendações

1. **Sempre faça backup antes de importar:**
   ```bash
   # No servidor, antes de importar dados locais
   npm run db:export  # Backup de segurança
   npm run db:import backup-from-local
   ```

2. **Teste em staging primeiro:**
   ```bash
   # Staging
   MONGODB_URI=mongodb://staging:27017/test npm run db:import
   # Verificar se tudo está ok
   # Só então fazer em produção
   ```

3. **Verifique os dados após importação:**
   ```bash
   # Conectar ao MongoDB
   docker exec -it apoiase-mongodb mongosh

   # Verificar contagens
   use apoiase-telegram-bot
   db.users.countDocuments()
   db.campaigns.countDocuments()
   db.supports.countDocuments()
   ```

4. **Adicione ao .gitignore:**
   ```
   # backend/.gitignore
   database-exports/
   *.tar.gz
   ```

5. **Automatize backups em produção:**
   ```bash
   # Cron job diário (adicionar ao servidor)
   0 3 * * * cd /path/to/backend && npm run db:export
   ```

## Troubleshooting

### Erro: "No backups found"
```bash
# Verifique se o diretório existe
ls backend/database-exports/

# Crie um backup primeiro
npm run db:export
```

### Erro: "Connection refused"
```bash
# Verifique MONGODB_URI no .env
cat backend/.env | grep MONGODB_URI

# Teste conexão manual
docker exec -it apoiase-mongodb mongosh
```

### Erro: "Permission denied"
```bash
# Dê permissões ao diretório
chmod -R 755 backend/database-exports/
```

### Backup muito grande
```bash
# Comprimir antes de transferir
cd backend/database-exports
tar -czf backup.tar.gz backup-YYYY-MM-DDTHH-mm-ss/

# Descomprimir no destino
tar -xzf backup.tar.gz
```

## Estrutura de Dados

Cada arquivo JSON contém um array de documentos MongoDB:

**users.json:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "email": "maker@example.com",
    "name": "Test Maker",
    "roles": ["user"],
    "createdAt": "2025-11-04T00:00:00.000Z"
  }
]
```

**metadata.json:**
```json
{
  "exportDate": "2025-11-04T14:30:00.000Z",
  "timestamp": "2025-11-04T14-30-00",
  "mongodbUri": "mongodb://localhost:27017/apoiase-telegram-bot",
  "collections": {
    "users": 5,
    "campaigns": 3,
    "supports": 8
  },
  "totalDocuments": 45
}
```

## Referências

- Scripts: [backend/scripts/exportDatabase.ts](backend/scripts/exportDatabase.ts), [backend/scripts/importDatabase.ts](backend/scripts/importDatabase.ts)
- Modelos: [backend/src/models/](backend/src/models/)
- Package.json: [backend/package.json](backend/package.json)
