import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import QRCodeLib from 'qrcode';
import { 
  BarChart3, 
  ClipboardList, 
  Crown, 
  Trophy,
  Home,
  QrCode,
  Clock, 
  Target, 
  AlertTriangle,
  Building2,
  FileText,
  Users,
  Star,
  X,
  Scroll,
  DoorOpen,
  CheckCircle,
  RefreshCw,
  User,
  TrendingUp,
  TrendingDown,
  Shield,
  Calendar,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  UserCheck,
  Settings,
  Award,
  Calendar as CalendarIcon,
  MapPin,
  Camera,
  UserX,
  ShieldCheck,
  Folder,
  Badge,
  Shirt,
  Clock12,
  Church,
  UserPlus,
  Heart,
  XCircle,
  Volume2,
  DoorClosed,
  ChefHat,
  Download,
  Copy,
  Zap,
  Car
} from "lucide-react";

interface DirectorDashboardProps {
  user: any;
  onLogout: () => void;
  activeTab?: string; // Aba ativa vinda do MobileLayout
}

// Componente para exibir QR Code inline sem modal
function QRCodeDisplay({ club }: { club: any }) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);

  // Dados únicos do clube para o QR Code
  const clubData = {
    id: club._id,
    name: club.name,
    region: club.region,
    director: club.director,
    secretary: club.secretary,
    members: club.membersCount || club.members || 0,
    timestamp: Date.now(),
    hash: generateClubHash(club)
  };

  const qrCodeContent = JSON.stringify(clubData);

  useEffect(() => {
    generateQRCode();
  }, []);

  function generateClubHash(club: any): string {
    const data = `${club._id}-${club.name}-${club.region}-${Date.now()}`;
    return btoa(data).slice(0, 16);
  }

  async function generateQRCode() {
    try {
      setIsGenerating(true);
      
      const qrOptions = {
        width: 300,
        margin: 2,
        color: {
          dark: '#1F2937',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' as const,
      };

      const dataURL = await QRCodeLib.toDataURL(qrCodeContent, qrOptions);
      setQrCodeDataURL(dataURL);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    } finally {
      setIsGenerating(false);
    }
  }

  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeContent);
      toast.success('Dados do QR Code copiados!');
    } catch (error) {
      toast.error('Erro ao copiar dados');
    }
  };

  const handleDownload = () => {
    if (qrCodeDataURL) {
      const link = document.createElement('a');
      link.download = `qrcode-${club.name}.png`;
      link.href = qrCodeDataURL;
      link.click();
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-600">Gerando QR Code...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">{club.name}</h3>
            <p className="text-sm text-gray-600">{club.region}</p>
          </div>
          
          {qrCodeDataURL && (
            <img 
              src={qrCodeDataURL} 
              alt={`QR Code do clube ${club.name}`}
              className="mx-auto rounded-lg"
              style={{ maxWidth: '300px', width: '100%' }}
            />
          )}
          
          <p className="text-xs text-gray-500 text-center mt-4">
            Mostre este QR Code para o staff fazer a avaliação
          </p>
        </div>
      </div>

      {/* Informações do clube */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Users size={18} />
          Informações do Clube
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Nome:</span>
            <p className="font-medium">{club.name}</p>
          </div>
          <div>
            <span className="text-gray-600">Região:</span>
            <p className="font-medium">{club.region}</p>
          </div>
          {club.director && (
            <div>
              <span className="text-gray-600">Diretor:</span>
              <p className="font-medium">{club.director}</p>
            </div>
          )}
          {club.secretary && (
            <div>
              <span className="text-gray-600">Secretário:</span>
              <p className="font-medium">{club.secretary}</p>
            </div>
          )}
          <div>
            <span className="text-gray-600">Membros:</span>
            <p className="font-medium">{club.membersCount || club.members || 0}</p>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          <Download size={16} />
          Baixar
        </button>
        
        <button
          onClick={handleCopyData}
          className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Copy size={16} />
          Copiar
        </button>
      </div>
    </div>
  );
}

export function DirectorDashboard({ user, onLogout, activeTab: externalActiveTab }: DirectorDashboardProps) {
  const [internalActiveTab, setInternalActiveTab] = useState("home");
  
  // Usar activeTab interno para controle local
  const activeTab = internalActiveTab;
  const setActiveTab = setInternalActiveTab;

  // Removido showQRCode e showQRModal - QR code agora é mostrado diretamente na aba

  // Buscar dados do clube do usuário
  const userClub = useQuery(api.clubs.getClubById, { clubId: user.clubId });
  const clubs = useQuery(api.clubs.listClubs, {});
  const scoringCriteria = useQuery(api.scoring.getScoringCriteria, {});
  // Removendo query problemática que não existe
  // const evaluatedCriteria = useQuery(
  //   api.evaluation.getEvaluatedCriteria,
  //   user.clubId ? { clubId: user.clubId } : "skip"
  // );
  const evaluatedCriteria = null;
  const activityLogs = useQuery(
    api.clubs.getClubActivityLogs,
    user.clubId ? { clubId: user.clubId } : "skip"
  );
  


  // Função para calcular pontuação total baseada na estrutura de pontuações (IGUAL AO ADMINDASHBOARD E STAFFDASHBOARD)
  const calculateTotalScore = (scores: any) => {
    if (!scores) return 0;

    let totalScore = 0;

    // Somar pontuações de cada categoria
    if (scores.prerequisites) {
      Object.values(scores.prerequisites).forEach((value: any) => {
        totalScore += Math.abs(value || 0);
      });
    }

    if (scores.participation) {
      Object.values(scores.participation).forEach((value: any) => {
        totalScore += Math.abs(value || 0);
      });
    }

    if (scores.general) {
      Object.values(scores.general).forEach((value: any) => {
        totalScore += Math.abs(value || 0);
      });
    }

    if (scores.events) {
      Object.entries(scores.events).forEach(([key, value]: [string, any]) => {
        if (key === 'carousel') {
          Object.values(value).forEach((carouselValue: any) => {
            totalScore += Math.abs(carouselValue || 0);
          });
        } else {
          totalScore += Math.abs(value || 0);
        }
      });
    }

    if (scores.bonus) {
      Object.values(scores.bonus).forEach((value: any) => {
        totalScore += Math.abs(value || 0);
      });
    }

    // Deméritos são subtraídos (valores positivos representam penalidades)
    if (scores.demerits) {
      Object.values(scores.demerits).forEach((value: any) => {
        totalScore -= (value || 0);
      });
    }

    return Math.max(0, totalScore);
  };

  // Função para obter classificação baseada na pontuação
  const getClassification = (totalScore: number): string => {
    if (totalScore >= 2300) return "HEROI";
    if (totalScore >= 1100) return "FIEL_ESCUDEIRO";
    return "APRENDIZ";
  };



  const isCriteriaEvaluated = (category: string, key: string, subKey?: string): boolean => {
    // Simplificado - DirectorDashboard é somente leitura
    return false;
  };

  // Abas personalizadas para o DirectorDashboard
  const customTabs = [
    { 
      id: "home", 
      label: "Início", 
      icon: <Home size={24} />, 
      component: <div>Home content</div>
    },
    { 
      id: "overview", 
      label: "Visão Geral", 
      icon: <BarChart3 size={24} />, 
      component: <div>Overview content</div>
    },
    { 
      id: "qrcode", 
      label: "QR Code", 
      icon: <QrCode size={24} />, 
      component: <div>QR Code content</div>
    },
    { 
      id: "scoring", 
      label: "Pontuação", 
      icon: <ClipboardList size={24} />, 
      component: <div>Scoring content</div>
    },
    { 
      id: "history", 
      label: "Histórico", 
      icon: <Clock size={24} />, 
      component: <div>History content</div>
    }
  ];

  const renderHome = () => {
    if (!userClub) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Building2 size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Clube não encontrado</p>
          </div>
        </div>
      );
    }

    const currentScores = userClub.scores;
    const totalScore = calculateTotalScore(currentScores);
    const classification = getClassification(totalScore);
    const maxPossibleScore = 4100; // Score máximo possível
    const progressPercentage = Math.min((totalScore / maxPossibleScore) * 100, 100);

    return (
      <div className="p-6 space-y-6">
        {/* Header do Clube */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{userClub.name}</h1>
          <p className="text-gray-600">{userClub.region}</p>
        </div>

        {/* Progress Circle */}
        <div className="flex justify-center">
          <div className="relative w-40 h-40">
            {/* Background Circle */}
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 144 144">
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              {/* Progress Circle */}
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 64}`}
                strokeDashoffset={`${2 * Math.PI * 64 * (1 - progressPercentage / 100)}`}
                className={
                  classification === "HEROI" 
                    ? "text-purple-500"
                    : classification === "FIEL_ESCUDEIRO"
                    ? "text-blue-500"
                    : "text-green-500"
                }
                strokeLinecap="round"
              />
            </svg>
            
            {/* Content inside circle */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-gray-900">
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-sm text-gray-600">Progresso</div>
            </div>
          </div>
        </div>

        {/* Classificação Badge */}
        <div className="flex justify-center">
          <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
            classification === "HEROI" 
              ? "bg-purple-100 text-purple-800"
              : classification === "FIEL_ESCUDEIRO"
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          }`}>
            {classification === "HEROI" ? (
              <>
                <Crown size={20} className="mr-2" />
                HERÓI
              </>
            ) : classification === "FIEL_ESCUDEIRO" ? (
              <>
                <Trophy size={20} className="mr-2" />
                FIEL ESCUDEIRO
              </>
            ) : (
              <>
                <Target size={20} className="mr-2" />
                APRENDIZ
              </>
            )}
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {totalScore.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Pontos Totais</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {userClub.membersCount || 0}
            </div>
            <div className="text-sm text-gray-600">Membros</div>
          </div>
        </div>

        {/* Próximo Nível */}
        <div className="bg-gradient-to-r from-campori-navy/10 to-campori-darkGreen/10 rounded-2xl p-4">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700 mb-2">Próximo Nível</div>
            {classification === "APRENDIZ" && (
              <div className="text-lg font-semibold text-blue-600">
                Faltam {(800 - totalScore).toLocaleString()} pontos para FIEL ESCUDEIRO
              </div>
            )}
            {classification === "FIEL_ESCUDEIRO" && (
              <div className="text-lg font-semibold text-purple-600">
                Faltam {(1100 - totalScore).toLocaleString()} pontos para HERÓI
              </div>
            )}
            {classification === "HEROI" && (
              <div className="text-lg font-semibold text-purple-600">
                🎉 Nível máximo alcançado!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderQRCodeInfo = () => {
    if (!userClub) {
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Building2 size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Clube não encontrado</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">QR Code do Clube</h2>
        
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            QR Code único do clube <strong>{userClub.name}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Mostre este código para o staff durante as avaliações
          </p>
        </div>

        {/* QR Code Inline - Integrado diretamente na página */}
        <QRCodeDisplay club={userClub} />
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">💡 Como usar:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• QR code gerado automaticamente para seu clube</li>
            <li>• Mostre este código para o staff durante avaliações</li>
            <li>• O QR code é válido por 24 horas</li>
            <li>• Código único e seguro para seu clube</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderOverview = () => {
    if (!userClub) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <div className="text-gray-400 mb-4">
            <Building2 size={64} />
          </div>
          <p className="text-gray-600">Clube não encontrado ou não associado ao usuário.</p>
        </div>
      );
    }

    const currentScores = userClub.scores;
    const totalScore = calculateTotalScore(currentScores);
    const classification = getClassification(totalScore);

    return (
      <div className="space-y-6">
        {/* Informações do Clube */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{userClub.name}</h2>
              <p className="text-gray-600">Região: {userClub.region}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {totalScore.toLocaleString()} pts
              </div>
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium mt-3 ${
                classification === "HEROI" 
                  ? "bg-purple-100 text-purple-800"
                  : classification === "FIEL_ESCUDEIRO"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}>
                {classification === "HEROI" ? (
                  <span className="flex items-center gap-1">
                    <Crown size={16} />
                    HERÓI
                  </span>
                ) : classification === "FIEL_ESCUDEIRO" ? (
                  <span className="flex items-center gap-1">
                    <Trophy size={16} />
                    FIEL ESCUDEIRO
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Target size={16} />
                    APRENDIZ
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Resumo das Pontuações */}
          {currentScores && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {currentScores.prerequisites.directorPresence}
                </div>
                <div className="text-sm text-gray-600 mt-1">Pré-requisitos</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {currentScores.participation.opening + currentScores.participation.saturdayMorning + 
                   currentScores.participation.saturdayEvening + currentScores.participation.sundayMorning + 
                   currentScores.participation.sundayEvening + currentScores.participation.directorMeetingFriday +
                   currentScores.participation.directorMeetingSaturday}
                </div>
                <div className="text-sm text-gray-600 mt-1">Participação</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {currentScores.secretary.firstAidKit + currentScores.secretary.secretaryFolder + 
                   currentScores.secretary.healthFolder}
                </div>
                <div className="text-sm text-gray-600 mt-1">Secretário</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {currentScores.events.carousel + currentScores.events.extraActivities + 
                   currentScores.events.representative}
                </div>
                <div className="text-sm text-gray-600 mt-1">Eventos</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {currentScores.bonus.pastorVisit + currentScores.bonus.healthProfessional}
                </div>
                <div className="text-sm text-gray-600 mt-1">Bônus</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {currentScores.demerits.noIdentification + currentScores.demerits.unaccompanied + 
                   currentScores.demerits.inappropriate + currentScores.demerits.campingActivity + 
                   currentScores.demerits.interference + currentScores.demerits.improperClothing +
                   currentScores.demerits.disrespect + currentScores.demerits.improperBehavior +
                   currentScores.demerits.substances + currentScores.demerits.sexOpposite +
                   currentScores.demerits.artificialFires + currentScores.demerits.unauthorizedVehicles}
                </div>
                <div className="text-sm text-gray-600 mt-1">Deméritos</div>
              </div>
            </div>
          )}
        </div>

        {/* Status do Clube */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Status do Clube</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${userClub.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-700">
                {userClub.isActive ? 'Clube Ativo' : 'Clube Inativo'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-gray-700">
                Membros: {userClub.membersCount || 'Não informado'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-gray-700">
                Sistema Aditivo: Pontos somados conforme critérios atendidos
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScoring = () => {
    if (!userClub || !scoringCriteria) {
      return <div>Carregando...</div>;
    }

    const currentScores = userClub.scores || {
      prerequisites: { directorPresence: 30 },
      participation: { opening: 100, saturdayMorning: 100, saturdayNight: 100, saturdayMeeting: 50, sundayMeeting: 50 },
      general: { firstAidKit: 300, secretaryFolder: 500, doorIdentification: 200, badges: 200, uniform: 100 },
      events: { 
        twelveHour: 100, 
        carousel: { abel: 100, jacob: 100, samson: 100, rahab: 100, gideon: 100, barak: 100 }
      },
      bonus: { pastorVisit: 100, adultVolunteer: 100, healthProfessional: 100 },
      demerits: { 
        driverIssues: 0, lackReverence: 0, noBadge: 0, unaccompaniedChild: 0, 
        unauthorizedVisits: 0, vandalism: 0, silenceViolation: 0, disrespect: 0 
      }
    };

    const renderScoringSection = (title: any, category: string, data: any, scores: any, isDemerits = false) => (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          {title}
          {isDemerits && <AlertTriangle size={16} className="ml-2 text-red-500" />}
        </h3>
        <div className="space-y-4">
          {Object.entries(data).map(([key, item]: [string, any]) => {
            if (key === 'carousel') {
              return (
                <div key={key} className="border-l-4 border-blue-200 pl-4">
                  <h4 className="font-medium mb-2">Carrossel de Atividades</h4>
                  <div className="space-y-3">
                    {Object.entries(item).map(([carouselKey, carouselItem]: [string, any]) => (
                      <div key={carouselKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{carouselItem.description}</div>
                          <div className="text-xs text-gray-500">
                            Máximo: {carouselItem.max} pts
                            {carouselItem.partial !== undefined && ` | Parcial: ${carouselItem.partial} pts`}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="px-3 py-1 bg-gray-100 border rounded text-center font-medium">
                            {scores.carousel[carouselKey]} pts
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            const currentValue = scores[key];
            return (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.description}</div>
                  <div className="text-xs text-gray-500">
                    {isDemerits ? (
                      `Penalidade: ${item.penalty} pts`
                    ) : (
                      `Máximo: ${item.max} pts${item.partial !== undefined ? ` | Parcial: ${item.partial} pts` : ''}`
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isDemerits ? (
                    <div className="w-20 px-2 py-1 bg-gray-100 border rounded text-center font-medium">
                      {currentValue} pts
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-gray-100 border rounded text-center font-medium">
                      {currentValue} pts
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Pontuação do Clube</h2>
        </div>



        {/* Pontuação Atual */}
        <div className="bg-gradient-to-r from-campori-navy to-campori-darkGreen text-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Pontuação Atual</h3>
              <p className="text-blue-100">
                Inscritos: {userClub?.membersCount || 0} Membros
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">
                {calculateTotalScore(currentScores).toLocaleString()} pts
              </div>
              <div className="text-lg flex items-center gap-3 mt-2">
                {getClassification(calculateTotalScore(currentScores)) === "HEROI" ? (
                  <>
                    <Crown size={20} className="text-yellow-500" />
                    HERÓI
                  </>
                ) : getClassification(calculateTotalScore(currentScores)) === "FIEL_ESCUDEIRO" ? (
                  <>
                    <Trophy size={20} className="text-blue-500" />
                    FIEL ESCUDEIRO
                  </>
                ) : (
                  <>
                    <Target size={20} className="text-green-500" />
                    APRENDIZ
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Aviso sobre presença */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center">
            <Users size={16} className="text-blue-600 mr-2" />
            <div className="text-blue-800">
              <p className="font-medium">Controle de Presença</p>
              <p className="text-sm">
                Alguns critérios exigem 100% de presença dos membros inscritos ({userClub?.membersCount || 0} membros). Verifique se todos estão presentes antes de avaliar.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderScoringSection(
            <span className="flex items-center gap-2">
              <ClipboardList size={20} />
              Pré-requisitos
            </span>, 
            "prerequisites", scoringCriteria.prerequisites, currentScores.prerequisites
          )}
          {renderScoringSection(
            <span className="flex items-center gap-2">
              <Users size={20} />
              Participação
            </span>, 
            "participation", (scoringCriteria as any).participation, currentScores.participation
          )}
          {(currentScores as any)?.secretary && renderScoringSection(
            <span className="flex items-center gap-2">
              <Target size={20} />
              Secretário
            </span>, 
            "secretary", (scoringCriteria as any).secretary, (currentScores as any).secretary
          )}
          {renderScoringSection(
            <span className="flex items-center gap-2">
              <Star size={20} />
              Eventos
            </span>, 
            "events", (scoringCriteria as any).events, currentScores.events
          )}
          {renderScoringSection(
            <span className="flex items-center gap-2">
              <Trophy size={20} />
              Bônus
            </span>, 
            "bonus", (scoringCriteria as any).bonus, currentScores.bonus
          )}
          {renderScoringSection(
            <span className="flex items-center gap-2">
              <X size={20} />
              Deméritos
            </span>, 
            "demerits", (scoringCriteria as any).demerits, currentScores.demerits, true
          )}
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    // Função para atualizar dados
    const handleRefresh = () => {
      window.location.reload();
    };

    // Função para formatar data e hora
    const formatDateTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    // Função para obter o texto descritivo da categoria
    const getCategoryDescription = (log: any) => {
      if (!log.scoreChange) return log.details || 'Alteração no sistema';
      
      const { category, subcategory } = log.scoreChange;
      
      // Mapear categorias para descrições em português
      const categoryMap: any = {
        'prerequisites': 'Pré-requisitos',
        'campground': 'Área de Acampamento',
        'kitchen': 'Cozinha',
        'participation': 'Participação',
        'uniform': 'Uniforme',
        'secretary': 'Secretaria',
        'events': 'Eventos/Provas',
        'bonus': 'Bônus',
        'demerits': 'Deméritos'
      };

      // Mapear subcategorias para descrições específicas
      const subcategoryMap: any = {
        // Pré-requisitos
        'directorPresence': 'Presença do diretor na reunião prévia',
        
        // Área de Acampamento
        'portal': 'Portal identificado',
        'clothesline': 'Varal de roupas',
        'pioneers': 'Pequenas pioneiras',
        'campfireArea': 'Área cercada',
        'materials': 'Depósito de materiais',
        'tentOrganization': 'Organização das barracas',
        'security': 'Segurança',
        'readyCamp': 'Acampamento pronto',
        'chairsOrBench': 'Cadeiras/banquetas',
        
        // Cozinha
        'tentSetup': 'Montagem da tenda',
        'identification': 'Identificação da cozinha',
        'tentSize': 'Tamanho da tenda',
        'gasRegister': 'Gás e mangueira',
        'firePosition': 'Posição do fogão',
        'refrigerator': 'Posição da geladeira',
        'tables': 'Tomadas/mesas',
        'extinguisher': 'Extintor de incêndio',
        'menu': 'Cardápio vegetariano',
        'menuDisplay': 'Exposição do cardápio',
        'containers': 'Recipientes adequados',
        'uniform': 'Uniforme da equipe',
        'handSanitizer': 'Higienizador de mãos',
        'washBasin': 'Lavatório',
        'cleaning': 'Limpeza do local',
        'water': 'Água potável',
        'identification2': 'Saquetas identificadas',
        
        // Participação
        'opening': 'Programa de abertura',
        'saturdayMorning': 'Sexta-feira manhã',
        'saturdayEvening': 'Sexta-feira noite',
        'sundayMorning': 'Sábado manhã',
        'saturdayAfternoon': 'Sábado tarde',
        'sundayEvening': 'Domingo manhã',
        'directorMeetingFriday': 'Reunião diretoria sexta',
        'directorMeetingSaturday': 'Reunião diretoria sábado',
        
        // Uniforme
        'programmedUniform': 'Uniforme programado sábado manhã',
        'badges': 'Bandeirins das unidades',
        
        // Secretaria
        'firstAidKit': 'Kit primeiros socorros completo',
        'secretaryFolder': 'Pasta de secretaria completa',
        'healthFolder': 'Pasta de saúde completa',
        
        // Eventos
        'carousel': 'Participação carrossel aventura',
        'extraActivities': 'Participação atividades extras',
        'representative': 'Representante no 24h',
        
        // Deméritos
        'unaccompanied': 'Desbravador desacompanhado (por desbravador)',
        'noIdentification': 'Membro sem pulseira de identificação',
        'inappropriate': 'Uso inapropriado de lanternas/laser/instrumentos',
        'campingActivity': 'Atividade na área ou som alto após silêncio',
        'interference': 'Visitas interferindo fora do período',
        'improperClothing': 'Roupas inapropriadas ou sem camisa',
        'disrespect': 'Desrespeito ao staff ou agressão',
        'improperBehavior': 'Contato físico excessivo entre casais',
        'substances': 'Uso/posse de substâncias ilícitas',
        'sexOpposite': 'Entrar em barracas do sexo oposto',
        'artificialFires': 'Uso de fogos artificiais',
        'unauthorizedVehicles': 'Veículos não autorizados',
        
        // Bônus
        'pastorVisit': 'Visita do pastor distrital',
        'healthProfessional': 'Profissional de saúde na escala'
      };

      const categoryText = categoryMap[category] || category;
      const subcategoryText = subcategoryMap[subcategory] || subcategory;
      
      return `${categoryText} → ${subcategoryText}`;
    };

    // Função para obter ícone específico da subcategoria
    const getSpecificIcon = (log: any) => {
      if (!log.scoreChange) return <FileText size={16} className="text-gray-600" />;
      
      const { category, subcategory } = log.scoreChange;
      
      // Ícones específicos para cada subcategoria
      const specificIconMap: any = {
        // Pré-requisitos
        'directorPresence': <UserCheck size={16} className="text-green-600" />,
        
        // Área de Acampamento
        'portal': <Home size={16} className="text-blue-600" />,
        'clothesline': <Home size={16} className="text-gray-600" />,
        'pioneers': <Home size={16} className="text-green-600" />,
        'campfireArea': <Home size={16} className="text-orange-600" />,
        'materials': <Home size={16} className="text-brown-600" />,
        'tentOrganization': <Home size={16} className="text-blue-600" />,
        'security': <Shield size={16} className="text-red-600" />,
        'readyCamp': <Home size={16} className="text-green-600" />,
        'chairsOrBench': <Home size={16} className="text-gray-600" />,
        
        // Cozinha
        'tentSetup': <ChefHat size={16} className="text-orange-600" />,
        'identification': <ChefHat size={16} className="text-blue-600" />,
        'tentSize': <ChefHat size={16} className="text-gray-600" />,
        'gasRegister': <ChefHat size={16} className="text-red-600" />,
        'firePosition': <ChefHat size={16} className="text-orange-600" />,
        'refrigerator': <ChefHat size={16} className="text-cyan-600" />,
        'tables': <ChefHat size={16} className="text-brown-600" />,
        'extinguisher': <Shield size={16} className="text-red-600" />,
        'menu': <ChefHat size={16} className="text-green-600" />,
        'menuDisplay': <ChefHat size={16} className="text-blue-600" />,
        'containers': <ChefHat size={16} className="text-gray-600" />,
        'uniform': <ChefHat size={16} className="text-blue-600" />,
        'handSanitizer': <ChefHat size={16} className="text-green-600" />,
        'washBasin': <ChefHat size={16} className="text-cyan-600" />,
        'cleaning': <ChefHat size={16} className="text-green-600" />,
        'water': <ChefHat size={16} className="text-blue-600" />,
        'identification2': <ChefHat size={16} className="text-purple-600" />,
        
        // Participação
        'opening': <Users size={16} className="text-blue-600" />,
        'saturdayMorning': <Users size={16} className="text-green-600" />,
        'saturdayEvening': <Users size={16} className="text-purple-600" />,
        'sundayMorning': <Users size={16} className="text-yellow-600" />,
        'saturdayAfternoon': <Users size={16} className="text-orange-600" />,
        'sundayEvening': <Users size={16} className="text-pink-600" />,
        'directorMeetingFriday': <CalendarIcon size={16} className="text-purple-600" />,
        'directorMeetingSaturday': <CalendarIcon size={16} className="text-blue-600" />,
        
        // Uniforme
        'programmedUniform': <Shirt size={16} className="text-blue-600" />,
        'badges': <Award size={16} className="text-yellow-600" />,
        
        // Secretaria
        'firstAidKit': <Heart size={16} className="text-red-600" />,
        'secretaryFolder': <FileText size={16} className="text-blue-600" />,
        'healthFolder': <Heart size={16} className="text-green-600" />,
        
        // Eventos
        'carousel': <Trophy size={16} className="text-gold-600" />,
        'extraActivities': <Star size={16} className="text-purple-600" />,
        'representative': <UserCheck size={16} className="text-orange-600" />,
        
        // Bônus
        'pastorVisit': <Users size={16} className="text-green-600" />,
        'healthProfessional': <Heart size={16} className="text-blue-600" />,
        
        // Deméritos
        'noIdentification': <UserX size={16} className="text-red-600" />,
        'unaccompanied': <UserX size={16} className="text-red-600" />,
        'inappropriate': <XCircle size={16} className="text-red-600" />,
        'campingActivity': <Volume2 size={16} className="text-red-600" />,
        'interference': <DoorClosed size={16} className="text-red-600" />,
        'improperClothing': <Shirt size={16} className="text-red-600" />,
        'disrespect': <XCircle size={16} className="text-red-600" />,
        'improperBehavior': <XCircle size={16} className="text-red-600" />,
        'substances': <XCircle size={16} className="text-red-600" />,
        'sexOpposite': <DoorClosed size={16} className="text-red-600" />,
        'artificialFires': <Zap size={16} className="text-red-600" />,
        'unauthorizedVehicles': <Car size={16} className="text-red-600" />
      };
      
      // Se existe ícone específico, usar ele, senão usar ícone da categoria
      if (specificIconMap[subcategory]) {
        return specificIconMap[subcategory];
      }
      
      // Fallback para ícones de categoria
      const categoryIconMap: any = {
        'prerequisites': <CheckCircle size={16} className="text-green-600" />,
        'participation': <Users size={16} className="text-blue-600" />,
        'general': <Settings size={16} className="text-purple-600" />,
        'events': <Target size={16} className="text-orange-600" />,
        'bonus': <Star size={16} className="text-yellow-600" />,
        'demerits': <AlertTriangle size={16} className="text-red-600" />
      };
      
      return categoryIconMap[category] || <FileText size={16} className="text-gray-600" />;
    };

    // Função para determinar se é demérito
    const isDemerit = (log: any) => {
      return log.scoreChange && log.scoreChange.category === 'demerits';
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardList size={24} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Histórico de Alterações</h2>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Estatísticas do histórico */}
        {activityLogs && activityLogs.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total de registros: {activityLogs.length}</span>
              <span>Última atualização: {formatDateTime(activityLogs[0]?.timestamp || Date.now()).split(',')[1]}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {!activityLogs ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Clock size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600">Carregando histórico...</p>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Scroll size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600">Nenhuma alteração registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activityLogs.map((log: any) => {
                const isDemeritsLog = isDemerit(log);
                const hasScoreChange = log.scoreChange;
                const scoreDifference = hasScoreChange ? log.scoreChange.difference : 0;
                
                // Determinar cor do traço baseado no tipo de alteração
                let borderColor = 'border-blue-200'; // Padrão
                
                if (isDemeritsLog) {
                  borderColor = 'border-red-500'; // Vermelho para deméritos
                } else if (hasScoreChange && scoreDifference > 0) {
                  borderColor = 'border-green-500'; // Verde para ganho de pontos
                } else if (hasScoreChange && scoreDifference < 0) {
                  borderColor = 'border-red-500'; // Vermelho para perda de pontos
                }
                
                return (
                  <div key={log._id} className={`border-l-4 ${borderColor} pl-4 py-4 hover:bg-gray-50 transition-colors`}>
                    {/* Data e hora */}
                    <div className="flex items-center space-x-2 text-sm text-blue-600 mb-2">
                      <Calendar size={16} />
                      <span className="font-medium">{formatDateTime(log.timestamp)}</span>
                    </div>
                    
                    {/* Badge do clube e nome do avaliador */}
                    <div className="flex items-center space-x-6 mb-3">
                      <div className="flex items-center space-x-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                        <Building2 size={12} />
                        <span>{userClub?.name || 'MEU CLUBE'}</span>
                      </div>
                      {userClub?.region && (
                        <div className="flex items-center space-x-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                          <MapPin size={12} />
                          <span>{userClub.region}</span>
                        </div>
                      )}
                      
                      {/* Nome do usuário que fez a alteração - mais à esquerda */}
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-600 font-medium">{log.userName}</span>
                      </div>
                    </div>

                    {/* Descrição da alteração com ícone específico */}
                    <div className="flex items-center space-x-2 mb-3">
                      {getSpecificIcon(log)}
                      <span className={`text-sm font-medium ${isDemeritsLog ? 'text-red-700' : 'text-gray-700'}`}>
                        {getCategoryDescription(log)}
                      </span>
                    </div>

                    {/* Mudança de pontuação */}
                    {log.scoreChange && (
                      <div className="flex items-center space-x-2">
                        <ArrowRight size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {log.scoreChange.oldValue} pts → {log.scoreChange.newValue} pts
                        </span>
                        <div className="flex items-center space-x-1">
                          {log.scoreChange.difference > 0 ? (
                            <ArrowUp size={14} className="text-green-600" />
                          ) : (
                            <ArrowDown size={14} className="text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${
                            log.scoreChange.difference > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {log.scoreChange.difference > 0 ? '+' : ''}{log.scoreChange.difference} pts
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Funções de renderização de conteúdo para as abas
  const renderScoringContent = () => renderScoring();
  const renderHistoryContent = () => renderHistory();

  const renderContent = () => {
    const currentTab = externalActiveTab || internalActiveTab;
    switch (currentTab) {
      case "home": return renderHome();
      case "club": return renderOverview();
      case "qrcode": return renderQRCodeInfo();
      case "reports": return renderScoring();
      case "profile": return renderHistory();
      default: return renderHome();
    }
  };

  const [showUserMenu, setShowUserMenu] = useState(false);

  const tabs = [
    { id: "home", name: "Início", icon: <Home size={20} /> },
    { id: "club", name: "Clube", icon: <Users size={20} /> },
    { id: "qrcode", name: "QR Code", icon: <QrCode size={20} /> },
    { id: "reports", name: "Relatórios", icon: <BarChart3 size={20} /> },
    { id: "profile", name: "Histórico", icon: <Clock size={20} /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Mobile */}
      <div className="bg-gradient-to-r from-campori-navy to-campori-darkGreen text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                Bem-vindo, {user.name || 'Diretor'}
              </h2>
              <p className="text-xs text-indigo-200">
                {user.role === 'director' ? 'Diretor' : 'Secretário'}
              </p>
              {userClub && (
                <>
                  <p className="text-xs text-indigo-200">
                    {userClub.name} | {userClub.region}
                  </p>
                  <p className="text-xs text-indigo-200">
                    {userClub.membersCount || 0} membros
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Botão de usuário simplificado */}
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative"
          >
            <User className="w-5 h-5 text-white" />
            
            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{user.name || 'Diretor'}</p>
                      <p className="text-xs text-gray-500">{user.role === 'director' ? 'Diretor' : 'Secretário'}</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <DoorOpen size={16} />
                    Sair do Sistema
                  </button>
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Overlay para fechar o menu */}
        {showUserMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4">
          {renderContent()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-3 transition-all duration-200 ${
                activeTab === tab.id
                  ? "text-campori-navy"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className={activeTab === tab.id ? "text-indigo-600" : "text-current"}>
                {tab.icon}
              </span>
              <span className="text-xs mt-1 font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
