// Sistema de Performance e Otimizações Mobile
export class MobilePerformanceOptimizer {
  private static instance: MobilePerformanceOptimizer;
  
  static getInstance() {
    if (!MobilePerformanceOptimizer.instance) {
      MobilePerformanceOptimizer.instance = new MobilePerformanceOptimizer();
    }
    return MobilePerformanceOptimizer.instance;
  }

  // Lazy loading de imagens com intersection observer
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // Otimização de scroll performático
  setupVirtualScrolling(containerRef: HTMLElement, itemHeight: number, items: any[]) {
    const container = containerRef;
    const totalHeight = items.length * itemHeight;
    const visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
    
    let startIndex = 0;
    
    const updateVisibleItems = () => {
      const scrollTop = container.scrollTop;
      startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleItems, items.length);
      
      // Renderizar apenas itens visíveis
      const visibleData = items.slice(startIndex, endIndex);
      return { visibleData, startIndex, totalHeight };
    };

    container.addEventListener('scroll', updateVisibleItems, { passive: true });
    return updateVisibleItems();
  }

  // Debounce para inputs
  debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    }) as T;
  }

  // Throttle para scroll events
  throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }

  // Preload de recursos críticos
  preloadCriticalResources() {
    const criticalResources = [
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png',
      '/src/aventuri.png'
    ];

    criticalResources.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  // Otimização de bateria
  optimizeForBattery() {
    // Reduzir animações quando bateria baixa
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2) {
          document.documentElement.style.setProperty('--animation-duration', '0ms');
          console.log('Modo economia de bateria ativado');
        }
      });
    }
  }

  // Service Worker para cache estratégico
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/advanced-sw.js')
        .then(registration => {
          console.log('Service Worker registrado com sucesso');
          
          // Atualização automática
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nova versão disponível
                  this.showUpdateAvailable();
                }
              });
            }
          });
        })
        .catch(error => console.log('Service Worker falhou:', error));
    }
  }

  private showUpdateAvailable() {
    // Mostrar toast de atualização disponível
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div class="fixed top-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div class="flex justify-between items-center">
          <span>Nova versão disponível!</span>
          <button onclick="window.location.reload()" class="bg-white text-blue-600 px-3 py-1 rounded text-sm">
            Atualizar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
  }

  // Detecção de capacidades do dispositivo
  getDeviceCapabilities() {
    return {
      touchSupport: 'ontouchstart' in window,
      accelerometer: 'DeviceMotionEvent' in window,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      bluetooth: 'bluetooth' in navigator,
      nfc: 'nfc' in navigator,
      share: 'share' in navigator,
      wakeLock: 'wakeLock' in navigator,
      storage: 'storage' in navigator && 'estimate' in navigator.storage,
    };
  }

  // Modo escuro automático
  setupDarkModeDetection() {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    
    darkModeQuery.addListener(updateTheme);
    updateTheme(darkModeQuery);
  }

  // Inicializar todas as otimizações
  initialize() {
    this.setupLazyLoading();
    this.preloadCriticalResources();
    this.optimizeForBattery();
    this.registerServiceWorker();
    this.setupDarkModeDetection();
    
    console.log('🚀 Otimizações móveis ativadas');
    console.log('📱 Capacidades do dispositivo:', this.getDeviceCapabilities());
  }
}