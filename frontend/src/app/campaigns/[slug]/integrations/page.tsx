'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

interface Integration {
  id: string;
  telegramGroupTitle: string;
  telegramGroupId: string;
  accessMode: 'reward_levels' | 'min_amount';
  minAmount?: number;
  rewardLevels?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Campaign {
  _id: string;
  title: string;
  slug: string;
  makerId: string;
  rewardLevels: Array<{
    id: string;
    title: string;
    amount: number;
    description: string;
  }>;
}

export default function CampaignIntegrationsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'reward_levels' | 'min_amount'>('min_amount');
  const [editMinAmount, setEditMinAmount] = useState<number>(0);
  const [editRewardLevels, setEditRewardLevels] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [params.slug]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar campanha
      const campaignResponse = await api.get(`/api/campaigns/slug/${params.slug}`);
      setCampaign(campaignResponse.data);

      // Carregar integrações
      const integrationsResponse = await api.get('/api/integrations', {
        params: { campaignId: campaignResponse.data._id },
      });
      setIntegrations(integrationsResponse.data.integrations || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.response?.data?.error || 'Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (integration: Integration) => {
    setEditingIntegration(integration.id);
    setEditMode(integration.accessMode);
    setEditMinAmount(integration.minAmount || 0);
    setEditRewardLevels(integration.rewardLevels || []);
  };

  const handleCancelEdit = () => {
    setEditingIntegration(null);
  };

  const handleSaveEdit = async (integrationId: string) => {
    try {
      setLoading(true);

      const updates: any = {
        accessMode: editMode,
      };

      if (editMode === 'min_amount') {
        updates.minAmount = editMinAmount;
        updates.rewardLevels = [];
      } else {
        updates.rewardLevels = editRewardLevels;
        updates.minAmount = undefined;
      }

      await api.put(`/api/integrations/${integrationId}`, updates);

      await loadData();
      setEditingIntegration(null);
    } catch (err: any) {
      console.error('Erro ao atualizar integração:', err);
      alert(err.response?.data?.error || 'Erro ao atualizar integração');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Tem certeza que deseja remover esta integração?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/api/integrations/${integrationId}`);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao deletar integração:', err);
      alert(err.response?.data?.error || 'Erro ao deletar integração');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRewardLevel = (levelId: string) => {
    if (editRewardLevels.includes(levelId)) {
      setEditRewardLevels(editRewardLevels.filter((id) => id !== levelId));
    } else {
      setEditRewardLevels([...editRewardLevels, levelId]);
    }
  };

  if (loading && integrations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" />
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => router.push('/minhas-campanhas')} className="mt-4">
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Integrações</h1>
          <p className="text-gray-600">
            Campanha: <span className="font-semibold">{campaign?.title}</span>
          </p>
        </div>

        {integrations.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">Nenhuma integração encontrada para esta campanha.</p>
            <Button onClick={() => router.push('/minhas-campanhas')}>
              Voltar para Minhas Campanhas
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {integrations.map((integration) => (
              <Card key={integration.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {integration.telegramGroupTitle}
                    </h3>
                    <p className="text-sm text-gray-500">ID: {integration.telegramGroupId}</p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-2 ${
                        integration.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {integration.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  {editingIntegration !== integration.id && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStartEdit(integration)}
                        variant="outline"
                        size="small"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDeleteIntegration(integration.id)}
                        variant="outline"
                        size="small"
                        className="text-red-600 hover:text-red-700"
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>

                {editingIntegration === integration.id ? (
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modo de Controle de Acesso
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="min_amount"
                            checked={editMode === 'min_amount'}
                            onChange={(e) => setEditMode(e.target.value as any)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Valor Mínimo de Contribuição</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="reward_levels"
                            checked={editMode === 'reward_levels'}
                            onChange={(e) => setEditMode(e.target.value as any)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Níveis de Recompensa Específicos</span>
                        </label>
                      </div>
                    </div>

                    {editMode === 'min_amount' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valor Mínimo (R$)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editMinAmount}
                          onChange={(e) => setEditMinAmount(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Apoiadores com contribuição igual ou superior a este valor terão acesso ao grupo.
                        </p>
                      </div>
                    )}

                    {editMode === 'reward_levels' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selecione os Níveis de Recompensa
                        </label>
                        <div className="space-y-2">
                          {campaign?.rewardLevels.map((level) => (
                            <label key={level.id} className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={editRewardLevels.includes(level.id)}
                                onChange={() => handleToggleRewardLevel(level.id)}
                                className="w-4 h-4 mt-1"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium">{level.title}</span>
                                <span className="text-sm text-gray-600 ml-2">
                                  (R$ {level.amount.toFixed(2)})
                                </span>
                                <p className="text-xs text-gray-500">{level.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleCancelEdit} variant="outline" size="small">
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => handleSaveEdit(integration.id)}
                        size="small"
                        disabled={loading}
                      >
                        {loading ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Modo de Acesso:</span>
                        <p className="text-gray-900">
                          {integration.accessMode === 'min_amount'
                            ? 'Valor Mínimo'
                            : 'Níveis de Recompensa'}
                        </p>
                      </div>
                      {integration.accessMode === 'min_amount' && (
                        <div>
                          <span className="font-medium text-gray-700">Valor Mínimo:</span>
                          <p className="text-gray-900">
                            R$ {(integration.minAmount || 0).toFixed(2)}
                          </p>
                        </div>
                      )}
                      {integration.accessMode === 'reward_levels' && (
                        <div className="col-span-2">
                          <span className="font-medium text-gray-700">Níveis com Acesso:</span>
                          {integration.rewardLevels && integration.rewardLevels.length > 0 ? (
                            <ul className="list-disc list-inside text-gray-900 mt-1">
                              {integration.rewardLevels.map((levelId) => {
                                const level = campaign?.rewardLevels.find((l) => l.id === levelId);
                                return level ? (
                                  <li key={levelId}>
                                    {level.title} (R$ {level.amount.toFixed(2)})
                                  </li>
                                ) : (
                                  <li key={levelId}>{levelId}</li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-gray-500 text-sm">Nenhum nível selecionado</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Button onClick={() => router.push('/minhas-campanhas')} variant="outline">
            Voltar para Minhas Campanhas
          </Button>
        </div>
      </div>
    </div>
  );
}
