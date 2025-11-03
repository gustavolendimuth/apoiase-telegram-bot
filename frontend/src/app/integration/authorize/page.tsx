'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { TelegramGroupSelector } from '@/components/TelegramGroupSelector';
import { useAuth } from '@/hooks/useAuth';

interface SessionData {
  stateToken: string;
  campaignSlug: string;
  status: string;
  telegramUserId?: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  selectedGroupId?: string;
  selectedGroupTitle?: string;
  expiresAt: string;
  isValid: boolean;
  redirectUri?: string;
}

export default function IntegrationAuthorizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateToken, setStateToken] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [step, setStep] = useState<'init' | 'telegram_auth' | 'select_group' | 'complete'>('init');

  useEffect(() => {
    initializeAuth();
  }, [searchParams]);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obter parâmetros OAuth da URL
      const campaignSlug = searchParams.get('campaign_slug');
      const apiKey = searchParams.get('api_key');
      const bearerToken = searchParams.get('bearer_token');
      const redirectUri = searchParams.get('redirect_uri');

      if (!campaignSlug || !apiKey || !bearerToken || !redirectUri) {
        setError('Parâmetros obrigatórios ausentes na URL');
        setLoading(false);
        return;
      }

      // Iniciar autorização OAuth-like
      const response = await api.get('/api/integration/authorize', {
        params: {
          campaign_slug: campaignSlug,
          api_key: apiKey,
          bearer_token: bearerToken,
          redirect_uri: redirectUri,
        },
      });

      if (response.data.success) {
        const token = response.data.stateToken;
        setStateToken(token);

        // Carregar dados da sessão
        await loadSession(token);

        setStep('telegram_auth');
      } else {
        setError(response.data.error || 'Erro ao iniciar autorização');
      }
    } catch (err: any) {
      console.error('Erro ao inicializar autorização:', err);
      setError(err.response?.data?.error || 'Erro ao iniciar autorização');
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (token: string) => {
    try {
      const response = await api.get(`/api/integration/session/${token}`);
      setSession(response.data);

      // Determinar step atual baseado no status da sessão
      if (response.data.status === 'telegram_auth_complete') {
        setStep('select_group');
      } else if (response.data.status === 'group_selected') {
        setStep('complete');
      }
    } catch (err) {
      console.error('Erro ao carregar sessão:', err);
    }
  };

  const handleTelegramAuth = async (user: any) => {
    try {
      if (!stateToken) return;

      setLoading(true);

      await api.post('/api/integration/telegram-auth', {
        stateToken,
        ...user,
      });

      // Recarregar sessão
      await loadSession(stateToken);
      setStep('select_group');
    } catch (err: any) {
      console.error('Erro ao processar Telegram auth:', err);
      setError(err.response?.data?.error || 'Erro ao autenticar com Telegram');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      if (stateToken) {
        await api.post('/api/integration/cancel', { stateToken });
      }
      window.close();
    } catch (err) {
      console.error('Erro ao cancelar:', err);
      window.close();
    }
  };

  useEffect(() => {
    // Carregar script do Telegram Login Widget
    if (step === 'telegram_auth' && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-request-access', 'write');
      script.async = true;

      // Callback global para o widget
      (window as any).onTelegramAuth = handleTelegramAuth;
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');

      const container = document.getElementById('telegram-login-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(script);
      }
    }
  }, [step, stateToken]);

  if (loading && step === 'init') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">✗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro na Integração</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleCancel} variant="outline" fullWidth>
            Fechar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Conectar Grupo Telegram
          </h1>
          <p className="text-gray-600">
            Campanha: <span className="font-semibold">{session?.campaignSlug}</span>
          </p>
        </div>

        {/* Step 1: Telegram Login */}
        {step === 'telegram_auth' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 mb-2">
                Passo 1: Autentique com o Telegram
              </h2>
              <p className="text-sm text-blue-700 mb-4">
                Clique no botão abaixo para fazer login com sua conta do Telegram.
              </p>
            </div>

            <div className="flex justify-center py-4">
              <div id="telegram-login-container"></div>
            </div>

            {loading && (
              <div className="flex justify-center">
                <Loading />
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleCancel} variant="outline" fullWidth>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Group */}
        {step === 'select_group' && stateToken && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-500">✓</span>
                <h2 className="font-semibold text-green-900">
                  Autenticado com Telegram
                </h2>
              </div>
              <p className="text-sm text-green-700">
                Olá, {session?.telegramFirstName}! Agora selecione o grupo.
              </p>
            </div>

            <TelegramGroupSelector
              stateToken={stateToken}
              onGroupSelected={async () => {
                await loadSession(stateToken);
                setStep('complete');
              }}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && (
          <CompleteIntegration
            stateToken={stateToken!}
            session={session}
            onCancel={handleCancel}
          />
        )}
      </Card>
    </div>
  );
}

// Componente para finalizar integração
function CompleteIntegration({
  stateToken,
  session,
  onCancel,
}: {
  stateToken: string;
  session: SessionData | null;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/api/integration/complete', {
        stateToken,
      });

      if (response.data.success) {
        setSuccess(true);

        // Construir callback URL
        const integrationId = response.data.integrationId;
        const redirectUri = session?.redirectUri;

        if (redirectUri) {
          const callbackUrl = new URL(redirectUri);
          callbackUrl.searchParams.set('state', stateToken);
          callbackUrl.searchParams.set('status', 'success');
          callbackUrl.searchParams.set('integration_id', integrationId);

          // Redirecionar para callback do APOIA.se após 2 segundos
          setTimeout(() => {
            window.location.href = callbackUrl.toString();
          }, 2000);
        } else {
          // Fallback: redirecionar para minhas campanhas
          setTimeout(() => {
            window.location.href = '/minhas-campanhas';
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error('Erro ao finalizar integração:', err);
      setError(err.response?.data?.error || 'Erro ao finalizar integração');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="text-green-500 text-6xl">✓</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Integração Concluída!</h2>
          <p className="text-gray-600">
            Seu grupo Telegram foi conectado com sucesso à campanha.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-green-900 mb-2">Próximos passos:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
            <li>Apoiadores poderão solicitar acesso ao grupo</li>
            <li>O bot verificará automaticamente o status de pagamento</li>
            <li>Membros inativos serão removidos após o período de carência</li>
          </ul>
        </div>
        <p className="text-sm text-gray-500">Redirecionando para suas campanhas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-500">✓</span>
            <h2 className="font-semibold text-green-900">Autenticado com Telegram</h2>
          </div>
          <p className="text-sm text-green-700">
            {session?.telegramFirstName} (@{session?.telegramUsername})
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-500">✓</span>
            <h2 className="font-semibold text-green-900">Grupo Selecionado</h2>
          </div>
          <p className="text-sm text-green-700">{session?.selectedGroupTitle}</p>
          <p className="text-xs text-green-600 mt-1">ID: {session?.selectedGroupId}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Passo 3: Finalizar Integração</h2>
        <p className="text-sm text-blue-700 mb-3">
          Clique em "Finalizar" para completar a integração entre sua campanha e o grupo Telegram.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" onClick={onCancel} variant="outline" fullWidth disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleComplete}
          fullWidth
          disabled={loading}
        >
          {loading ? 'Finalizando...' : 'Finalizar Integração'}
        </Button>
      </div>
    </div>
  );
}
