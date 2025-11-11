'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { campaignApi, integrationAuthApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { TelegramGroupSelector } from '@/components/TelegramGroupSelector';
import { SupportLevelSelector } from '@/components/SupportLevelSelector';
import { useAuth } from '@/hooks/useAuth';

interface RewardLevel {
  id: string;
  title: string;
  amount: number;
  description: string;
  benefits: string[];
}

interface SessionData {
  stateToken: string;
  campaignSlug: string;
  status: string;
  telegramUserId?: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  selectedGroupId?: string;
  selectedGroupTitle?: string;
  selectedMinSupportLevel?: string;
  expiresAt: string;
  isValid: boolean;
  redirectUri?: string;
}

function IntegrationAuthorizePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateToken, setStateToken] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [campaignData, setCampaignData] = useState<{ rewardLevels: RewardLevel[] } | null>(null);
  const [campaignTitle, setCampaignTitle] = useState<string>('');
  const [step, setStep] = useState<'init' | 'telegram_auth' | 'select_group' | 'select_min_support_level' | 'complete'>('init');

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
      const response = await integrationAuthApi.initiateAuth({
        campaign_slug: campaignSlug,
        api_key: apiKey,
        bearer_token: bearerToken,
        redirect_uri: redirectUri,
      });

      if (response.data.success) {
        const token = response.data.data.stateToken;
        setStateToken(token);

        // Carregar dados da sessão
        await loadSession(token);

        // Carregar dados da campanha (incluindo níveis de apoio)
        await loadCampaignData(campaignSlug);

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
      const response = await integrationAuthApi.getSession(token);

      if (response.data.success) {
        setSession(response.data.data.session);

        // Determinar step atual baseado no status da sessão
        if (response.data.data.session.status === 'telegram_auth_complete') {
          setStep('select_group');
        } else if (response.data.data.session.status === 'group_selected') {
          setStep('select_min_support_level');
        } else if (response.data.data.session.status === 'min_support_level_selected') {
          setStep('complete');
        }
      }
    } catch (err) {
      console.error('Erro ao carregar sessão:', err);
    }
  };

  const loadCampaignData = async (campaignSlug: string) => {
    try {
      const response = await campaignApi.getBySlug(campaignSlug);

      // Bug corrigido: response.data agora tem estrutura { success: true, data: ICampaign }
      if (response.data.success) {
        setCampaignData({
          rewardLevels: response.data.data.rewardLevels || [],
        });
        setCampaignTitle(response.data.data.title || '');
      } else {
        console.error('Erro ao carregar campanha:', response.data.error);
        setCampaignData({ rewardLevels: [] });
      }
    } catch (err) {
      console.error('Erro ao carregar dados da campanha:', err);
      // Não bloqueia o fluxo se não conseguir carregar
      setCampaignData({ rewardLevels: [] });
    }
  };

  const handleTelegramAuth = async (user: any) => {
    try {
      if (!stateToken) return;

      setLoading(true);

      await integrationAuthApi.telegramAuth(stateToken, user);

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

  const handleMinSupportLevelSelected = async (minLevelId: string | null) => {
    try {
      if (!stateToken) return;

      setLoading(true);

      // Se nenhum nível foi selecionado, ir direto para complete
      if (minLevelId === null) {
        setStep('complete');
        setLoading(false);
        return;
      }

      await integrationAuthApi.post('/select-min-support-level', {
        stateToken,
        minSupportLevel: minLevelId,
      });

      // Recarregar sessão
      await loadSession(stateToken);
      setStep('complete');
    } catch (err: any) {
      console.error('Erro ao selecionar nível mínimo de apoio:', err);
      setError(err.response?.data?.error || 'Erro ao selecionar nível mínimo de apoio');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      if (stateToken) {
        await api.post('/api/integration/cancel', { stateToken });
      }

      // Tentar fechar a janela (funciona se foi aberta via window.open)
      if (window.opener) {
        window.close();
      } else {
        // Se não for popup, redirecionar para minhas campanhas
        router.push('/minhas-campanhas');
      }
    } catch (err) {
      console.error('Erro ao cancelar:', err);

      // Em caso de erro, também tentar fechar ou redirecionar
      if (window.opener) {
        window.close();
      } else {
        router.push('/minhas-campanhas');
      }
    }
  };

  const handleCloseError = () => {
    // Função para fechar quando há erro (não tenta cancelar via API)
    if (window.opener) {
      window.close();
    } else {
      router.push('/minhas-campanhas');
    }
  };

  useEffect(() => {
    // Carregar script do Telegram Login Widget
    if (step === 'telegram_auth' && typeof window !== 'undefined') {
      const loadTelegramWidget = async () => {
        let botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

        // Se não estiver configurado na variável de ambiente, tentar buscar do backend
        if (!botUsername) {
          try {
            const response = await api.get('/api/bot/info');
            if (response.data.botUsername) {
              botUsername = response.data.botUsername;
            }
          } catch (err) {
            console.error('Erro ao obter bot username do backend:', err);
          }
        }

        // Validar se o bot username está disponível
        if (!botUsername) {
          setError('Bot username não configurado. Por favor, configure NEXT_PUBLIC_TELEGRAM_BOT_USERNAME nas variáveis de ambiente do frontend ou verifique se o bot está configurado no backend.');
          setLoading(false);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', botUsername);
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
      };

      loadTelegramWidget();
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
          <Button onClick={handleCloseError} variant="outline" fullWidth>
            Fechar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 p-4">
      <Card className="max-w-lg w-full p-6 mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Conectar Grupo Telegram
          </h1>
          <p className="text-gray-600">
            Campanha: <span className="font-semibold">{campaignTitle || session?.campaignSlug}</span>
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
                setStep('select_min_support_level');
              }}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Step 3: Select Minimum Support Level */}
        {step === 'select_min_support_level' && campaignData && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-500">✓</span>
                <h2 className="font-semibold text-green-900">Grupo Selecionado</h2>
              </div>
              <p className="text-sm text-green-700">{session?.selectedGroupTitle}</p>
            </div>

            <SupportLevelSelector
              campaignSlug={session?.campaignSlug || ''}
              rewardLevels={campaignData.rewardLevels}
              onLevelSelected={handleMinSupportLevelSelected}
              onCancel={() => setStep('select_group')}
            />
          </div>
        )}

        {/* Step 4: Complete */}
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

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-500">✓</span>
            <h2 className="font-semibold text-green-900">Nível Mínimo de Apoio</h2>
          </div>
          {session?.selectedMinSupportLevel ? (
            <p className="text-sm text-green-700">
              Configurado (este nível e superiores terão acesso)
            </p>
          ) : (
            <p className="text-sm text-green-700">
              Todos os apoiadores terão acesso
            </p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Passo 4: Finalizar Integração</h2>
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

export default function IntegrationAuthorizePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <IntegrationAuthorizePageContent />
    </Suspense>
  );
}
