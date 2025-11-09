# 🤖 Como Adicionar o Bot ao Grupo do Telegram

Este guia explica passo a passo como adicionar o bot do Telegram ao seu grupo para dar acesso aos apoiadores do APOIA.se.

---

## 📋 Passo a Passo

### 1. Obter o Username do Bot

O username do bot é configurado quando você cria o bot com o @BotFather. Você pode encontrá-lo:
- Na mensagem de confirmação do BotFather
- Ou verificar no endpoint `/api/bot/info` (retorna `botUsername`)

### 2. Adicionar o Bot ao Grupo

**Opção A: Via Link Direto**
1. Acesse: `https://t.me/SEU_BOT_USERNAME` (substitua `SEU_BOT_USERNAME` pelo username do seu bot)
2. Clique em "Iniciar" ou "Start"
3. Clique nos três pontos (⋮) no canto superior direito
4. Selecione "Adicionar ao Grupo" ou "Add to Group"
5. Escolha o grupo onde deseja adicionar o bot

**Opção B: Diretamente do Grupo**
1. Abra o grupo do Telegram no qual deseja adicionar o bot
2. Toque no nome do grupo no topo para abrir as configurações
3. Vá em "Adicionar Participantes" ou "Add Members"
4. Procure pelo username do bot (ex: `@meu_bot`)
5. Selecione o bot e confirme

### 3. Promover o Bot a Administrador

⚠️ **IMPORTANTE**: O bot DEVE ser administrador para funcionar corretamente!

1. No grupo, vá em **Configurações do Grupo** → **Administradores**
2. Toque em **"Adicionar Administrador"** ou **"Add Admin"**
3. Selecione o bot
4. Configure as permissões (veja abaixo)

### 4. Configurar Permissões do Bot

O bot precisa das seguintes permissões:

- ✅ **Gerenciar membros** (obrigatório)
  - Permite que o bot convide e remova membros
- ✅ **Criar links de convite** (obrigatório)
  - Permite que o bot gere links de convite para os apoiadores
- ✅ **Banir usuários** (recomendado)
  - Permite que o bot remova membros quando necessário

**Como configurar:**
1. Ao promover o bot a administrador, você verá uma lista de permissões
2. Ative as permissões mencionadas acima
3. Salve as alterações

### 5. Verificar se o Bot Foi Detectado

Após adicionar o bot ao grupo:

1. **Envie uma mensagem qualquer no grupo** (isso ajuda o bot a detectar o grupo)
2. Volte para a página de integração no frontend
3. Clique em **"Recarregar Grupos"**
4. O grupo deve aparecer na lista de grupos disponíveis

---

## 🎯 Fluxo de Integração Completo

1. **Iniciar Integração**
   - Clique em "Conectar" na página de configurações da campanha
   - Será redirecionado para a página de autorização

2. **Autenticar com Telegram**
   - Faça login com sua conta do Telegram usando o botão do Telegram Login Widget

3. **Adicionar Bot ao Grupo** (se necessário)
   - Se não houver grupos disponíveis, siga os passos acima
   - Depois clique em "Recarregar Grupos"

4. **Selecionar o Grupo**
   - Escolha o grupo onde o bot já está como administrador
   - Clique em "Conectar Grupo"

5. **Finalizar Integração**
   - Revise as informações
   - Clique em "Finalizar Integração"

---

## ❓ Troubleshooting

### O bot não aparece na lista de grupos disponíveis

**Possíveis causas:**
- O bot não foi adicionado ao grupo
- O bot não é administrador do grupo
- O bot não tem as permissões necessárias
- O bot ainda não detectou o grupo (envie uma mensagem no grupo)

**Solução:**
1. Verifique se o bot está no grupo e é administrador
2. Verifique se as permissões estão configuradas corretamente
3. Envie uma mensagem no grupo
4. Clique em "Recarregar Grupos" na interface

### Erro: "Bot não tem permissão para convidar usuários"

**Solução:**
1. Vá nas configurações do grupo → Administradores
2. Selecione o bot
3. Ative a permissão "Criar links de convite"
4. Ative a permissão "Gerenciar membros"

### Erro: "Grupo não encontrado"

**Solução:**
- O bot precisa receber pelo menos uma atualização do grupo (mensagem ou evento)
- Envie uma mensagem no grupo ou faça alguma ação que gere um evento
- Recarregue a lista de grupos

---

## 🔗 Links Úteis

- [Documentação do Telegram Bot API](https://core.telegram.org/bots/api)
- [Guia de Permissões de Administrador](https://core.telegram.org/bots/api#chatmemberadministrator)
- [Como criar um bot no Telegram](https://core.telegram.org/bots/tutorial)

---

## 📝 Notas Importantes

- O bot só pode gerenciar grupos onde ele é administrador
- O bot precisa estar online e rodando para funcionar
- Grupos privados precisam ter o bot como administrador desde o início
- Canais não são suportados (apenas grupos e supergrupos)


