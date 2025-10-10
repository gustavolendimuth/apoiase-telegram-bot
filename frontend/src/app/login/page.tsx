'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast('error', 'Preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      showToast('success', 'Login realizado com sucesso!');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao fazer login';
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            APOIA.se + Telegram
          </h1>
          <p className="text-gray-600">
            Entre para gerenciar suas integrações
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="E-mail"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <Input
            type="password"
            label="Senha"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            Entrar
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Ambiente de desenvolvimento
          </p>
          <p className="text-xs mt-2">
            Use qualquer email/senha para testar
          </p>
        </div>
      </Card>
    </div>
  );
}
