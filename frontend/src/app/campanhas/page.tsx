'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

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
  { value: 'technology', label: 'Tecnologia' },
  { value: 'education', label: 'Educação' },
  { value: 'social', label: 'Social' },
  { value: 'games', label: 'Games' },
  { value: 'podcasts', label: 'Podcasts' },
  { value: 'videos', label: 'Vídeos' },
  { value: 'other', label: 'Outros' },
];

const categoryColors: Record<string, string> = {
  art: 'purple',
  music: 'pink',
  technology: 'blue',
  education: 'green',
  social: 'yellow',
  games: 'red',
  podcasts: 'indigo',
  videos: 'orange',
  other: 'gray',
};

export default function CampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || ''
  );
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCampaigns();
  }, [selectedCategory]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'active',
        ...(selectedCategory && { category: selectedCategory }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/all?${params}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data.campaigns);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchCampaigns();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/search?q=${encodeURIComponent(
          searchQuery
        )}`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setCampaigns(data);
      setTotal(data.length);
    } catch (error) {
      console.error('Error searching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
    const percentage = Math.min((campaign.raised / campaign.goal) * 100, 100);

    return (
      <Card
        className="cursor-pointer hover:shadow-xl transition-all overflow-hidden"
        onClick={() => router.push(`/campanha/${campaign.slug}`)}
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-full h-full object-cover transform hover:scale-105 transition-transform"
          />
          <div className="absolute top-4 right-4">
            <Badge color={categoryColors[campaign.category] || 'gray'}>
              {categories.find((c) => c.value === campaign.category)?.label ||
                campaign.category}
            </Badge>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {campaign.title}
          </h3>

          <p className="text-sm text-gray-600 mb-4">
            por <span className="font-semibold">{campaign.makerId.name}</span>
          </p>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {campaign.description}
          </p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{percentage.toFixed(0)}% alcançado</span>
              <span>
                {campaign.currency} {campaign.raised.toLocaleString()} de{' '}
                {campaign.goal.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              {campaign.supporters} apoiadores
            </span>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Todas as Campanhas
          </h1>
          <p className="text-lg text-gray-600">
            Descubra projetos incríveis para apoiar
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Digite palavras-chave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>Buscar</Button>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedCategory || searchQuery) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Filtros ativos:</span>
              {selectedCategory && (
                <Badge
                  color={categoryColors[selectedCategory]}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory('')}
                >
                  {categories.find((c) => c.value === selectedCategory)?.label}{' '}
                  ×
                </Badge>
              )}
              {searchQuery && (
                <Badge
                  className="cursor-pointer"
                  onClick={() => {
                    setSearchQuery('');
                    fetchCampaigns();
                  }}
                >
                  "{searchQuery}" ×
                </Badge>
              )}
            </div>
          )}
        </Card>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">
            {loading ? 'Carregando...' : `${total} campanha(s) encontrada(s)`}
          </p>
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando campanhas...</p>
            </div>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign._id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma campanha encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar seus filtros ou buscar por outras palavras-chave
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                fetchCampaigns();
              }}
            >
              Limpar filtros
            </Button>
          </Card>
        )}
    </div>
  );
}
