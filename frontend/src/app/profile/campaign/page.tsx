"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useIntegrations } from "@/hooks/useIntegrations";
import { Badge, Modal } from "@/components/ui";
import { SupportLevelSelector } from "@/components/SupportLevelSelector";
import { campaignApi, integrationApi } from "@/lib/api";
import type { ICampaign, IIntegration } from 'shared';

type TabType = 'configuracao' | 'identificacao' | 'descricao' | 'metas' | 'recompensas' | 'integracoes' | 'publicacao';

function CampaignSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');

  const [activeTab, setActiveTab] = useState<TabType>('configuracao');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaign, setCampaign] = useState<ICampaign | null>(null);
  const [loadingCampaign, setLoadingCampaign] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingIntegrationId, setDisconnectingIntegrationId] = useState<string | null>(null);

  // Integration edit state
  const [editingIntegration, setEditingIntegration] = useState<string | null>(null);
  const [savingIntegration, setSavingIntegration] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: '',
    goal: 0,
    currency: 'BRL',
    imageUrl: '',
  });

  const { integrations, loading: integrationsLoading, deleteIntegration } = useIntegrations(campaignId || '');

  useEffect(() => {
    if (!campaignId) {
      setError('ID da campanha não fornecido');
      setLoadingCampaign(false);
      return;
    }

    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    if (!campaignId) return;

    try {
      setLoadingCampaign(true);
      const response = await campaignApi.getById(campaignId);
      console.log('📊 Campaign API Response:', response.data);

      // A resposta espalha as propriedades da campanha diretamente (ApiSuccessResponse<ICampaign>)
      const { success, ...campaignData } = response.data;
      console.log('📊 Campaign Data (after destructuring):', campaignData);
      console.log('📊 Campaign Title:', campaignData.title);

      setCampaign(campaignData as ICampaign);
      setEditFormData({
        title: campaignData.title,
        description: campaignData.description,
        category: campaignData.category,
        goal: campaignData.goal,
        currency: campaignData.currency,
        imageUrl: campaignData.imageUrl || '',
      });
      setError('');
    } catch (err: any) {
      console.error('Error fetching campaign:', err);
      setError(err.response?.data?.error || 'Erro ao carregar campanha');
    } finally {
      setLoadingCampaign(false);
    }
  };

  const handleConnectTelegram = async () => {
    if (!campaign?.slug) {
      setError('Slug da campanha não disponível');
      return;
    }

    try {
      setIsConnecting(true);
      setError('');

      // Chamar endpoint que gera credenciais temporárias e retorna URL de redirecionamento
      const response = await campaignApi.createTelegramIntegration(campaign.slug);

      if (response.data.success && response.data.redirectUrl) {
        // Redirecionar para a URL que contém todos os parâmetros necessários
        window.location.href = response.data.redirectUrl;
      } else {
        setError('Erro ao iniciar integração. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro ao conectar Telegram:', err);
      setError(err.response?.data?.error || 'Erro ao iniciar integração com Telegram');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectTelegram = async (integrationId: string) => {
    if (!confirm('Tem certeza que deseja desconectar esta integração? O bot sairá do grupo automaticamente.')) {
      return;
    }

    try {
      setDisconnectingIntegrationId(integrationId);
      setError('');

      const success = await deleteIntegration(integrationId);

      if (!success) {
        setError('Erro ao desconectar integração com Telegram');
      }
    } catch (err: any) {
      console.error('Erro ao desconectar Telegram:', err);
      setError('Erro ao desconectar integração com Telegram');
    } finally {
      setDisconnectingIntegrationId(null);
    }
  };

  const handleStartEdit = (integration: IIntegration) => {
    setEditingIntegration(integration._id);
  };

  const handleCancelEdit = () => {
    setEditingIntegration(null);
  };

  const handleSaveEdit = async (integrationId: string, minSupportLevel: string | null) => {
    try {
      setSavingIntegration(true);
      setError('');

      const updates: any = {
        minSupportLevel,
      };

      await integrationApi.update(integrationId, updates);

      // Reload integrations
      window.location.reload();
    } catch (err: any) {
      console.error('Erro ao atualizar integração:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar integração');
    } finally {
      setSavingIntegration(false);
    }
  };


  const handleUpdateCampaign = async () => {
    if (!campaignId) return;

    try {
      setError('');
      const response = await campaignApi.update(campaignId, editFormData);
      setCampaign(response.data.campaign);
      // Show success message
      alert('Campanha atualizada com sucesso!');
    } catch (err: any) {
      console.error('Error updating campaign:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar campanha');
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignId) return;

    try {
      setIsDeleting(true);
      await campaignApi.delete(campaignId);
      // Redirect to campaigns list
      router.push('/minhas-campanhas');
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      setError(err.response?.data?.error || 'Erro ao apagar campanha');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

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

  if (loadingCampaign) {
    return (
      <div>
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

  if (error && !campaign) {
    return (
      <div>
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

  if (!campaign) return null;

  return (
    <div>
      {/* Campaign Header */}
      <div className="bg-white border-b border-gray-200">
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
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('configuracao')}
              className={`px-4 py-4 border-b-2 font-medium whitespace-nowrap text-base ${
                activeTab === 'configuracao'
                  ? 'border-[#ed5544] text-[#ed5544]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Configuração
            </button>
            <button
              onClick={() => setActiveTab('identificacao')}
              className={`px-4 py-4 border-b-2 font-medium whitespace-nowrap text-base ${
                activeTab === 'identificacao'
                  ? 'border-[#ed5544] text-[#ed5544]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Identificação
            </button>
            <button
              onClick={() => setActiveTab('descricao')}
              className={`px-4 py-4 border-b-2 font-medium whitespace-nowrap text-base ${
                activeTab === 'descricao'
                  ? 'border-[#ed5544] text-[#ed5544]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Descrição
            </button>
            <button
              onClick={() => setActiveTab('metas')}
              className={`px-4 py-4 border-b-2 font-medium whitespace-nowrap text-base ${
                activeTab === 'metas'
                  ? 'border-[#ed5544] text-[#ed5544]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Metas
            </button>
            <button
              onClick={() => setActiveTab('recompensas')}
              className={`px-4 py-4 border-b-2 font-medium whitespace-nowrap text-base ${
                activeTab === 'recompensas'
                  ? 'border-[#ed5544] text-[#ed5544]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Recompensas
            </button>
            <button
              onClick={() => setActiveTab('integracoes')}
              className={`px-4 py-4 border-b-2 font-medium whitespace-nowrap text-base ${
                activeTab === 'integracoes'
                  ? 'border-[#ed5544] text-[#ed5544]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Integrações
            </button>
            <button
              onClick={() => setActiveTab('publicacao')}
              className={`px-4 py-4 border-b-2 font-medium whitespace-nowrap text-base ${
                activeTab === 'publicacao'
                  ? 'border-[#ed5544] text-[#ed5544]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Publicação
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Configuração Tab */}
        {activeTab === 'configuracao' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuração</h2>
              <p className="text-gray-600">
                Gerencie as configurações da sua campanha
              </p>
            </div>

            {/* Delete Campaign Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Apagar Campanha</h3>
              <p className="text-gray-600 mb-4">
                Esta ação é permanente e não pode ser desfeita. Todos os dados, integrações e histórico serão perdidos.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Apagar Campanha
              </button>
            </div>
          </div>
        )}

        {/* Identificação Tab */}
        {activeTab === 'identificacao' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Identificação</h2>
              <p className="text-gray-600">
                Título e redes sociais
              </p>
            </div>

            {/* Campaign Name Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  O nome da sua campanha:
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  O nome deve conter no máximo 35 caracteres
                </p>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  maxLength={35}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ed5544] focus:border-transparent text-base"
                  placeholder="Nome da campanha"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editFormData.title.length}/35 caracteres
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Frase de efeito
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  No máximo 100 caracteres. Exemplo: "Jazz para quem não tem paciência"
                </p>
                <input
                  type="text"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ed5544] focus:border-transparent text-base"
                  placeholder="Frase curta descrevendo sua campanha"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editFormData.description.length}/100 caracteres
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Categoria
                </label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ed5544] focus:border-transparent text-base"
                >
                  <option value="art">Arte</option>
                  <option value="music">Música</option>
                  <option value="technology">Tecnologia</option>
                  <option value="education">Educação</option>
                  <option value="social">Social</option>
                  <option value="games">Games</option>
                  <option value="podcasts">Podcasts</option>
                  <option value="videos">Vídeos</option>
                  <option value="other">Outros</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  URL da Imagem
                </label>
                <input
                  type="url"
                  value={editFormData.imageUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ed5544] focus:border-transparent text-base"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleUpdateCampaign}
                  className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded font-semibold transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Integrações Tab */}
        {activeTab === 'integracoes' && (
          <div>
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
                        Ao integrar a campanha com o Telegram, seus apoiadores poderão acessar grupos exclusivos automaticamente
                        baseado no status de pagamento.
                      </p>
                    </div>

                    {/* Connect Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={handleConnectTelegram}
                        disabled={isConnecting || !campaign?.slug}
                        className="px-5 py-2 bg-[#ed5544] hover:bg-[#d64435] text-white rounded font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isConnecting ? 'Conectando...' : 'Conectar'}
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
                    <div className="space-y-4">
                      {integrations.map((integration) => (
                        <div
                          key={integration._id}
                          className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                        >
                          {/* Integration Header */}
                          <div className="flex items-center justify-between p-4">
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
                                  {integration.telegramGroupType === 'channel' ? 'Canal' : 'Grupo'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={integration.isActive ? "success" : "default"}>
                                {integration.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                              {editingIntegration !== integration._id && (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(integration)}
                                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded font-medium text-sm transition-colors"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDisconnectTelegram(integration._id)}
                                    disabled={disconnectingIntegrationId === integration._id}
                                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {disconnectingIntegrationId === integration._id ? 'Desconectando...' : 'Desconectar'}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Edit Mode */}
                          {editingIntegration === integration._id ? (
                            <div className="border-t border-gray-200 bg-white p-4">
                              <SupportLevelSelector
                                campaignSlug={campaign?.slug || ''}
                                rewardLevels={campaign?.rewardLevels || []}
                                onLevelSelected={(minLevelId) => handleSaveEdit(integration._id, minLevelId)}
                                onCancel={handleCancelEdit}
                              />
                            </div>
                          ) : (
                            /* View Mode */
                            <div className="border-t border-gray-200 bg-white p-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Controle de Acesso:</span>
                                  <p className="text-gray-900">
                                    {integration.minSupportLevel
                                      ? 'Nível Mínimo Configurado'
                                      : 'Todos os Apoiadores'}
                                  </p>
                                </div>
                                {integration.minSupportLevel && (
                                  <div className="col-span-2">
                                    <span className="font-medium text-gray-700">Nível Mínimo de Apoio:</span>
                                    {(() => {
                                      const minLevel = campaign?.rewardLevels.find((l) => l.id === integration.minSupportLevel);
                                      return minLevel ? (
                                        <p className="text-gray-900 mt-1">
                                          A partir de {minLevel.title} (R$ {minLevel.amount.toFixed(2)})
                                        </p>
                                      ) : (
                                        <p className="text-gray-900 mt-1">ID: {integration.minSupportLevel}</p>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other Tabs - Placeholder */}
        {activeTab !== 'configuracao' && activeTab !== 'identificacao' && activeTab !== 'integracoes' && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-5xl mb-4">🚧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Em Desenvolvimento
            </h3>
            <p className="text-gray-600">
              Esta seção está sendo desenvolvida e estará disponível em breve.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              Apagar Campanha
            </h3>
          </div>

          <p className="text-gray-600 mb-6">
            Tem certeza que deseja apagar a campanha <strong>"{campaign.title}"</strong>?
            Esta ação é permanente e não pode ser desfeita. Todos os dados, integrações e
            histórico serão perdidos.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteCampaign}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Apagando...' : 'Sim, apagar campanha'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function CampaignSettingsPage() {
  return (
    <Suspense fallback={
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ed5544] mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <CampaignSettingsContent />
    </Suspense>
  );
}
