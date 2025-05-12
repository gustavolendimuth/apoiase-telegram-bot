# Apoia.se Telegram Bot

Este projeto é um monorepo para um MVP de integração entre a plataforma de financiamento coletivo [Apoia.se](https://apoia.se/) e grupos privados do Telegram, permitindo liberar ou remover o acesso de apoiadores a grupos como recompensa de apoio recorrente.

## Estrutura do Projeto

```
/apoiase-telegram-bot
  /bot                # Bot do Telegram (Python)
  /api                # API (FastAPI, Python)
  /db                 # Migrações Alembic e configs do banco
  docker-compose.yml  # Orquestração dos serviços
  README.md           # Documentação
  .env.example        # Exemplo de variáveis de ambiente
  pyproject.toml      # Configuração de formatadores/linters
  .flake8             # Configuração do flake8
```

## Tecnologias Utilizadas

- Python 3.11+
- FastAPI
- python-telegram-bot
- PostgreSQL (última versão estável)
- Alembic (migrações do banco)
- Docker & Docker Compose
- Loguru (logs estruturados)
- JWT (autenticação)
- black, flake8, isort (formatação e lint)
- pytest (testes)

## Como funciona o projeto

O objetivo deste projeto é liberar (ou remover) o acesso de apoiadores recorrentes do Apoia.se a grupos privados do Telegram, de acordo com o status do apoio em cada campanha.

### Fluxo geral

1. **Cadastro e vínculo**

   - O criador cadastra sua campanha e grupo do Telegram.
   - O apoiador, após apoiar, interage com o bot do Telegram e faz o vínculo do seu usuário ao apoio (via comando/código).
   - O bot consulta a API para validar o apoio e salva o vínculo no banco.

2. **Checagem ativa (acesso imediato)**

   - Quando o apoiador interage com o bot, o bot consulta a API (e, se necessário, a API do Apoia.se) para validar o apoio em tempo real.
   - Se o apoio estiver ativo, o bot libera o acesso ao grupo imediatamente.

3. **Sincronização periódica (consistência)**
   - Um job agendado consulta periodicamente a API do Apoia.se para todas as campanhas.
   - O status dos apoiadores é atualizado no banco (ativo/inativo).
   - O bot pode ser notificado para remover quem deixou de apoiar ou adicionar novos apoiadores.

### Componentes principais

- **API (FastAPI):** expõe endpoints REST para campanhas, apoiadores, vínculo e checagem ativa. Gerencia o banco de dados e executa o job de sincronização.
- **Bot (python-telegram-bot):** interage com os usuários, faz o vínculo e libera ou remove acesso aos grupos.
- **Banco de dados (PostgreSQL):** armazena campanhas, apoiadores, vínculos e status.
- **Job de sincronização:** rotina que mantém o banco atualizado com a situação real dos apoiadores na plataforma Apoia.se.

### Resumo do fluxo

1. Usuário apoia uma campanha no Apoia.se.
2. Usuário interage com o bot do Telegram e faz o vínculo.
3. Bot consulta a API para validar e liberar acesso imediato.
4. Periodicamente, o job de sincronização garante que o banco reflete a situação real dos apoiadores.
5. O bot remove acesso de quem deixou de apoiar e mantém o grupo sempre atualizado.

## Como rodar o projeto

1. **Clone o repositório:**
   ```bash
   git clone <repo-url>
   cd apoiase-telegram-bot
   ```
2. **Configure as variáveis de ambiente:**
   - Copie `.env.example` para `.env` e preencha os valores necessários.
3. **Suba os serviços:**
   ```bash
   docker-compose up --build
   ```
4. **Acesse os serviços:**
   - API: http://localhost:8000
   - Bot: roda em background, logs no Docker
   - Banco: localhost:5432 (veja variáveis de ambiente)

## Testes

- Os testes estão localizados em `/bot/tests` e `/api/tests`.
- Para rodar todos os testes da API:
  ```bash
  docker-compose exec api pytest
  ```
- Os testes cobrem:
  - Listagem de campanhas e apoiadores
  - Vínculo de Telegram a apoiador
  - Checagem ativa de apoio
  - Job de sincronização simulando a API do Apoia.se
- Todos os testes devem passar para garantir que o fluxo do MVP está funcionando corretamente.

## Boas Práticas

- Código modular e seguro
- Uso de variáveis de ambiente para segredos
- Logs estruturados
- Testes automatizados
- Documentação sempre atualizada

## Contribuição

- Siga o padrão de código definido por black, flake8 e isort.
- Sempre escreva testes para novas funcionalidades.
- Atualize a documentação quando necessário.

## Diagrama do fluxo

```
Apoiador      Bot      API      Banco      Apoia.se
   |           |        |         |           |
   |---/start->|        |         |           |
   |<--mensagem|        |         |           |
   |---/vincular------->|         |           |
   |           |---POST /supporters/link----->|
   |           |        |         |           |
   |           |<--resposta------|           |
   |<--acesso liberado|          |           |
```

## Exemplos de payloads

### Vincular apoiador ao Telegram

```json
POST /supporters/link
{
  "campaign_id": 1,
  "supporter_id": 101,
  "telegram_id": 123456789
}
```

### Checar se usuário é apoiador ativo

```json
POST /supporters/check
{
  "campaign_id": 1,
  "telegram_id": 123456789
}
```

## Exemplo de uso do bot

1. O apoiador inicia o bot com `/start`.
2. O bot pede o código/campanha para vínculo.
3. O usuário envia o código ou seleciona a campanha.
4. O bot chama a API para validar e vincular.
5. Se aprovado, o bot libera o acesso ao grupo.

## Segurança

- Todas as credenciais e tokens são armazenados em variáveis de ambiente.
- A API utiliza JWT para autenticação de endpoints sensíveis.
- Comunicação entre serviços via rede interna Docker.
- Dados sensíveis nunca são expostos em logs ou respostas públicas.

## Como rodar o job de sincronização

```bash
docker-compose exec api python -m src.api.jobs.sync_apoia_se
```

## Como adicionar campanhas e apoiadores para testes

```bash
docker-compose exec api python -m src.api.jobs.seed_db
```

## Como acessar a documentação automática da API

- Acesse [http://localhost:8000/docs](http://localhost:8000/docs) para a documentação interativa (Swagger UI).
- Acesse [http://localhost:8000/redoc](http://localhost:8000/redoc) para a documentação ReDoc.

## Como contribuir

- Faça um fork do repositório e crie uma branch para sua feature/correção.
- Siga o padrão de código (black, flake8, isort).
- Sempre escreva testes para novas funcionalidades.
- Abra um Pull Request detalhando sua contribuição.

## Roadmap / Futuras melhorias

- Integração real com a API do Apoia.se.
- Webhook para acesso imediato (quando disponível na plataforma).
- Painel administrativo para criadores.
- Logs centralizados e painel de monitoramento.
- Deploy automatizado.

---

Para mais detalhes sobre cada serviço, veja os READMEs específicos em `/bot` e `/api` (a serem criados).
