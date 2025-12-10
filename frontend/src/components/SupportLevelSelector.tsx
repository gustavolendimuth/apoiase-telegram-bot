'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface RewardLevel {
  id: string;
  title: string;
  amount: number;
  description: string;
  benefits: string[];
}

interface SupportLevelSelectorProps {
  campaignSlug: string;
  rewardLevels: RewardLevel[];
  onLevelSelected: (minLevelId: string | null) => void;
  onCancel: () => void;
  initialLevel?: string | null;
  hideInstructions?: boolean;
}

export function SupportLevelSelector({
  rewardLevels,
  onLevelSelected,
  onCancel,
  initialLevel = null,
  hideInstructions = false,
}: SupportLevelSelectorProps) {
  const [selectedMinLevel, setSelectedMinLevel] = useState<string | null>(initialLevel);

  const handleLevelSelect = (levelId: string) => {
    setSelectedMinLevel(levelId);
  };

  const handleConfirm = () => {
    onLevelSelected(selectedMinLevel);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {!hideInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900 mb-2">
            Passo 3: Selecione o Nível Mínimo de Apoio
          </h2>
          <p className="text-sm text-blue-700 mb-2">
            Escolha o nível mínimo de apoio que dará acesso ao grupo do Telegram.
          </p>
          <p className="text-xs text-blue-600">
            <strong>Importante:</strong> Apoiadores deste nível E de níveis inferiores terão acesso ao grupo.
            Se não selecionar nenhum, todos os apoiadores terão acesso.
          </p>
        </div>
      )}

      {rewardLevels.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="text-yellow-500 text-4xl mb-3">⚠️</div>
          <h3 className="font-semibold text-gray-900 mb-2">Nenhum nível de apoio encontrado</h3>
          <p className="text-sm text-gray-600 mb-4">
            Esta campanha não possui níveis de apoio cadastrados. Todos os apoiadores terão acesso
            ao grupo.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rewardLevels
            .sort((a, b) => a.amount - b.amount)
            .map((level, index) => {
              const isSelected = selectedMinLevel === level.id;
              const levelsBelow = rewardLevels.filter(l => l.amount <= level.amount).length - 1;

              return (
                <Card
                  key={level.id}
                  className={`p-4 cursor-pointer transition-all hover:border-blue-400 ${
                    isSelected ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleLevelSelect(level.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{level.title}</h3>
                        <span className="text-sm font-medium text-blue-600">
                          {formatCurrency(level.amount)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{level.description}</p>
                      {isSelected && levelsBelow > 0 && (
                        <div className="mt-2 bg-green-50 border border-green-200 rounded p-2">
                          <p className="text-xs text-green-700">
                            ✓ Este nível + {levelsBelow} {levelsBelow === 1 ? 'nível inferior' : 'níveis inferiores'} terão acesso
                          </p>
                        </div>
                      )}
                      {level.benefits && level.benefits.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Benefícios:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {level.benefits.map((benefit, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-blue-500 mr-2">✓</span>
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <input
                        type="radio"
                        name="minSupportLevel"
                        checked={isSelected}
                        onChange={() => handleLevelSelect(level.id)}
                        className="w-5 h-5 text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-sm text-gray-700">
          <strong>Nível mínimo selecionado:</strong>{' '}
          {selectedMinLevel === null ? (
            <span className="text-gray-500">
              Nenhum (todos os apoiadores terão acesso)
            </span>
          ) : (
            <span className="text-blue-600">
              {rewardLevels.find(l => l.id === selectedMinLevel)?.title}
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-3">
        <Button onClick={onCancel} variant="outline" fullWidth>
          Voltar
        </Button>
        <Button onClick={handleConfirm} fullWidth>
          Continuar
        </Button>
      </div>
    </div>
  );
}
