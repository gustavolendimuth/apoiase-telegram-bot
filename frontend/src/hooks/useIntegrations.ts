'use client';

import { useState, useEffect } from 'react';
import { integrationApi } from '@/lib/api';
import { useToast } from '@/components/ui';
import type { IIntegration } from 'shared';

export const useIntegrations = (campaignId?: string) => {
  const [integrations, setIntegrations] = useState<IIntegration[]>([]);
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
      const response = await integrationApi.list(campaignId);
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
  }): Promise<IIntegration | null> => {
    try {
      const response = await integrationApi.create(data);
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
      const response = await integrationApi.update(id, data);
      const updated = response.data.integration;

      setIntegrations((prev) =>
        prev.map((int) => (int._id === id ? { ...int, ...updated } : int))
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
      await integrationApi.delete(id);

      setIntegrations((prev) => prev.filter((int) => int._id !== id));
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
      if (isActive) {
        await integrationApi.activate(id);
      } else {
        await integrationApi.deactivate(id);
      }

      setIntegrations((prev) =>
        prev.map((int) => (int._id === id ? { ...int, isActive } : int))
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
      const response = await integrationApi.regenerateKey(id);
      const newApiKey = response.data.apiKey;

      setIntegrations((prev) =>
        prev.map((int) => (int._id === id ? { ...int, apiKey: newApiKey } : int))
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
