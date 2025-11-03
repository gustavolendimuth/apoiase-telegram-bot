"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useIntegrations } from "@/hooks/useIntegrations";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Modal } from "@/components/ui";
import api from "@/lib/api";

interface Campaign {
  _id: string;
  title: string;
  slug: string;
  description: string;
  goal: number;
  raised: number;
  currency: string;
  category: string;
  imageUrl: string;
  supporters: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  rewardLevels: RewardLevel[];
  createdAt: string;
  updatedAt: string;
}

interface RewardLevel {
  id: string;
  title: string;
  amount: number;
  description: string;
  benefits: string[];
}

export default function IntegracoesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loadingCampaign, setLoadingCampaign] = useState(true);
  const [error, setError] = useState('');

  const { integrations, loading, createIntegration, updateIntegration, deleteIntegration, toggleIntegration } = useIntegrations(campaignId || '');

  const [formData, setFormData] = useState({
    telegramGroupId: "",
    telegramGroupTitle: "",
    rewardLevels: [] as string[],
  });

  useEffect(() => {
    if (!campaignId) {
      setError('ID da campanha não fornecido');
      setLoadingCampaign(false);
      return;
    }

    const fetchCampaign = async () => {
      try {
        setLoadingCampaign(true);
        const response = await api.get(`/api/campaigns/${campaignId}`);
        setCampaign(response.data);
        setError('');
      } catch (err: any) {
        console.error('Error fetching campaign:', err);
        setError(err.response?.data?.error || 'Erro ao carregar campanha');
      } finally {
        setLoadingCampaign(false);
      }
    };

    fetchCampaign();

    // Verificar se voltou do callback de integração
    const status = searchParams.get('status');
    const integrationId = searchParams.get('integration_id');
    const errorParam = searchParams.get('error');

    if (status === 'success' && integrationId) {
      // Mostrar mensagem de sucesso (você pode adicionar um toast/notificação aqui)
      console.log('Integração Telegram conectada com sucesso!', integrationId);
      // Limpar URL
      window.history.replaceState({}, '', `/profile/campaign?campaignId=${campaignId}`);
    } else if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Limpar URL
      window.history.replaceState({}, '', `/profile/campaign?campaignId=${campaignId}`);
    }
  }, [campaignId]);

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      art: 'Arte',
      music: 'Música',
      technology: 'Tecnologia',
      education: 'Educação',
      social: 'Social',
      games: 'Games',
      podcasts: 'Podcasts',
      videos: 'Vídeos',
      other: 'Outros',
    };
    return categoryMap[category] || category;
  };

  const handleConnectTelegram = async () => {
    if (!campaign) return;

    try {
      setError('');

      // Chamar endpoint do APOIA.se que inicia o fluxo OAuth
      const response = await api.post(`/api/campaigns/${campaign.slug}/integrations/telegram`);

      if (response.data.success && response.data.redirectUrl) {
        // Redirecionar para serviço de integração
        window.location.href = response.data.redirectUrl;
      }
    } catch (err: any) {
      console.error('Erro ao conectar Telegram:', err);
      setError(err.response?.data?.error || 'Erro ao iniciar integração');
    }
  };

  const handleCreateIntegration = async () => {
    if (!formData.telegramGroupId || formData.rewardLevels.length === 0) {
      return;
    }

    await createIntegration({
      campaignId,
      telegramGroupId: formData.telegramGroupId,
      rewardLevels: formData.rewardLevels,
    });

    setShowCreateModal(false);
    setFormData({ telegramGroupId: "", telegramGroupTitle: "", rewardLevels: [] });
  };

  const handleToggleIntegration = async (id: string, currentStatus: boolean) => {
    await toggleIntegration(id, !currentStatus);
  };

  if (loadingCampaign) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ed5544] mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando campanha...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {error || 'Campanha não encontrada'}
            </h3>
            <button
              onClick={() => router.push('/minhas-campanhas')}
              className="px-6 py-3 bg-[#ed5544] text-white rounded-lg hover:bg-[#d64435] transition-colors font-semibold"
            >
              Voltar para minhas campanhas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Campaign Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-start gap-4">
            {/* Campaign Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {campaign.imageUrl ? (
                  <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 text-3xl font-bold">📊</div>
                )}
              </div>
            </div>

            {/* Campaign Info */}
            <div className="flex-grow min-w-0">
              <div className="flex items-start gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {campaign.title}
                </h1>
                <button
                  onClick={() => router.push(`/campanha/${campaign.slug}`)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 text-base mb-3">
                {campaign.description}
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  {getCategoryLabel(campaign.category)}
                </span>
              </div>
            </div>

            {/* Tutorial Button */}
            <button className="flex-shrink-0 px-4 py-2 bg-white border-2 border-[#ed5544] text-[#ed5544] rounded-md hover:bg-red-50 transition-colors font-medium text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Usar tutorial passo-a-passo para criação de campanhas do zero
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            <button className="px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 font-medium whitespace-nowrap text-base">
              Configuração
            </button>
            <button className="px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 font-medium whitespace-nowrap text-base">
              Identificação
            </button>
            <button className="px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 font-medium whitespace-nowrap text-base">
              Descrição
            </button>
            <button className="px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 font-medium whitespace-nowrap text-base">
              Metas
            </button>
            <button className="px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 font-medium whitespace-nowrap text-base">
              Recompensas
            </button>
            <button className="px-4 py-3 border-b-2 border-[#ed5544] text-[#ed5544] font-medium whitespace-nowrap text-base">
              Integrações
            </button>
            <button className="px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 font-medium whitespace-nowrap text-base">
              Publicação
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Integrações</h2>
          <p className="text-gray-600">
            Use aplicativos internos para expandir sua comunidade
          </p>
        </div>

        {/* Spotify Integration Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="p-6 flex items-start gap-6">
            {/* Spotify Icon */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
            </div>

            {/* Integration Info */}
            <div className="flex-grow">
              <div className="flex items-start justify-between">
                <div className="flex-grow pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">Spotify</h3>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">Beta</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    Ao integrar a campanha com o Spotify, seus posts de áudios exclusivos poderão ser acessados por seus apoiadores em dia diretamente no APP do Spotify e também aparecerão bloqueados para quem ainda não é apoiador, o que é uma ótima maneira de ganhar novos assinantes.
                  </p>
                </div>

                {/* Connect Button */}
                <div className="flex-shrink-0">
                  <button className="px-5 py-2 bg-[#ed5544] hover:bg-[#d64435] text-white rounded font-medium text-sm transition-colors">
                    Conectar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Integration Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="p-6 flex items-start gap-6">
            {/* Telegram Icon */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-1.953 9.216-2.762 12.226-.342 1.271-.678 1.697-1.113 1.738-.945.087-1.663-.625-2.577-1.225-1.431-.937-2.24-1.521-3.63-2.434-1.606-1.056-.565-1.637.351-2.585.24-.249 4.397-4.031 4.478-4.373.01-.043.02-.203-.076-.288-.095-.085-.234-.056-.335-.033-.143.032-2.421 1.538-6.834 4.516-.647.445-1.233.661-1.759.65-.579-.013-1.692-.327-2.521-.596-.867-.29-1.556-.443-1.495-.935.032-.256.38-.518.985-.787 3.861-1.683 6.434-2.795 7.72-3.333 3.677-1.531 4.442-1.798 4.939-1.806.109-.002.354.025.513.154.134.109.171.256.189.36.018.103.041.339.023.523z"/>
                </svg>
              </div>
            </div>

            {/* Integration Info */}
            <div className="flex-grow">
              <div className="flex items-start justify-between">
                <div className="flex-grow pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">Telegram</h3>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">Beta</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    Ao integrar a campanha com o Telegram, seus posts de áudios exclusivos poderão ser acessados por seus
                    apoiadores em dia diretamente no APP do Telegram e também aparecerão bloqueados para quem ainda não é
                    apoiador, o que é uma ótima maneira de ganhar novos assinantes.
                  </p>
                </div>

                {/* Connect Button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={handleConnectTelegram}
                    className="px-5 py-2 bg-[#ed5544] hover:bg-[#d64435] text-white rounded font-medium text-sm transition-colors"
                  >
                    Conectar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Integrations List */}
          {integrations.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Grupos conectados</h4>
                <div className="space-y-3">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-1.953 9.216-2.762 12.226-.342 1.271-.678 1.697-1.113 1.738-.945.087-1.663-.625-2.577-1.225-1.431-.937-2.24-1.521-3.63-2.434-1.606-1.056-.565-1.637.351-2.585.24-.249 4.397-4.031 4.478-4.373.01-.043.02-.203-.076-.288-.095-.085-.234-.056-.335-.033-.143.032-2.421 1.538-6.834 4.516-.647.445-1.233.661-1.759.65-.579-.013-1.692-.327-2.521-.596-.867-.29-1.556-.443-1.495-.935.032-.256.38-.518.985-.787 3.861-1.683 6.434-2.795 7.72-3.333 3.677-1.531 4.442-1.798 4.939-1.806.109-.002.354.025.513.154.134.109.171.256.189.36.018.103.041.339.023.523z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {integration.telegramGroupTitle || integration.telegramGroupId}
                          </div>
                          <div className="text-sm text-gray-500">
                            {integration.telegramGroupType === 'channel' ? 'Canal' : 'Grupo'} • {integration.rewardLevels.length} recompensas
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={integration.isActive ? "success" : "default"}>
                          {integration.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <button
                          onClick={() => handleToggleIntegration(integration.id, integration.isActive)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Learn More Link */}
        <div className="mt-8 pb-8 border-b border-gray-200">
          <a
            href="#"
            className="text-[#ed5544] hover:text-[#d64435] font-medium inline-flex items-center gap-1 text-sm"
          >
            Saiba mais
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-8 pb-16">
          <button className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded font-semibold text-sm transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Salvar
          </button>
        </div>
      </div>

      {/* Create Integration Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Conectar grupo do Telegram
            </h3>
            <p className="text-gray-600 mb-6">
              Adicione o bot @ApoiaseBot como administrador do seu grupo e preencha as informações abaixo.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID do Grupo/Canal do Telegram
                </label>
                <input
                  type="text"
                  value={formData.telegramGroupId}
                  onChange={(e) => setFormData({ ...formData, telegramGroupId: e.target.value })}
                  placeholder="-100XXXXXXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ed5544] focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use @RawDataBot no seu grupo para descobrir o ID
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Níveis de recompensa com acesso
                </label>
                {campaign.rewardLevels && campaign.rewardLevels.length > 0 ? (
                  <div className="space-y-2">
                    {campaign.rewardLevels.map((level) => (
                      <label key={level.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.rewardLevels.includes(level.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, rewardLevels: [...formData.rewardLevels, level.id] });
                            } else {
                              setFormData({ ...formData, rewardLevels: formData.rewardLevels.filter((l) => l !== level.id) });
                            }
                          }}
                          className="rounded border-gray-300 text-[#ed5544] focus:ring-[#ed5544]"
                        />
                        <span className="text-gray-700">
                          {level.title} - {campaign.currency} {level.amount.toLocaleString()}/mês
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm py-2">
                    Nenhum nível de recompensa configurado. Configure os níveis de recompensa primeiro na aba "Recompensas".
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateIntegration}
                disabled={!formData.telegramGroupId || formData.rewardLevels.length === 0}
                className="flex-1 bg-[#ed5544] hover:bg-[#d64435] text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Conectar grupo
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
