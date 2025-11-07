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
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [addBotUrl, setAddBotUrl] = useState<string | null>(null);

  useEffect(() => {
    loadBotInfo();
    loadAvailableGroups();
  }, [stateToken]);

  const loadBotInfo = async () => {
    try {
      const response = await api.get('/api/bot/info');
      if (response.data.botUsername) {
        setBotUsername(response.data.botUsername);
      }
    } catch (err) {
      console.error('Erro ao obter informações do bot:', err);
    }

    // Buscar URL para adicionar bot
    try {
      const urlResponse = await api.get('/api/integrations/add-bot-url');
      if (urlResponse.data.addBotUrl) {
        setAddBotUrl(urlResponse.data.addBotUrl);
      }
    } catch (err) {
      console.error('Erro ao obter URL de adicionar bot:', err);
    }
  };

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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-900 mb-3">Para adicionar um grupo:</h4>

            {addBotUrl ? (
              <div className="space-y-3">
                <a
                  href={addBotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors w-full"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-1.953 9.216-2.762 12.226-.342 1.271-.678 1.697-1.113 1.738-.945.087-1.663-.625-2.577-1.225-1.431-.937-2.24-1.521-3.63-2.434-1.606-1.056-.565-1.637.351-2.585.24-.249 4.397-4.031 4.478-4.373.01-.043.02-.203-.076-.288-.095-.085-.234-.056-.335-.033-.143.032-2.421 1.538-6.834 4.516-.647.445-1.233.661-1.759.65-.579-.013-1.692-.327-2.521-.596-.867-.29-1.556-.443-1.495-.935.032-.256.38-.518.985-.787 3.861-1.683 6.434-2.795 7.72-3.333 3.677-1.531 4.442-1.798 4.939-1.806.109-.002.354.025.513.154.134.109.171.256.189.36.018.103.041.339.023.523z"/>
                  </svg>
                  Adicionar Bot ao Grupo
                </a>
                <div className="text-left space-y-2">
                  <p className="text-sm text-blue-800">
                    <strong>1.</strong> Clique no botão acima
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>2.</strong> Selecione o grupo que deseja integrar
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>3.</strong> Conceda as permissões de administrador solicitadas
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>4.</strong> Após adicionar, clique em "Recarregar Grupos" abaixo
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-blue-800 text-left space-y-2">
                <p><strong>1.</strong> Adicione o bot <code className="bg-blue-100 px-1 py-0.5 rounded">@{botUsername}</code> ao seu grupo</p>
                <p><strong>2.</strong> Promova o bot a administrador</p>
                <p><strong>3.</strong> Garanta que o bot tenha permissão para convidar usuários</p>
                <p><strong>4.</strong> Clique em "Recarregar" para atualizar a lista</p>
              </div>
            )}
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
