'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui';

interface Integration {
  id: string;
  campaignId: string;
  telegramGroupId: string;
  telegramGroupTitle: string;
  telegramGroupType: 'group' | 'supergroup' | 'channel';
  apiKey?: string;
  minSupportLevel?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useIntegrations = (campaignId?: string) => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchIntegrations = async () => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/api/integrations?campaignId=${campaignId}`);
      setIntegrations(response.data.integrations || []);
      setError(null);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao carregar integrações';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [campaignId]);

  const createIntegration = async (data: {
    campaignId: string;
    telegramGroupId: string;
    minSupportLevel?: string;
  }): Promise<Integration | null> => {
    try {
      const response = await api.post('/api/integrations', data);
      const newIntegration = response.data.integration;

      setIntegrations((prev) => [newIntegration, ...prev]);
      showToast('success', 'Integração criada com sucesso!');

      return newIntegration;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao criar integração';
      showToast('error', message);
      return null;
    }
  };

  const updateIntegration = async (
    id: string,
    data: { minSupportLevel?: string; isActive?: boolean }
  ): Promise<boolean> => {
    try {
      const response = await api.put(`/api/integrations/${id}`, data);
      const updated = response.data.integration;

      setIntegrations((prev) =>
        prev.map((int) => (int.id === id ? { ...int, ...updated } : int))
      );

      showToast('success', 'Integração atualizada com sucesso!');
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao atualizar integração';
      showToast('error', message);
      return false;
    }
  };

  const deleteIntegration = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/api/integrations/${id}`);

      setIntegrations((prev) => prev.filter((int) => int.id !== id));
      showToast('success', 'Integração deletada com sucesso!');

      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao deletar integração';
      showToast('error', message);
      return false;
    }
  };

  const toggleIntegration = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const endpoint = isActive ? 'activate' : 'deactivate';
      await api.post(`/api/integrations/${id}/${endpoint}`);

      setIntegrations((prev) =>
        prev.map((int) => (int.id === id ? { ...int, isActive } : int))
      );

      showToast(
        'success',
        `Integração ${isActive ? 'ativada' : 'desativada'} com sucesso!`
      );

      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao alterar status';
      showToast('error', message);
      return false;
    }
  };

  const regenerateApiKey = async (id: string): Promise<string | null> => {
    try {
      const response = await api.post(`/api/integrations/${id}/regenerate-key`);
      const newApiKey = response.data.apiKey;

      setIntegrations((prev) =>
        prev.map((int) => (int.id === id ? { ...int, apiKey: newApiKey } : int))
      );

      showToast('success', 'API Key regenerada com sucesso!');
      return newApiKey;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao regenerar API Key';
      showToast('error', message);
      return null;
    }
  };

  return {
    integrations,
    loading,
    error,
    fetchIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration,
    regenerateApiKey,
  };
};
