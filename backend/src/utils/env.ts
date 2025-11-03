/**
 * Utilitário para processar URLs de variáveis de ambiente
 * Adiciona automaticamente o protocolo correto baseado no ambiente:
 * - http:// para desenvolvimento (NODE_ENV !== 'production')
 * - https:// para produção (NODE_ENV === 'production')
 */

/**
 * Processa uma URL adicionando o protocolo correto se necessário
 * @param url - URL que pode ou não ter protocolo
 * @param defaultUrl - URL padrão caso a url seja vazia ou undefined
 * @returns URL com protocolo correto
 */
export function processEnvUrl(url: string | undefined, defaultUrl?: string): string {
  const urlToProcess = url || defaultUrl || '';
  
  if (!urlToProcess) {
    return '';
  }

  // Se já tem protocolo, retorna como está
  if (/^https?:\/\//i.test(urlToProcess)) {
    return urlToProcess;
  }

  // Determina o protocolo baseado no ambiente
  const protocol = process.env.NODE_ENV === 'production' ? 'https://' : 'http://';
  
  return `${protocol}${urlToProcess}`;
}

/**
 * Obtém a URL da API processada
 */
export function getApiUrl(): string {
  return processEnvUrl(process.env.API_URL, 'localhost:3001');
}

/**
 * Obtém a URL do frontend processada
 */
export function getFrontendUrl(): string {
  return processEnvUrl(process.env.FRONTEND_URL, 'localhost:3000');
}

/**
 * Obtém a URL do webhook do Telegram processada
 */
export function getTelegramWebhookUrl(): string {
  return processEnvUrl(process.env.TELEGRAM_WEBHOOK_URL);
}

