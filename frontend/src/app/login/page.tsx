'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getApiUrl } from '@/lib/env';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${getApiUrl()}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Save token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Show success message
      setSuccess('Login realizado com sucesso! Redirecionando...');

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/');
        // Force page reload to update Navbar
        window.location.href = '/';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Entrar
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            Acesse sua conta APOIA.se
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <Input
                type="password"
                placeholder="Sua senha"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            {/* Register Link */}
            <div className="text-center text-sm text-gray-600">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-blue-600 hover:underline font-semibold"
              >
                Criar conta
              </button>
            </div>
          </form>
        </Card>
    </div>
  );
}
