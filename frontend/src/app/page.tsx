"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from '@/lib/env';

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
  status: string;
  makerId: {
    _id: string;
    name: string;
  };
}

const categories = [
  { value: '', label: 'Todas' },
  { value: 'art', label: 'Arte' },
  { value: 'music', label: 'Música' },
  { value: 'podcasts', label: 'Podcast' },
  { value: 'education', label: 'Educação' },
  { value: 'technology', label: 'Tecnologia' },
  { value: 'games', label: 'Jogos' },
  { value: 'videos', label: 'Vídeos' },
  { value: 'social', label: 'Social' },
];

export default function Home() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, [selectedCategory]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'active',
        limit: '8',
        ...(selectedCategory && { category: selectedCategory }),
      });

      const response = await fetch(
        `${getApiUrl()}/api/campaigns/all?${params}`
      );

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#ed5544] via-[#e64a3a] to-[#d64435] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Onde público e Fazedores andam juntos
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-white/90 leading-relaxed">
              Apoie projetos incríveis e faça parte de uma comunidade
              transformadora. Descubra criadores, apoie causas e construa o
              futuro que você quer ver.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/campanhas')}
                className="px-8 py-4 bg-white text-[#ed5544] rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg"
              >
                Descobrir projetos
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-semibold text-lg"
              >
                Criar minha campanha
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-6 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 font-medium ${
                  selectedCategory === cat.value
                    ? "bg-[#ed5544] text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Projetos em destaque
              </h2>
              <p className="text-gray-600">
                Descubra campanhas incríveis que estão fazendo a diferença
              </p>
            </div>
            <button
              onClick={() => router.push('/campanhas')}
              className="text-[#ed5544] hover:text-[#d64435] font-semibold flex items-center gap-2"
            >
              Ver todas
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ed5544] mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando campanhas...</p>
              </div>
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {campaigns.map((campaign) => {
                const percentage = Math.min((campaign.raised / campaign.goal) * 100, 100);
                return (
                  <div
                    key={campaign._id}
                    onClick={() => router.push(`/campanha/${campaign.slug}`)}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                  >
                    {/* Campaign Image */}
                    <div className="h-52 overflow-hidden">
                      <img
                        src={campaign.imageUrl}
                        alt={campaign.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Campaign Info */}
                    <div className="p-6">
                      <div className="text-xs text-[#ed5544] font-semibold mb-2 uppercase tracking-wide">
                        {categories.find(c => c.value === campaign.category)?.label || campaign.category}
                      </div>
                      <h4 className="font-bold text-gray-900 mb-4 text-lg leading-tight group-hover:text-[#ed5544] transition-colors line-clamp-2">
                        {campaign.title}
                      </h4>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-[#ed5544] h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {percentage.toFixed(0)}% concluído
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900 text-lg">
                            {campaign.currency} {campaign.raised.toLocaleString("pt-BR")}
                          </div>
                          <div className="text-gray-500 text-sm">
                            de {campaign.currency} {campaign.goal.toLocaleString("pt-BR")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-lg">
                            {campaign.supporters}
                          </div>
                          <div className="text-gray-500 text-sm">apoiadores</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhuma campanha encontrada</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#ed5544] mb-2">
                R$ 50M+
              </div>
              <div className="text-gray-600 font-medium">Arrecadado</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#ed5544] mb-2">
                500K+
              </div>
              <div className="text-gray-600 font-medium">Apoiadores</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#ed5544] mb-2">10K+</div>
              <div className="text-gray-600 font-medium">Projetos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#ed5544] mb-2">95%</div>
              <div className="text-gray-600 font-medium">Satisfação</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Como funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              É simples apoiar projetos incríveis e fazer parte de uma
              comunidade transformadora
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ed5544] to-[#d64435] rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <h3 className="font-bold text-gray-900 mb-4 text-xl">
                Descubra projetos
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Navegue por centenas de campanhas incríveis e encontre aquela
                que combina com seus valores e interesses
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ed5544] to-[#d64435] rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <h3 className="font-bold text-gray-900 mb-4 text-xl">
                Faça seu apoio
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Escolha o valor e a frequência do seu apoio. Pode ser mensal,
                pontual ou uma única contribuição
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ed5544] to-[#d64435] rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <h3 className="font-bold text-gray-900 mb-4 text-xl">
                Acompanhe o impacto
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Receba atualizações exclusivas e veja como seu apoio está
                fazendo a diferença na vida dos criadores
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
