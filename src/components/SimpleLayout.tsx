import React from 'react';

export function SimpleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header Simples */}
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-lg mb-4">
          <h1 className="text-xl font-bold text-center">AVENTURI 2025</h1>
          <p className="text-center text-sm opacity-90">Layout Mobile Ativo</p>
        </header>

        {/* Conteúdo */}
        <main className="bg-white rounded-lg p-4 shadow-sm">
          {children}
        </main>

        {/* Indicador de Status */}
        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">
              Sistema Mobile Funcionando
            </span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            Resolução: {window.innerWidth}x{window.innerHeight}px
          </div>
        </div>
      </div>
    </div>
  );
}