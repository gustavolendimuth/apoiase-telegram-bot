/** @type {import('next').NextConfig} */

// Helper function para processar URLs de ambiente
function processEnvUrl(url, defaultUrl) {
  const urlToProcess = url || defaultUrl || '';
  
  if (!urlToProcess) {
    return '';
  }

  // Se já tem protocolo, retorna como está
  if (/^https?:\/\//i.test(urlToProcess)) {
    return urlToProcess;
  }

  // Determina o protocolo baseado no ambiente
  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    process.env.NEXT_PUBLIC_NODE_ENV === 'production';
  
  const protocol = isProduction ? 'https://' : 'http://';
  
  return `${protocol}${urlToProcess}`;
}

const apiUrl = processEnvUrl(process.env.NEXT_PUBLIC_API_URL, 'localhost:3001');

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
