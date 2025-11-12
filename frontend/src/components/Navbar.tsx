"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    router.push('/');
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  return (
    <>
      {/* Header */}
      <header className="bg-[#fbf6f3] border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/logo.svg"
                  alt="APOIA.se"
                  width={160}
                  height={45}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>

            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Navigation */}
              <nav className="hidden md:flex gap-6">
                <Link
                  href="/campanhas"
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
                >
                  Descobrir
                </Link>
              </nav>
              {user ? (
                <>
                  <Link
                    href="/meus-apoios"
                    className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
                  >
                    Meus Apoios
                  </Link>
                  <button
                    onClick={() => router.push('/criar-campanha')}
                    className="hidden sm:block px-4 py-2 bg-[#ed5544] text-white rounded-md hover:bg-[#d64435] transition-colors font-semibold"
                  >
                    Criar Campanha
                  </button>
                  <button
                    onClick={() => router.push('/minhas-campanhas')}
                    className="hidden sm:block px-4 py-2 border border-[#ed5544] text-[#ed5544] rounded-md hover:bg-[#ed5544]/5 transition-colors font-semibold"
                  >
                    Minhas Campanhas
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="hidden sm:block px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-semibold"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="hidden sm:block px-4 py-2 bg-[#ed5544] text-white rounded-md hover:bg-[#d64435] transition-colors font-semibold"
                  >
                    Criar conta
                  </button>
                </>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>

              {/* Profile menu */}
              {user && (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="w-10 h-10 rounded-full bg-[#ed5544] hover:bg-[#d64435] flex items-center justify-center transition-colors shadow-sm"
                  >
                    <span className="text-white font-semibold text-base">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </button>

                  {/* Dropdown menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Usuário logado
                        </p>
                      </div>
                      <Link
                        href="/minhas-campanhas"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        📋 Minhas campanhas
                      </Link>
                      <Link
                        href="/meus-apoios"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        ❤️ Meus apoios
                      </Link>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        ⚙️ Perfil
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        🚪 Sair
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-4">
            <nav className="space-y-3">
              <Link
                href="/campanhas"
                className="block text-gray-600 hover:text-gray-900 transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Descobrir
              </Link>
              {user && (
                <>
                  <Link
                    href="/meus-apoios"
                    className="block text-gray-600 hover:text-gray-900 transition-colors font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Meus Apoios
                  </Link>
                  <Link
                    href="/minhas-campanhas"
                    className="block text-gray-600 hover:text-gray-900 transition-colors font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Minhas Campanhas
                  </Link>
                </>
              )}
            </nav>
            <div className="pt-4 border-t border-gray-200 space-y-3">
              {user ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push('/criar-campanha');
                  }}
                  className="w-full px-4 py-2 bg-[#ed5544] text-white rounded-md hover:bg-[#d64435] transition-colors font-semibold"
                >
                  Criar Campanha
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push('/login');
                    }}
                    className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium border border-gray-300 rounded-md"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push('/register');
                    }}
                    className="w-full px-4 py-2 bg-[#ed5544] text-white rounded-md hover:bg-[#d64435] transition-colors font-semibold"
                  >
                    Criar conta
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
