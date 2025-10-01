import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DiagnosticItem {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export function MobileDiagnostic() {
  const diagnostics: DiagnosticItem[] = [
    {
      name: 'Viewport Meta Tag',
      status: document.querySelector('meta[name="viewport"]') ? 'success' : 'error',
      message: 'Mobile viewport configuration'
    },
    {
      name: 'PWA Manifest',
      status: document.querySelector('link[rel="manifest"]') ? 'success' : 'error',
      message: 'Progressive Web App configuration'
    },
    {
      name: 'Service Worker',
      status: 'serviceWorker' in navigator ? 'success' : 'warning',
      message: 'Background sync and offline capabilities'
    },
    {
      name: 'Touch Support',
      status: 'ontouchstart' in window ? 'success' : 'warning',
      message: 'Touch event handling'
    },
    {
      name: 'Device Pixel Ratio',
      status: window.devicePixelRatio > 1 ? 'success' : 'warning',
      message: `DPR: ${window.devicePixelRatio}`
    },
    {
      name: 'Screen Size',
      status: window.innerWidth < 768 ? 'success' : 'warning',
      message: `${window.innerWidth}x${window.innerHeight}px`
    },
    {
      name: 'User Agent',
      status: /Mobi|Android/i.test(navigator.userAgent) ? 'success' : 'warning',
      message: 'Mobile device detection'
    }
  ];

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📱 Diagnóstico Mobile
      </h3>
      
      <div className="space-y-3">
        {diagnostics.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-2 rounded border">
            {getIcon(item.status)}
            <div className="flex-1">
              <div className="font-medium text-sm">{item.name}</div>
              <div className="text-xs text-gray-600">{item.message}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded border">
        <h4 className="font-medium text-sm mb-2">Informações do Sistema:</h4>
        <div className="text-xs space-y-1">
          <div>Navigator: {navigator.userAgent.split(' ').slice(0, 3).join(' ')}</div>
          <div>Platform: {navigator.platform}</div>
          <div>Language: {navigator.language}</div>
          <div>Connection: {(navigator as any).connection?.effectiveType || 'Unknown'}</div>
        </div>
      </div>

      <button 
        onClick={() => {
          const element = document.querySelector('[data-diagnostic]');
          if (element) element.remove();
        }}
        className="mt-3 w-full py-2 bg-indigo-600 text-white rounded font-medium text-sm hover:bg-indigo-700"
      >
        Fechar Diagnóstico
      </button>
    </div>
  );
}