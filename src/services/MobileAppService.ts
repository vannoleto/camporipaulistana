// Sistema de Notificações Push e Cache Offline
class MobileAppService {
  private static instance: MobileAppService;
  private cacheName = 'aventuri-cache-v1';
  private isOnline = navigator.onLine;

  static getInstance(): MobileAppService {
    if (!MobileAppService.instance) {
      MobileAppService.instance = new MobileAppService();
    }
    return MobileAppService.instance;
  }

  constructor() {
    this.setupNetworkListener();
    this.setupPushNotifications();
  }

  // Configurar listener de status da rede
  private setupNetworkListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showToast('Conectado à internet', 'success');
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showToast('Modo offline ativado', 'warning');
    });
  }

  // Configurar notificações push
  private async setupPushNotifications() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Permissão para notificações concedida');
      }
    }
  }

  // Mostrar notificação
  showNotification(title: string, options?: NotificationOptions) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const defaultOptions: NotificationOptions = {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        ...options,
      };
      
      new Notification(title, defaultOptions);
      
      // Vibração separada para dispositivos que suportam
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }

  // Sistema de cache inteligente
  async cacheData(key: string, data: any, expiry?: number) {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry: expiry || 24 * 60 * 60 * 1000, // 24 horas por padrão
    };

    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
      
      // Cache no Service Worker também
      if ('caches' in window) {
        const cache = await caches.open(this.cacheName);
        const response = new Response(JSON.stringify(data));
        await cache.put(new Request(key), response);
      }
    } catch (error) {
      console.warn('Erro ao salvar no cache:', error);
    }
  }

  // Recuperar dados do cache
  async getCachedData(key: string) {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        
        if (now - cacheData.timestamp < cacheData.expiry) {
          return cacheData.data;
        } else {
          localStorage.removeItem(`cache_${key}`);
        }
      }

      // Tentar cache do Service Worker
      if ('caches' in window) {
        const cache = await caches.open(this.cacheName);
        const response = await cache.match(key);
        if (response) {
          return await response.json();
        }
      }
    } catch (error) {
      console.warn('Erro ao recuperar do cache:', error);
    }
    
    return null;
  }

  // Toast notifications mobile
  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const toast = document.createElement('div');
    toast.className = `mobile-toast mobile-toast-${type}`;
    toast.textContent = message;
    
    const styles = {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: this.getToastColor(type),
      color: 'white',
      padding: '12px 20px',
      borderRadius: '25px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '10000',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(10px)',
      animation: 'slideDown 0.3s ease-out',
      maxWidth: '90vw',
      textAlign: 'center',
    } as any;

    Object.assign(toast.style, styles);
    document.body.appendChild(toast);

    // Vibração para feedback háptico
    if ('vibrate' in navigator) {
      const pattern = type === 'error' ? [100, 50, 100] : [50];
      navigator.vibrate(pattern);
    }

    setTimeout(() => {
      toast.style.animation = 'slideUp 0.3s ease-in';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  private getToastColor(type: string): string {
    switch (type) {
      case 'success': return 'linear-gradient(135deg, #10B981, #059669)';
      case 'error': return 'linear-gradient(135deg, #EF4444, #DC2626)';
      case 'warning': return 'linear-gradient(135deg, #F59E0B, #D97706)';
      default: return 'linear-gradient(135deg, #3B82F6, #2563EB)';
    }
  }

  // Sincronizar dados offline
  private async syncOfflineData() {
    const offlineActions = JSON.parse(localStorage.getItem('offline_actions') || '[]');
    
    for (const action of offlineActions) {
      try {
        // Executar ação offline quando voltar online
        await this.executeOfflineAction(action);
      } catch (error) {
        console.error('Erro ao sincronizar ação offline:', error);
      }
    }
    
    localStorage.removeItem('offline_actions');
  }

  private async executeOfflineAction(action: any) {
    // Implementar lógica de sincronização baseada no tipo de ação
    console.log('Executando ação offline:', action);
  }

  // Salvar ação para sincronização posterior
  saveOfflineAction(action: any) {
    const offlineActions = JSON.parse(localStorage.getItem('offline_actions') || '[]');
    offlineActions.push(action);
    localStorage.setItem('offline_actions', JSON.stringify(offlineActions));
  }

  // Status da conexão
  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      connection: (navigator as any).connection || null,
    };
  }

  // Instalar PWA
  async installPWA() {
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.showToast('App instalado com sucesso!', 'success');
      }
      
      (window as any).deferredPrompt = null;
    }
  }
}

export default MobileAppService;

// CSS para animações de toast
const toastStyles = `
@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
}
`;

// Adicionar estilos ao documento
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = toastStyles;
  document.head.appendChild(style);
}