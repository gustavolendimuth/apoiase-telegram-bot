"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

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
  createdAt: string;
  updatedAt: string;
}

export default function MinhasCampanhasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchMyCampaigns();
    }
  }, [user, authLoading, router]);

  const fetchMyCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/campaigns/my/campaigns');
      setCampaigns(response.data);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError(err.response?.data?.error || 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'Rascunho',
      active: 'Ativa',
      paused: 'Pausada',
      completed: 'Concluída',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  if (authLoading || loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ed5544] mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando campanhas...</p>
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
              Minhas campanhas
            </h1>
            <p className="text-gray-600 text-lg">
              Gerencie suas campanhas e acompanhe o crescimento dos seus projetos
            </p>
          </div>
          <button
            onClick={() => router.push('/criar-campanha')}
            className="px-6 py-3 bg-[#ed5544] text-white rounded-lg hover:bg-[#d64435] transition-colors font-semibold shadow-lg hover:shadow-xl"
          >
            Criar Campanha
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Campanhas Ativas Section */}
      {campaigns.filter(c => c.status === 'active').length > 0 && (
        <div className="mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-full">
              <span className="text-lg">
                <Image
                  src="/images/_Caminho_.svg"
                  alt='heart icon'
                  width={24}
                  height={24}
                />
              </span>
              <span className="font-semibold text-gray-700">
                Campanhas ativas
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {campaigns
              .filter(c => c.status === 'active')
              .map((campaign) => (
                <CampaignCard key={campaign._id} campaign={campaign} getStatusLabel={getStatusLabel} getStatusColor={getStatusColor} />
              ))}
          </div>
        </div>
      )}

      {/* Outras Campanhas Section */}
      {campaigns.filter(c => c.status !== 'active').length > 0 && (
        <div className="mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-full">
              <span className="text-lg">📋</span>
              <span className="font-semibold text-gray-700">
                Outras campanhas
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {campaigns
              .filter(c => c.status !== 'active')
              .map((campaign) => (
                <CampaignCard key={campaign._id} campaign={campaign} getStatusLabel={getStatusLabel} getStatusColor={getStatusColor} />
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {campaigns.length === 0 && !loading && (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Nenhuma campanha criada
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Você ainda não criou nenhuma campanha. Comece agora e compartilhe seu projeto com o mundo!
          </p>
          <button
            onClick={() => router.push('/criar-campanha')}
            className="px-6 py-3 bg-[#ed5544] text-white rounded-lg hover:bg-[#d64435] transition-colors font-semibold"
          >
            Criar minha primeira campanha
          </button>
        </div>
      )}
    </main>
  );
}

// Campaign Card Component
interface CampaignCardProps {
  campaign: Campaign;
  getStatusLabel: (status: string) => string;
  getStatusColor: (status: string) => string;
}

function CampaignCard({ campaign, getStatusLabel, getStatusColor }: CampaignCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Campaign Image */}
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Campaign Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {campaign.title}
                  </h3>
                  <span className="text-gray-400">●</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(campaign.status)}`}>
                    {getStatusLabel(campaign.status) === 'Ativa' ? 'contínua' : getStatusLabel(campaign.status)}
                  </span>
                  <span className="text-gray-500 text-sm">por mês</span>
                </div>

                {/* Campaign Stats - Horizontal Layout */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 font-medium">{campaign.raised.toLocaleString()} arrecadação estimada por mês</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Meta:</span>
                    <span className="font-semibold text-gray-900">{campaign.currency} {campaign.goal.toLocaleString()} por mês (0% alcançada)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-gray-700 font-medium">{campaign.supporters} pessoas apoiando</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Links Section */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/campanha/${campaign.slug}`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#ed5544] transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Postar no Mural</span>
          </Link>
          <Link
            href={`/campanha/${campaign.slug}`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#ed5544] transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span>Postar áudio no Mural</span>
          </Link>
          <Link
            href={`/profile/campaign?campaignId=${campaign._id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#ed5544] transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Minhas Coleções</span>
          </Link>
          <Link
            href={`/profile/campaign?campaignId=${campaign._id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#ed5544] transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Editar campanha</span>
          </Link>
          <Link
            href={`/profile/campaign?campaignId=${campaign._id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#ed5544] transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Gerenciador de campanha</span>
          </Link>
          <Link
            href={`/profile/campaign?campaignId=${campaign._id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#ed5544] transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>Criar Campanha Combinada</span>
          </Link>
          <Link
            href={`/profile/campaign?campaignId=${campaign._id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#ed5544] transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Dados bancários</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
