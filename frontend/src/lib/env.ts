/**
 * Utilitário para processar URLs de variáveis de ambiente no frontend
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
  // No Next.js, NODE_ENV pode não estar disponível no cliente, então verificamos também NEXT_PUBLIC_NODE_ENV
  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    process.env.NEXT_PUBLIC_NODE_ENV === 'production';
  
  const protocol = isProduction ? 'https://' : 'http://';
  
  return `${protocol}${urlToProcess}`;
}

/**
 * Obtém a URL da API processada
 */
export function getApiUrl(): string {
  return processEnvUrl(process.env.NEXT_PUBLIC_API_URL, 'localhost:3001');
}

/**
 * Obtém a URL do APOIA.se processada
 */
export function getApoiaseUrl(): string {
  return processEnvUrl(process.env.NEXT_PUBLIC_APOIASE_URL, 'apoia.se');
}

