import React, { useState, useEffect } from 'react';
import { QrCode, Download, Share, Copy, Eye, Users, MapPin } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { useHaptic } from '../hooks/useMobileGestures';
import MobileAppService from '../services/MobileAppService';

interface Club {
  _id: string;
  name: string;
  region: string;
  director?: string;
  secretary?: string;
  members?: number;
  color?: string;
}

interface ClubQRCodeProps {
  club: Club;
  onClose?: () => void;
}

export function ClubQRCode({ club, onClose }: ClubQRCodeProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const { mediumVibrate, lightVibrate } = useHaptic();
  const mobileService = MobileAppService.getInstance();

  // Dados únicos do clube para o QR Code
  const clubData = {
    id: club._id,
    name: club.name,
    region: club.region,
    director: club.director,
    secretary: club.secretary,
    members: club.members || 0,
    timestamp: Date.now(),
    // Hash único para verificação
    hash: generateClubHash(club)
  };

  const qrCodeContent = JSON.stringify(clubData);

  useEffect(() => {
    generateQRCode();
  }, []);

  function generateClubHash(club: Club): string {
    // Gerar hash único baseado nos dados do clube
    const data = `${club._id}-${club.name}-${club.region}-${Date.now()}`;
    return btoa(data).slice(0, 16);
  }

  async function generateQRCode() {
    try {
      setIsGenerating(true);
      
      // Configurações do QR Code otimizadas para mobile
      const qrOptions = {
        width: 300,
        margin: 2,
        color: {
          dark: '#1F2937', // Cor escura para contraste
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' as const, // Alta correção de erro
      };

      const dataURL = await QRCodeLib.toDataURL(qrCodeContent, qrOptions);
      setQrCodeDataURL(dataURL);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      mobileService.showToast('Erro ao gerar QR Code', 'error');
    } finally {
      setIsGenerating(false);
    }
  }

  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeContent);
      mobileService.showToast('Dados copiados!', 'success');
      lightVibrate();
    } catch (error) {
      mobileService.showToast('Erro ao copiar dados', 'error');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code - ${club.name}`,
          text: `QR Code do clube ${club.name} - ${club.region}`,
          url: window.location.href
        });
        mediumVibrate();
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      handleCopyData();
    }
  };

  const handleDownload = () => {
    if (!qrCodeDataURL) return;

    const link = document.createElement('a');
    link.download = `qr-code-${club.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrCodeDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mobileService.showToast('QR Code baixado!', 'success');
    mediumVibrate();
  };

  const handleFullScreen = () => {
    setShowFullScreen(true);
    lightVibrate();
  };

  return (
    <>
      {/* Modal Principal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-auto">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <QrCode size={24} />
                <h2 className="text-lg font-bold">QR Code do Clube</h2>
              </div>
              {onClose && (
                <button 
                  onClick={onClose}
                  className="text-white/80 hover:text-white p-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Informações do Clube */}
          <div className="p-4 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${club.color || 'bg-indigo-500'}`}>
                <Users className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{club.name}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={14} className="mr-1" />
                  {club.region}
                </div>
              </div>
            </div>
            
            {(club.director || club.secretary) && (
              <div className="mt-3 text-xs text-gray-600">
                {club.director && <div>Diretor: {club.director}</div>}
                {club.secretary && <div>Secretário: {club.secretary}</div>}
                {club.members && <div>Membros: {club.members}</div>}
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="p-6">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
              {isGenerating ? (
                <div className="w-64 h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={qrCodeDataURL} 
                    alt="QR Code do Clube" 
                    className="w-64 h-64 mx-auto cursor-pointer hover:scale-105 transition-transform"
                    onClick={handleFullScreen}
                  />
                  <button
                    onClick={handleFullScreen}
                    className="absolute bottom-2 right-2 bg-black/70 text-white p-1 rounded-full"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              Mostre este QR Code para o staff fazer a avaliação
            </p>
          </div>

          {/* Ações */}
          <div className="p-4 bg-gray-50 rounded-b-2xl">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleShare}
                className="flex flex-col items-center p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                <Share size={20} />
                <span className="text-xs mt-1">Compartilhar</span>
              </button>
              
              <button
                onClick={handleDownload}
                className="flex flex-col items-center p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                disabled={isGenerating}
              >
                <Download size={20} />
                <span className="text-xs mt-1">Baixar</span>
              </button>
              
              <button
                onClick={handleCopyData}
                className="flex flex-col items-center p-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              >
                <Copy size={20} />
                <span className="text-xs mt-1">Copiar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tela Cheia */}
      {showFullScreen && (
        <div className="fixed inset-0 bg-black z-60 flex items-center justify-center p-4">
          <div className="relative">
            <button
              onClick={() => setShowFullScreen(false)}
              className="absolute -top-12 right-0 text-white p-2 bg-black/50 rounded-full"
            >
              ✕
            </button>
            <img 
              src={qrCodeDataURL} 
              alt="QR Code do Clube - Tela Cheia" 
              className="w-80 h-80 bg-white p-4 rounded-2xl"
            />
            <div className="text-white text-center mt-4">
              <h3 className="font-bold">{club.name}</h3>
              <p className="text-sm opacity-75">{club.region}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}