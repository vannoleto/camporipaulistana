import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detectar se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar prompt após um delay se não estiver instalado
      if (!standalone) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verificar se deve mostrar prompt iOS
    if (iOS && !standalone) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      
      setDeferredPrompt(null);
    }
    
    // Para iOS, apenas fechar o prompt (usuário precisa fazer manualmente)
    if (isIOS) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Não mostrar novamente por 24h
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Não mostrar se já foi dispensado recentemente
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) {
    return null;
  }

  // Não mostrar se já está instalado
  if (isStandalone) return null;

  // Não mostrar se não há prompt disponível e não é iOS
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 mx-auto max-w-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-xl">
              <Smartphone className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Instalar App</h3>
              <p className="text-sm text-gray-600">
                {isIOS ? 'Adicione à tela inicial' : 'Instale para acesso rápido'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={16} />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-xl">
              <div className="flex items-center space-x-2 text-blue-800">
                <Share size={16} />
                <span className="text-sm font-medium">Como instalar:</span>
              </div>
              <ol className="text-xs text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                <li>Toque no ícone de compartilhar</li>
                <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
                <li>Toque em "Adicionar" no canto superior direito</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 px-4 text-gray-600 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Agora não
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Download size={16} />
              <span>Instalar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}