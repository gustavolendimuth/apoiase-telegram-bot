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
                <CampaignCard key={campaign._id} campaign={campaign} getStatusLabel={getStatusLabel} getStatusColor={getStatusColor} getCategoryLabel={getCategoryLabel} />
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
                <CampaignCard key={campaign._id} campaign={campaign} getStatusLabel={getStatusLabel} getStatusColor={getStatusColor} getCategoryLabel={getCategoryLabel} />
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
  getCategoryLabel: (category: string) => string;
}

function CampaignCard({ campaign, getStatusLabel, getStatusColor, getCategoryLabel }: CampaignCardProps) {
  const percentage = campaign.goal > 0 ? Math.min((campaign.raised / campaign.goal) * 100, 100) : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 mb-1 truncate">
                {campaign.title}
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(campaign.status)}`}>
                  {getStatusLabel(campaign.status)}
                </span>
                <span className="text-sm text-gray-500">
                  {getCategoryLabel(campaign.category)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 mb-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Arrecadado</div>
              <div className="text-lg font-bold text-[#ed5544]">
                {campaign.currency} {campaign.raised.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Meta</div>
              <div className="text-lg font-semibold text-gray-700">
                {campaign.currency} {campaign.goal.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Apoiadores</div>
              <div className="text-lg font-semibold text-gray-700">
                {campaign.supporters}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{percentage.toFixed(1)}% da meta</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#ed5544] h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 items-end">
          <Link
            href={`/campanha/${campaign.slug}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Ver campanha</span>
          </Link>
          <Link
            href={`/profile/campaign?campaignId=${campaign._id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Editar</span>
          </Link>
          <Link
            href={`/integration/authorize?campaign_id=${campaign._id}`}
            className="flex items-center gap-2 text-[#ed5544] hover:text-[#d64435] transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Conectar Telegram</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
