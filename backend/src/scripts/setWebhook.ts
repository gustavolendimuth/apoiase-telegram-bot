#!/usr/bin/env tsx

/**
 * Script para configurar o webhook do Telegram Bot automaticamente
 *
 * Uso:
 *   npm run webhook:set https://seu-dominio.com
 *   npm run webhook:delete
 *   npm run webhook:info
 */

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

async function setWebhook(url: string): Promise<void> {
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN não configurado no .env');
    process.exit(1);
  }

  try {
    console.log(`🔄 Configurando webhook para: ${url}`);

    const response = await axios.post(`${TELEGRAM_API}/setWebhook`, {
      url: `${url}/webhook/telegram`,
      allowed_updates: ['message', 'chat_member'],
    });

    if (response.data.ok) {
      console.log('✅ Webhook configurado com sucesso!');
      console.log(`📍 URL: ${url}/webhook/telegram`);

      // Verificar configuração
      await getWebhookInfo();
    } else {
      console.error('❌ Erro ao configurar webhook:', response.data);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Erro ao configurar webhook:', error.message);
    if (error.response) {
      console.error('Detalhes:', error.response.data);
    }
    process.exit(1);
  }
}

async function deleteWebhook(): Promise<void> {
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN não configurado no .env');
    process.exit(1);
  }

  try {
    console.log('🔄 Removendo webhook...');

    const response = await axios.post(`${TELEGRAM_API}/deleteWebhook`);

    if (response.data.ok) {
      console.log('✅ Webhook removido com sucesso!');
      console.log('ℹ️  Bot agora está em modo polling (para desenvolvimento local)');
    } else {
      console.error('❌ Erro ao remover webhook:', response.data);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Erro ao remover webhook:', error.message);
    if (error.response) {
      console.error('Detalhes:', error.response.data);
    }
    process.exit(1);
  }
}

async function getWebhookInfo(): Promise<void> {
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN não configurado no .env');
    process.exit(1);
  }

  try {
    const response = await axios.get(`${TELEGRAM_API}/getWebhookInfo`);

    if (response.data.ok) {
      const info: WebhookInfo = response.data.result;

      console.log('\n📊 Informações do Webhook:');
      console.log('─────────────────────────────────────');
      console.log(`URL: ${info.url || '(não configurado - modo polling)'}`);
      console.log(`Atualizações pendentes: ${info.pending_update_count}`);

      if (info.last_error_date) {
        const errorDate = new Date(info.last_error_date * 1000);
        console.log(`⚠️  Último erro: ${errorDate.toLocaleString()}`);
        console.log(`   Mensagem: ${info.last_error_message}`);
      } else {
        console.log('✅ Sem erros recentes');
      }

      console.log('─────────────────────────────────────\n');
    } else {
      console.error('❌ Erro ao obter informações:', response.data);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Erro ao obter informações:', error.message);
    if (error.response) {
      console.error('Detalhes:', error.response.data);
    }
    process.exit(1);
  }
}

async function testBot(): Promise<void> {
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN não configurado no .env');
    process.exit(1);
  }

  try {
    const response = await axios.get(`${TELEGRAM_API}/getMe`);

    if (response.data.ok) {
      const bot = response.data.result;
      console.log('\n🤖 Informações do Bot:');
      console.log('─────────────────────────────────────');
      console.log(`Nome: ${bot.first_name}`);
      console.log(`Username: @${bot.username}`);
      console.log(`ID: ${bot.id}`);
      console.log(`É bot: ${bot.is_bot ? 'Sim' : 'Não'}`);
      console.log('─────────────────────────────────────\n');
    } else {
      console.error('❌ Erro ao obter informações do bot:', response.data);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Erro ao conectar com Telegram API:', error.message);
    if (error.response) {
      console.error('Detalhes:', error.response.data);
    }
    process.exit(1);
  }
}

// CLI
const command = process.argv[2];
const url = process.argv[3];

async function main() {
  switch (command) {
    case 'set':
      if (!url) {
        console.error('❌ Uso: npm run webhook:set <URL>');
        console.error('   Exemplo: npm run webhook:set https://abc123.ngrok.io');
        process.exit(1);
      }
      await setWebhook(url);
      break;

    case 'delete':
      await deleteWebhook();
      break;

    case 'info':
      await getWebhookInfo();
      break;

    case 'test':
      await testBot();
      break;

    default:
      console.log('📋 Comandos disponíveis:');
      console.log('  npm run webhook:set <URL>    - Configurar webhook');
      console.log('  npm run webhook:delete       - Remover webhook (modo polling)');
      console.log('  npm run webhook:info         - Ver informações do webhook');
      console.log('  npm run webhook:test         - Testar conexão com bot');
      console.log('');
      console.log('Exemplos:');
      console.log('  npm run webhook:set https://abc123.ngrok.io');
      console.log('  npm run webhook:delete');
      process.exit(0);
  }
}

main();
