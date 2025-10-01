import { useState, useRef, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScanResult: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanResult, onClose }: QRScannerProps) {
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('Iniciando...');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Callback quando QR code é detectado
  const handleQRDetection = (result: QrScanner.ScanResult) => {
    try {
      console.log('🎯 QR Code detectado:', result.data);
      
      // Vibração de feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
      // Parar scanner
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
      }
      
      // Processar resultado
      onScanResult(result.data);
      onClose();
    } catch (error) {
      console.error('Erro ao processar QR:', error);
      setError('Erro ao processar QR Code');
    }
  };

  // Simular scan de QR code para teste
  const simulateQRScan = () => {
    const mockClubData = JSON.stringify({
      id: 'clube-001',
      name: 'Clube Teste',
      region: 'São Paulo'
    });
    onScanResult(mockClubData);
    onClose();
  };

  // Inicializar câmera com método mais robusto
  const initializeCamera = async () => {
    try {
      console.log('🚀 Iniciando câmera...');
      setError('');
      setHasPermission(null);
      setDebugInfo('Verificando suporte do navegador...');
      
      // Verificar contexto de segurança
      console.log('🔒 Contexto de segurança:', {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        isSecureContext: window.isSecureContext,
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia
      });
      
      // Verificar se o navegador suporta
      if (!navigator.mediaDevices) {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        if (protocol !== 'https:' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
          throw new Error(`❌ Câmera requer HTTPS!\n\n📱 Acesse pelo seu IP:\nhttps://192.168.15.128:5173\n\n⚠️ Você vai precisar aceitar o certificado de segurança`);
        } else {
          throw new Error('❌ Navegador não suporta MediaDevices (muito antigo?)');
        }
      }

      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('❌ Navegador não suporta getUserMedia (funcionalidade de câmera)');
      }

      console.log('🔍 Verificando permissões...');
      setDebugInfo('Solicitando permissões da câmera...');
      
      // Solicitar permissões explicitamente
      let stream: MediaStream | null = null;
      
      try {
        // Tentar câmera traseira primeiro (ideal para QR codes)
        console.log('📱 Tentando câmera traseira...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          }
        });
      } catch (backCameraError) {
        console.warn('⚠️ Câmera traseira falhou:', backCameraError);
        
        try {
          // Tentar câmera frontal
          console.log('� Tentando câmera frontal...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 }
            }
          });
        } catch (frontCameraError) {
          console.warn('⚠️ Câmera frontal falhou:', frontCameraError);
          
          // Última tentativa - qualquer câmera
          console.log('📱 Tentando qualquer câmera disponível...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }

      if (!stream) {
        throw new Error('Nenhuma câmera disponível ou permissão negada');
      }

      console.log('✅ Stream de vídeo obtido!', stream);

      // Aguardar elemento de vídeo estar disponível
      let retries = 0;
      while (!videoRef.current && retries < 10) {
        console.log(`⏳ Aguardando elemento de vídeo... tentativa ${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      if (!videoRef.current) {
        throw new Error('Elemento de vídeo não encontrado após 10 tentativas');
      }

      const video = videoRef.current;
      console.log('🎬 Elemento de vídeo encontrado:', video);
      
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;
      
      console.log('⏳ Aguardando carregamento do vídeo...');
      setDebugInfo('Carregando vídeo...');
      
      // Aguardar vídeo estar pronto
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('❌ Timeout ao carregar vídeo');
          reject(new Error('Timeout - vídeo não carregou em 15 segundos'));
        }, 15000);

        const onLoadedMetadata = () => {
          clearTimeout(timeout);
          console.log('📺 Vídeo carregado com sucesso!', {
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState
          });
          resolve();
        };

        const onError = (err: Event) => {
          clearTimeout(timeout);
          console.error('❌ Erro no elemento de vídeo:', err);
          reject(new Error('Erro ao carregar elemento de vídeo'));
        };

        const onCanPlay = () => {
          console.log('▶️ Vídeo pode ser reproduzido');
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
        video.addEventListener('error', onError, { once: true });
        video.addEventListener('canplay', onCanPlay, { once: true });

        // Forçar reprodução
        video.play().catch((playError) => {
          console.warn('⚠️ Erro ao iniciar reprodução:', playError);
          // Não falhar por causa do autoplay - vídeo pode funcionar mesmo assim
        });

        // Verificação adicional após um pequeno delay
        setTimeout(() => {
          if (video.readyState >= 2 && video.videoWidth > 0) {
            console.log('✅ Verificação adicional: vídeo está funcionando');
            onLoadedMetadata();
          }
        }, 2000);
      });
      
      setHasPermission(true);
      console.log('🎉 Câmera configurada com sucesso!');
      
      // Aguardar um pouco antes de inicializar o scanner
      setTimeout(() => {
        initializeQRScanner();
      }, 1000);

    } catch (error) {
      console.error('❌ Erro completo na inicialização da câmera:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(`Erro na câmera: ${errorMessage}`);
      setHasPermission(false);
    }
  };

  // Inicializar scanner QR de forma mais robusta
  const initializeQRScanner = async () => {
    try {
      if (!videoRef.current) {
        console.error('❌ Elemento de vídeo não disponível para QR Scanner');
        return;
      }

      const video = videoRef.current;
      
      // Verificar se o vídeo está realmente funcionando
      if (video.readyState < 2) {
        console.log('⏳ Aguardando vídeo estar completamente carregado...');
        setTimeout(() => initializeQRScanner(), 500);
        return;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('⏳ Aguardando dimensões do vídeo...');
        setTimeout(() => initializeQRScanner(), 500);
        return;
      }
      
      console.log('🔍 Inicializando QR Scanner...', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });

      // Parar scanner anterior se existir
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
      
      // Criar novo scanner
      qrScannerRef.current = new QrScanner(
        video,
        handleQRDetection,
        {
          returnDetailedScanResult: true,
          highlightScanRegion: false,
          highlightCodeOutline: false,
          preferredCamera: 'environment',
          maxScansPerSecond: 5 // Limitar para melhor performance
        }
      );
      
      // Iniciar scanning
      await qrScannerRef.current.start();
      setIsScanning(true);
      console.log('✅ QR Scanner ativo e funcionando!');
      
    } catch (error) {
      console.error('❌ Erro detalhado no QR Scanner:', error);
      
      // Tentar método alternativo - scan manual
      console.log('🔄 Tentando método de scan alternativo...');
      startManualScanning();
    }
  };

  // Método de scan manual como fallback
  const startManualScanning = () => {
    const scanInterval = setInterval(async () => {
      if (!videoRef.current || !hasPermission) {
        clearInterval(scanInterval);
        return;
      }

      try {
        const video = videoRef.current;
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        // Criar canvas para capturar frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Tentar escanear o frame
        const result = await QrScanner.scanImage(canvas);
        if (result) {
          clearInterval(scanInterval);
          handleQRDetection({ data: result } as QrScanner.ScanResult);
        }
      } catch (err) {
        // Silenciosamente continua tentando
      }
    }, 200); // Scan a cada 200ms

    // Parar após 30 segundos
    setTimeout(() => {
      clearInterval(scanInterval);
    }, 30000);

    setIsScanning(true);
    console.log('🔍 Scan manual ativo como fallback');
  };

  // Parar câmera e scanner
  const stopCamera = () => {
    try {
      console.log('🛑 Parando câmera e scanner...');
      
      // Parar QR Scanner
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
        setIsScanning(false);
      }
      
      // Parar stream da câmera
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('🔴 Track parado:', track.label);
        });
        videoRef.current.srcObject = null;
      }
      
      console.log('✅ Câmera e scanner parados');
    } catch (error) {
      console.error('❌ Erro ao parar câmera:', error);
    }
  };

  useEffect(() => {
    console.log('📱 QRScanner montado, inicializando...');
    
    // Aguardar um pouco para garantir que o DOM está pronto
    const timer = setTimeout(() => {
      initializeCamera();
    }, 100);
    
    return () => {
      console.log('📱 QRScanner desmontado, limpando...');
      clearTimeout(timer);
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
        <h1 className="text-lg font-bold">Scanner QR Code</h1>
        <button
          onClick={onClose}
          className="bg-white/20 hover:bg-white/30 rounded-full p-2"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Área do vídeo */}
      <div className="flex-1 relative">
        {hasPermission === null && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white max-w-md px-4">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg mb-2">Inicializando câmera...</p>
              <p className="text-sm text-blue-300 bg-blue-900/50 px-3 py-2 rounded-lg">{debugInfo}</p>
            </div>
          </div>
        )}

        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-6">
            <div className="text-center max-w-md">
              <Camera className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h2 className="text-xl font-bold mb-2">Problemas com a Câmera</h2>
              <p className="text-gray-300 mb-4 text-sm">{error}</p>
              
              <div className="space-y-3 mb-6">
                <div className="bg-yellow-900/50 p-3 rounded-lg text-left">
                  <p className="text-sm font-medium text-yellow-300">💡 Dicas para resolver:</p>
                  <ul className="text-xs text-yellow-200 mt-2 space-y-1">
                    <li>• Permita acesso à câmera no navegador</li>
                    <li>• Verifique se outras apps não estão usando a câmera</li>
                    <li>• Tente fechar e abrir o scanner novamente</li>
                    <li>• Use o botão "Simular QR" para testar</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    console.log('🧪 TESTE DIRETO DA CÂMERA');
                    try {
                      // Primeiro, verificar dispositivos disponíveis
                      const devices = await navigator.mediaDevices.enumerateDevices();
                      const videoDevices = devices.filter(device => device.kind === 'videoinput');
                      console.log('📱 Dispositivos de vídeo disponíveis:', videoDevices);
                      
                      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                      console.log('✅ CÂMERA FUNCIONA! Stream:', stream);
                      console.log('📹 Video tracks:', stream.getVideoTracks());
                      
                      // Mostrar informações do dispositivo
                      const videoTrack = stream.getVideoTracks()[0];
                      if (videoTrack) {
                        console.log('📱 Dispositivo:', videoTrack.label);
                        console.log('⚙️ Settings:', videoTrack.getSettings());
                        console.log('🔧 Capabilities:', videoTrack.getCapabilities());
                      }
                      
                      // Criar elemento de vídeo temporário para testar
                      const tempVideo = document.createElement('video');
                      tempVideo.srcObject = stream;
                      tempVideo.playsInline = true;
                      tempVideo.muted = true;
                      tempVideo.style.position = 'fixed';
                      tempVideo.style.top = '10px';
                      tempVideo.style.right = '10px';
                      tempVideo.style.width = '200px';
                      tempVideo.style.height = '150px';
                      tempVideo.style.zIndex = '9999';
                      tempVideo.style.border = '2px solid green';
                      document.body.appendChild(tempVideo);
                      
                      tempVideo.play();
                      
                      alert(`✅ Câmera está funcionando!\nDispositivo: ${videoTrack?.label || 'Desconhecido'}\nVídeo de teste adicionado no canto da tela`);
                      
                      // Remover após 5 segundos
                      setTimeout(() => {
                        document.body.removeChild(tempVideo);
                        stream.getTracks().forEach(track => track.stop());
                      }, 5000);
                      
                      // Tentar inicializar novamente
                      setError('');
                      setHasPermission(null);
                      initializeCamera();
                      
                    } catch (testError) {
                      console.error('❌ TESTE FALHOU:', testError);
                      const errorMessage = testError instanceof Error ? testError.message : 'Erro desconhecido';
                      alert(`❌ Teste falhou: ${errorMessage}`);
                    }
                  }}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-medium"
                >
                  🧪 Testar Câmera + Vídeo
                </button>
                
                <button
                  onClick={() => {
                    console.log('🔍 DEBUG COMPLETO DO ESTADO ATUAL:');
                    console.log('📊 hasPermission:', hasPermission);
                    console.log('❌ error:', error);
                    console.log('🔧 debugInfo:', debugInfo);
                    console.log('📹 videoRef.current:', videoRef.current);
                    console.log('🌐 navigator.mediaDevices:', !!navigator.mediaDevices);
                    console.log('📱 getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
                    
                    if (videoRef.current) {
                      const video = videoRef.current;
                      console.log('📺 Estado do vídeo:', {
                        srcObject: !!video.srcObject,
                        readyState: video.readyState,
                        videoWidth: video.videoWidth,
                        videoHeight: video.videoHeight,
                        paused: video.paused,
                        muted: video.muted,
                        playsInline: video.playsInline
                      });
                    }
                    
                    alert('Debug completo enviado para o console. Verifique o console do navegador (F12).');
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium"
                >
                  🔍 Debug Completo
                </button>

                <button
                  onClick={initializeCamera}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
                >
                  🔄 Tentar Novamente
                </button>
                
                <button
                  onClick={simulateQRScan}
                  className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium"
                >
                  🧪 Usar QR de Teste
                </button>
              </div>
            </div>
          </div>
        )}

        {hasPermission && (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover bg-black"
              playsInline
              muted
              autoPlay
              style={{ 
                minHeight: '400px',
                maxHeight: 'calc(100vh - 200px)'
              }}
            />
            
            {/* Overlay de foco */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative">
                {/* Quadrado de foco principal */}
                <div className="w-64 h-64 border-2 border-white/50 rounded-lg">
                  {/* Cantos animados */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg animate-pulse"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg animate-pulse"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg animate-pulse"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg animate-pulse"></div>
                  
                  {/* Linha de scan animada */}
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400 animate-pulse transform -translate-y-1/2"></div>
                </div>
                
                {/* Texto de instrução */}
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-white text-center">
                  <p className="text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
                    📱 Aponte para o QR Code
                  </p>
                </div>
              </div>
            </div>

            {/* Status da câmera */}
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    isScanning ? 'bg-green-400' : 'bg-yellow-400'
                  }`}></div>
                  <span className="text-sm">
                    {isScanning ? '🔍 Escaneando QR Code...' : '📹 Câmera ativa'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instruções na parte inferior */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white text-center space-y-2">
                <p className="text-sm font-medium">📸 Posicione o QR Code dentro do quadrado</p>
                <p className="text-xs opacity-75">O scan será automático quando detectado</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Botões de controle */}
      <div className="bg-gray-900 p-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white font-medium flex items-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span>Fechar</span>
          </button>
          
          {/* Botão para simular scan (apenas se não estiver escaneando) */}
          {!isScanning && (
            <button
              onClick={simulateQRScan}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-medium flex items-center space-x-2"
            >
              <Camera className="w-5 h-5" />
              <span>Simular QR (Teste)</span>
            </button>
          )}
          
          {/* Botão para reiniciar scanner */}
          {hasPermission && (
            <button
              onClick={initializeCamera}
              disabled={isScanning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg text-white font-medium flex items-center space-x-2"
            >
              <Camera className="w-5 h-5" />
              <span>Reiniciar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}