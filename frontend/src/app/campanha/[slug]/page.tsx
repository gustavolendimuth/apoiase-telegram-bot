'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { getApiUrl } from '@/lib/env';

interface RewardLevel {
  id: string;
  title: string;
  amount: number;
  description: string;
  benefits: string[];
}

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
  videoUrl?: string;
  rewardLevels: RewardLevel[];
  supporters: number;
  status: string;
  makerId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await fetch(
          `${getApiUrl()}/api/campaigns/slug/${params.slug}`
        );

        if (!response.ok) {
          throw new Error('Campaign not found');
        }

        const data = await response.json();
        setCampaign(data);
      } catch (error) {
        console.error('Error fetching campaign:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [params.slug]);

  const handleSupport = (rewardId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setSelectedReward(rewardId);
    setShowSupportModal(true);
  };

  const handleConfirmSupport = async () => {
    if (!selectedReward || !campaign) return;

    const reward = campaign.rewardLevels.find(r => r.id === selectedReward);
    if (!reward) return;

    try {
      setSupportLoading(true);
      await api.post('/api/supports', {
        campaignId: campaign._id,
        rewardLevelId: reward.id,
        amount: reward.amount,
        paymentMethod: 'credit_card', // MVP - método padrão
      });

      // Sucesso - redirecionar para meus apoios
      router.push('/meus-apoios');
    } catch (error: any) {
      console.error('Error creating support:', error);
      alert(error.response?.data?.error || 'Erro ao criar apoio');
    } finally {
      setSupportLoading(false);
    }
  };

  const percentage = campaign
    ? Math.min((campaign.raised / campaign.goal) * 100, 100)
    : 0;

  const categoryColors: Record<string, string> = {
    art: 'purple',
    music: 'pink',
    technology: 'blue',
    education: 'green',
    social: 'yellow',
    games: 'red',
    podcasts: 'indigo',
    videos: 'orange',
    other: 'gray',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando campanha...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Campanha não encontrada
        </h1>
        <p className="text-gray-600 mb-8">
          A campanha que você está procurando não existe ou foi removida.
        </p>
        <Button onClick={() => router.push('/')}>
          Voltar para Home
        </Button>
      </div>
    );
  }

  const selectedRewardData = selectedReward
    ? campaign?.rewardLevels.find(r => r.id === selectedReward)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Support Confirmation Modal */}
        {showSupportModal && selectedRewardData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Confirmar apoio
              </h3>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Você está prestes a apoiar <span className="font-semibold">{campaign?.title}</span> com o nível:
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900">{selectedRewardData.title}</h4>
                    <span className="text-xl font-bold text-[#ed5544]">
                      {campaign?.currency} {selectedRewardData.amount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{selectedRewardData.description}</p>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Benefícios:</p>
                    <ul className="space-y-1">
                      {selectedRewardData.benefits.map((benefit, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Este é um MVP. O pagamento não será processado nesta versão.
                    Seu apoio será registrado como ativo para fins de demonstração.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSupportModal(false);
                    setSelectedReward(null);
                  }}
                  disabled={supportLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSupport}
                  disabled={supportLoading}
                  className="flex-1 px-4 py-2 bg-[#ed5544] text-white rounded-lg hover:bg-[#d64435] transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {supportLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </>
                  ) : (
                    'Confirmar apoio'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>

          <div>
            <div className="mb-4">
              <Badge color={categoryColors[campaign.category] || 'gray'}>
                {campaign.category}
              </Badge>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {campaign.title}
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              por{' '}
              <span className="font-semibold text-gray-900">
                {campaign.makerId.name}
              </span>
            </p>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progresso
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="text-center p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {campaign.currency} {campaign.raised.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">arrecadado</div>
              </Card>

              <Card className="text-center p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {campaign.supporters}
                </div>
                <div className="text-sm text-gray-600">apoiadores</div>
              </Card>

              <Card className="text-center p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {campaign.currency} {campaign.goal.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">meta</div>
              </Card>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Sobre o projeto
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {campaign.description}
              </p>
            </Card>

            {campaign.videoUrl && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Vídeo do projeto
                </h2>
                <div className="aspect-video">
                  <iframe
                    src={campaign.videoUrl}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  ></iframe>
                </div>
              </Card>
            )}
          </div>

          {/* Reward Levels */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Níveis de apoio
            </h2>

            <div className="space-y-4">
              {campaign.rewardLevels
                .sort((a, b) => a.amount - b.amount)
                .map((reward) => (
                  <Card
                    key={reward.id}
                    className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                      selectedReward === reward.id
                        ? 'ring-2 ring-blue-600'
                        : ''
                    }`}
                    onClick={() => setSelectedReward(reward.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {reward.title}
                      </h3>
                      <span className="text-xl font-bold text-blue-600">
                        {campaign.currency} {reward.amount}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      {reward.description}
                    </p>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Benefícios:
                      </p>
                      <ul className="space-y-1">
                        {reward.benefits.map((benefit, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 flex items-start"
                          >
                            <svg
                              className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      onClick={() => handleSupport(reward.id)}
                      className="w-full"
                      variant={
                        selectedReward === reward.id ? 'primary' : 'secondary'
                      }
                    >
                      Apoiar agora
                    </Button>
                  </Card>
                ))}
            </div>
          </div>
        </div>
    </div>
  );
}
