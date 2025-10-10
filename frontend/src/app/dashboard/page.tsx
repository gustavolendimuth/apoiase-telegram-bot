'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Modal } from '@/components/ui';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [campaignId, setCampaignId] = useState('campaign-demo');
  const { integrations, loading, toggleIntegration, deleteIntegration } = useIntegrations(campaignId);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    const success = await deleteIntegration(id);
    if (success) {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard - Integrações Telegram
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Olá, {user.email} ({user.role})
              </p>
            </div>
            <Button variant="secondary" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Minhas Integrações
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {integrations.length} integração{integrations.length !== 1 ? 'ões' : ''} configurada{integrations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowNewModal(true)}
          >
            + Nova Integração
          </Button>
        </div>

        {/* Integrations List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando integrações...</p>
          </div>
        ) : integrations.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma integração configurada
            </h3>
            <p className="text-gray-600 mb-4">
              Crie sua primeira integração para começar a usar o bot do Telegram
            </p>
            <Button variant="primary" onClick={() => setShowNewModal(true)}>
              Criar Primeira Integração
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {integration.telegramGroupTitle}
                    </CardTitle>
                    <Badge variant={integration.isActive ? 'success' : 'default'}>
                      {integration.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Tipo:</strong> {integration.telegramGroupType}</p>
                    <p><strong>ID do Grupo:</strong> {integration.telegramGroupId}</p>
                    <p>
                      <strong>Níveis:</strong>{' '}
                      {integration.rewardLevels.length > 0
                        ? integration.rewardLevels.join(', ')
                        : 'Todos'}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push(`/dashboard/integrations/${integration.id}`)}
                      className="flex-1"
                    >
                      Detalhes
                    </Button>
                    <Button
                      size="sm"
                      variant={integration.isActive ? 'ghost' : 'primary'}
                      onClick={() => toggleIntegration(integration.id, !integration.isActive)}
                    >
                      {integration.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteConfirm(integration.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <p className="text-gray-700 mb-6">
          Tem certeza que deseja deletar esta integração? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Deletar
          </Button>
        </div>
      </Modal>

      {/* New Integration Modal - Placeholder */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nova Integração"
      >
        <p className="text-gray-700">
          Formulário de criação de integração será implementado aqui.
        </p>
        <div className="mt-6">
          <Button onClick={() => setShowNewModal(false)}>Fechar</Button>
        </div>
      </Modal>
    </div>
  );
}
