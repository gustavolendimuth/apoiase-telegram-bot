"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";

interface RewardLevel {
  id: string;
  title: string;
  amount: number;
  description: string;
  benefits: string[];
}

export default function CriarCampanhaPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    category: "other",
    goal: "",
    currency: "BRL",
    imageUrl: "",
    videoUrl: "",
  });

  const [rewardLevels, setRewardLevels] = useState<RewardLevel[]>([
    {
      id: "reward-1",
      title: "",
      amount: 0,
      description: "",
      benefits: [""],
    },
  ]);

  useEffect(() => {
    console.log('[CriarCampanha] Auth state:', { user, authLoading });
    if (!authLoading && !user) {
      console.log('[CriarCampanha] Not authenticated, redirecting to login');
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    });
  };

  const addRewardLevel = () => {
    setRewardLevels([
      ...rewardLevels,
      {
        id: `reward-${Date.now()}`,
        title: "",
        amount: 0,
        description: "",
        benefits: [""],
      },
    ]);
  };

  const removeRewardLevel = (id: string) => {
    if (rewardLevels.length > 1) {
      setRewardLevels(rewardLevels.filter((level) => level.id !== id));
    }
  };

  const updateRewardLevel = (id: string, field: keyof RewardLevel, value: any) => {
    setRewardLevels(
      rewardLevels.map((level) =>
        level.id === id ? { ...level, [field]: value } : level
      )
    );
  };

  const addBenefit = (rewardId: string) => {
    setRewardLevels(
      rewardLevels.map((level) =>
        level.id === rewardId
          ? { ...level, benefits: [...level.benefits, ""] }
          : level
      )
    );
  };

  const updateBenefit = (rewardId: string, index: number, value: string) => {
    setRewardLevels(
      rewardLevels.map((level) =>
        level.id === rewardId
          ? {
              ...level,
              benefits: level.benefits.map((b, i) => (i === index ? value : b)),
            }
          : level
      )
    );
  };

  const removeBenefit = (rewardId: string, index: number) => {
    setRewardLevels(
      rewardLevels.map((level) =>
        level.id === rewardId
          ? {
              ...level,
              benefits: level.benefits.filter((_, i) => i !== index),
            }
          : level
      )
    );
  };

  const validateStep1 = () => {
    if (!formData.title || !formData.slug || !formData.description || !formData.category) {
      setError("Por favor, preencha todos os campos obrigatórios");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.goal || parseFloat(formData.goal) <= 0) {
      setError("Por favor, defina uma meta válida");
      return false;
    }
    if (!formData.imageUrl) {
      setError("Por favor, adicione uma imagem para a campanha");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    for (const level of rewardLevels) {
      if (!level.title || !level.amount || level.amount <= 0 || !level.description) {
        setError("Todos os níveis de recompensa devem ter título, valor e descrição");
        return false;
      }
      if (level.benefits.filter((b) => b.trim()).length === 0) {
        setError("Cada nível deve ter pelo menos um benefício");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setError("");
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError("");
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateStep3()) return;

    setLoading(true);

    try {
      const campaignData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        goal: parseFloat(formData.goal),
        currency: formData.currency,
        imageUrl: formData.imageUrl,
        videoUrl: formData.videoUrl || undefined,
        rewardLevels: rewardLevels.map((level) => ({
          id: level.id,
          title: level.title,
          amount: parseFloat(level.amount.toString()),
          description: level.description,
          benefits: level.benefits.filter((b) => b.trim()),
        })),
      };

      const response = await api.post("/api/campaigns", campaignData);

      // Redirect to campaign page
      router.push(`/campanha/${response.data.slug}`);
    } catch (err: any) {
      console.error("Error creating campaign:", err);
      setError(err.response?.data?.error || "Erro ao criar campanha");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "art", label: "Arte" },
    { value: "music", label: "Música" },
    { value: "technology", label: "Tecnologia" },
    { value: "education", label: "Educação" },
    { value: "social", label: "Social" },
    { value: "games", label: "Games" },
    { value: "podcasts", label: "Podcasts" },
    { value: "videos", label: "Vídeos" },
    { value: "other", label: "Outros" },
  ];

  if (authLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ed5544] mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Criar Campanha</h1>
        <p className="text-gray-600 text-lg">
          Compartilhe seu projeto com o mundo e comece a receber apoio
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step <= currentStep
                      ? "bg-[#ed5544] text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                <span className="text-xs text-gray-600 mt-2 text-center max-w-[100px]">
                  {step === 1 && "Informações Básicas"}
                  {step === 2 && "Meta e Mídia"}
                  {step === 3 && "Níveis de Apoio"}
                </span>
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    step < currentStep ? "bg-[#ed5544]" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Informações Básicas
            </h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Campanha *
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Apoie meu podcast semanal"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL da Campanha *
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm mr-2">
                    apoiase.com/
                  </span>
                  <Input
                    type="text"
                    placeholder="meu-podcast"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use apenas letras minúsculas, números e hífens
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed5544] focus:border-transparent bg-white text-gray-900 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                  }}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <textarea
                  rows={8}
                  placeholder="Conte sobre seu projeto, seus objetivos e como os apoios serão utilizados..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed5544] focus:border-transparent"
                  required
                />
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Goal and Media */}
        {currentStep === 2 && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Meta e Mídia
            </h2>

            <div className="space-y-6">
              {/* Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Mensal *
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed5544] focus:border-transparent"
                  >
                    <option value="BRL">BRL</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="1000.00"
                    value={formData.goal}
                    onChange={(e) =>
                      setFormData({ ...formData, goal: e.target.value })
                    }
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Quanto você precisa arrecadar por mês?
                </p>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL da Imagem de Capa *
                </label>
                <Input
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use uma imagem de alta qualidade (recomendado: 1200x630px)
                </p>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL do Vídeo (Opcional)
                </label>
                <Input
                  type="url"
                  placeholder="https://youtube.com/embed/..."
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link de vídeo do YouTube ou Vimeo (formato embed)
                </p>
              </div>

              {/* Image Preview */}
              {formData.imageUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Preview da Imagem:
                  </p>
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Step 3: Reward Levels */}
        {currentStep === 3 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Níveis de Apoio
              </h2>
              <Button type="button" onClick={addRewardLevel}>
                + Adicionar Nível
              </Button>
            </div>

            <div className="space-y-6">
              {rewardLevels.map((level, index) => (
                <Card key={level.id} className="p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Nível {index + 1}
                    </h3>
                    {rewardLevels.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRewardLevel(level.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Reward Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título do Nível *
                      </label>
                      <Input
                        type="text"
                        placeholder="Ex: Apoiador Bronze"
                        value={level.title}
                        onChange={(e) =>
                          updateRewardLevel(level.id, "title", e.target.value)
                        }
                        required
                      />
                    </div>

                    {/* Reward Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor Mensal *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="10.00"
                        value={level.amount}
                        onChange={(e) =>
                          updateRewardLevel(
                            level.id,
                            "amount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        required
                      />
                    </div>

                    {/* Reward Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição *
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Descreva este nível de apoio..."
                        value={level.description}
                        onChange={(e) =>
                          updateRewardLevel(
                            level.id,
                            "description",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed5544] focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Benefits */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Benefícios *
                      </label>
                      {level.benefits.map((benefit, benefitIndex) => (
                        <div
                          key={benefitIndex}
                          className="flex items-center gap-2 mb-2"
                        >
                          <Input
                            type="text"
                            placeholder="Ex: Acesso ao grupo exclusivo"
                            value={benefit}
                            onChange={(e) =>
                              updateBenefit(level.id, benefitIndex, e.target.value)
                            }
                          />
                          {level.benefits.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeBenefit(level.id, benefitIndex)
                              }
                              className="text-red-600 hover:text-red-800 text-sm px-2"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addBenefit(level.id)}
                        className="text-[#ed5544] hover:text-[#d64435] text-sm font-medium mt-2"
                      >
                        + Adicionar benefício
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="bg-gray-500 hover:bg-gray-600"
          >
            Voltar
          </Button>

          {currentStep < 3 ? (
            <Button type="button" onClick={handleNext}>
              Próximo
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Campanha"}
            </Button>
          )}
        </div>
      </form>
    </main>
  );
}
