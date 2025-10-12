"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

interface Campaign {
  _id: string;
  title: string;
  slug: string;
  imageUrl: string;
  status: string;
  category: string;
}

interface Support {
  _id: string;
  campaignId: Campaign;
  rewardLevelId: string;
  amount: number;
  status: 'active' | 'cancelled' | 'paused' | 'payment_failed';
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  startDate: string;
  cancelledAt?: string;
  createdAt: string;
}

export default function MeusApoios() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [supports, setSupports] = useState<Support[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchMySupports();
    }
  }, [user, authLoading, router]);

  const fetchMySupports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/supports/my/supports');
      setSupports(response.data);
    } catch (err: any) {
      console.error('Error fetching supports:', err);
      setError(err.response?.data?.error || 'Erro ao carregar apoios');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSupport = async (supportId: string) => {
    try {
      await api.post(`/api/supports/${supportId}/pause`);
      fetchMySupports(); // Refresh list
    } catch (err: any) {
      console.error('Error pausing support:', err);
      alert(err.response?.data?.error || 'Erro ao pausar apoio');
    }
  };

  const handleResumeSupport = async (supportId: string) => {
    try {
      await api.post(`/api/supports/${supportId}/resume`);
      fetchMySupports(); // Refresh list
    } catch (err: any) {
      console.error('Error resuming support:', err);
      alert(err.response?.data?.error || 'Erro ao retomar apoio');
    }
  };

  const handleCancelSupport = async (supportId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja cancelar este apoio? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      await api.post(`/api/supports/${supportId}/cancel`);
      fetchMySupports(); // Refresh list
    } catch (err: any) {
      console.error('Error cancelling support:', err);
      alert(err.response?.data?.error || 'Erro ao cancelar apoio');
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      active: 'Ativo',
      cancelled: 'Cancelado',
      paused: 'Pausado',
      payment_failed: 'Pagamento falhou',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      paused: 'bg-yellow-100 text-yellow-700',
      payment_failed: 'bg-red-100 text-red-700',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const activeSupports = supports.filter(s => s.status === 'active');
  const inactiveSupports = supports.filter(s => s.status !== 'active');

  if (authLoading || loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ed5544] mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando apoios...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Meus apoios
            </h1>
            <p className="text-gray-600 text-lg">
              Gerencie seus apoios e acompanhe o impacto dos seus projetos favoritos
            </p>
          </div>
          <button
            onClick={() => router.push('/campanhas')}
            className="px-6 py-3 bg-[#ed5544] text-white rounded-lg hover:bg-[#d64435] transition-colors font-semibold shadow-lg hover:shadow-xl"
          >
            Buscar novas campanhas
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Apoios Ativos Section */}
      {activeSupports.length > 0 && (
        <div className="mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-full">
              <span className="text-lg">❤️</span>
              <span className="font-semibold text-gray-700">
                Apoios ativos
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {activeSupports.map((support) => (
              <SupportCard
                key={support._id}
                support={support}
                getStatusLabel={getStatusLabel}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
                onPause={() => handlePauseSupport(support._id)}
                onResume={() => handleResumeSupport(support._id)}
                onCancel={() => handleCancelSupport(support._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Apoios Inativos Section */}
      {inactiveSupports.length > 0 && (
        <div className="mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-full">
              <span className="text-lg">📋</span>
              <span className="font-semibold text-gray-700">
                Outros apoios
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {inactiveSupports.map((support) => (
              <SupportCard
                key={support._id}
                support={support}
                getStatusLabel={getStatusLabel}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
                onPause={() => handlePauseSupport(support._id)}
                onResume={() => handleResumeSupport(support._id)}
                onCancel={() => handleCancelSupport(support._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {supports.length === 0 && !loading && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Nenhum apoio encontrado
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Você ainda não apoia nenhuma campanha. Descubra projetos incríveis e faça a diferença!
          </p>
          <button
            onClick={() => router.push('/campanhas')}
            className="px-6 py-3 bg-[#ed5544] text-white rounded-lg hover:bg-[#d64435] transition-colors font-semibold"
          >
            Descobrir campanhas
          </button>
        </div>
      )}
    </main>
  );
}

// Support Card Component
interface SupportCardProps {
  support: Support;
  getStatusLabel: (status: string) => string;
  getStatusColor: (status: string) => string;
  formatDate: (dateString?: string) => string;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

function SupportCard({ support, getStatusLabel, getStatusColor, formatDate, onPause, onResume, onCancel }: SupportCardProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={support.campaignId.imageUrl}
            alt={support.campaignId.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {support.campaignId.title}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(support.status)}`}>
                {getStatusLabel(support.status)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-gray-600">
                Valor: R$ {support.amount.toLocaleString()} /mês
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-600">Desde {formatDate(support.startDate)}</span>
            </div>
            {support.nextPaymentDate && support.status === 'active' && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600">
                  Próximo pagamento: {formatDate(support.nextPaymentDate)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/campanha/${support.campaignId.slug}`)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Ver campanha"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          {support.status === 'active' && (
            <>
              <button
                onClick={onPause}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm font-medium hover:bg-yellow-600 transition-colors flex items-center gap-1"
                title="Pausar apoio"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pausar
              </button>
              <button
                onClick={onCancel}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors"
                title="Cancelar apoio"
              >
                Cancelar
              </button>
            </>
          )}

          {support.status === 'paused' && (
            <button
              onClick={onResume}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1"
              title="Retomar apoio"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Retomar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
