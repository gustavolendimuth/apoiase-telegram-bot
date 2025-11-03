'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Loading } from './ui/Loading';
import api from '@/lib/api';

interface TelegramGroupSelectorProps {
  stateToken: string;
  onGroupSelected: () => void;
  onCancel: () => void;
}

interface AvailableGroup {
  id: string;
  title: string;
  type: 'group' | 'supergroup' | 'channel';
  memberCount?: number;
}

export function TelegramGroupSelector({
  stateToken,
  onGroupSelected,
  onCancel,
}: TelegramGroupSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<AvailableGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableGroups();
  }, [stateToken]);

  const loadAvailableGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/integration/available-groups', {
        params: { stateToken },
      });

      if (response.data.success) {
        setGroups(response.data.groups || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar grupos:', err);
      setError(err.response?.data?.error || 'Erro ao carregar grupos disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = async (groupId: string, groupTitle: string) => {
    try {
      setLoading(true);
      setError(null);

      await api.post('/api/integration/select-group', {
        stateToken,
        groupId,
        groupTitle,
      });

      onGroupSelected();
    } catch (err: any) {
      console.error('Erro ao selecionar grupo:', err);
      setError(err.response?.data?.error || 'Erro ao selecionar grupo');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900 mb-2">
            Passo 2: Selecione o Grupo do Telegram
          </h2>
          <p className="text-sm text-blue-700">
            Carregando grupos disponíveis...
          </p>
        </div>
        <div className="flex justify-center py-8">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-900 mb-2">
          Passo 2: Selecione o Grupo do Telegram
        </h2>
        <p className="text-sm text-blue-700">
          Selecione um grupo onde o bot é administrador para conectar à sua campanha.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {groups.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="text-yellow-500 text-4xl mb-3">⚠️</div>
          <h3 className="font-semibold text-gray-900 mb-2">Nenhum grupo disponível</h3>
          <p className="text-sm text-gray-600 mb-4">
            O bot não encontrou grupos onde ele é administrador com as permissões necessárias.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-gray-900 mb-2">Para adicionar um grupo:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Adicione o bot ao seu grupo do Telegram</li>
              <li>Promova o bot a administrador</li>
              <li>Garanta que o bot tenha permissão para convidar usuários</li>
              <li>Clique em "Recarregar" para atualizar a lista</li>
            </ol>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={onCancel} variant="outline" fullWidth>
              Cancelar
            </Button>
            <Button onClick={loadAvailableGroups} fullWidth>
              Recarregar Grupos
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {groups.map((group) => (
              <Card
                key={group.id}
                className={`p-4 cursor-pointer transition-all hover:border-blue-400 ${
                  selectedGroupId === group.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedGroupId(group.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{group.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 uppercase">
                        {group.type === 'supergroup' ? 'Supergrupo' : group.type === 'channel' ? 'Canal' : 'Grupo'}
                      </span>
                      {group.memberCount && (
                        <span className="text-xs text-gray-500">
                          {group.memberCount} membros
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">ID: {group.id}</p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="radio"
                      checked={selectedGroupId === group.id}
                      onChange={() => setSelectedGroupId(group.id)}
                      className="w-5 h-5 text-blue-600"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Importante:</strong> Apenas grupos onde o bot tem as permissões necessárias são exibidos.
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={onCancel} variant="outline" fullWidth disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedGroupId) {
                  const selectedGroup = groups.find(g => g.id === selectedGroupId);
                  if (selectedGroup) {
                    handleSelectGroup(selectedGroup.id, selectedGroup.title);
                  }
                }
              }}
              fullWidth
              disabled={!selectedGroupId || loading}
            >
              {loading ? 'Conectando...' : 'Conectar Grupo'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
