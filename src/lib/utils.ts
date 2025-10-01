import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 📱 MOBILE APP SERVICE - Serviços para aplicações móveis
export class MobileAppService {
  // 🔔 Sistema de Toasts/Notifications
  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    console.log(`📢 Toast [${type.toUpperCase()}]:`, message);
    
    // Implementar toast visual (pode ser integrado com uma lib de toast posteriormente)
    if (typeof window !== 'undefined') {
      // Por enquanto, usar console para debug
      const emoji = {
        success: '✅',
        error: '❌', 
        info: 'ℹ️',
        warning: '⚠️'
      }[type];
      
      console.log(`${emoji} ${message}`);
    }
  }

  // 📳 Feedback Háptico
  vibrate(pattern: number | number[] = 100) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // 🎯 Feedback Háptico Específico
  lightVibrate() { this.vibrate(50); }
  mediumVibrate() { this.vibrate(100); }
  strongVibrate() { this.vibrate(200); }
  successVibrate() { this.vibrate([100, 50, 100]); }
  errorVibrate() { this.vibrate([200, 100, 200]); }

  // 🔋 Detecção de Dispositivo
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  // 📺 Gestão de Tela
  isFullscreen(): boolean {
    return !!(document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).msFullscreenElement);
  }

  async requestFullscreen(element?: HTMLElement) {
    const elem = element || document.documentElement;
    
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      await (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      await (elem as any).msRequestFullscreen();
    }
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }

  // 📷 Suporte de Câmera
  async checkCameraSupport(): Promise<boolean> {
    try {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    } catch {
      return false;
    }
  }

  async getCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }
}
