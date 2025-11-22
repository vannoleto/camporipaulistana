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
  ArrowLeft,
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
  Car,
  FileText as FileTextIcon,
  Newspaper,
  BookOpen,
  Map,
  School,
  ClipboardCheck
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
  const [selectedBulletin, setSelectedBulletin] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
  // SISTEMA: Clubes iniciam com 1910 pontos e PERDEM pontos por não atender critérios
  const calculateTotalScore = (scores: any) => {
    if (!scores || !scoringCriteria) return 1910; // Pontuação máxima inicial

    const MAX_SCORE = 1910;
    let totalPenalty = 0;
    let demeritsPenalty = 0;

    // Calcular penalidades baseado nos critérios dinâmicos
    Object.keys(scores).forEach(category => {
      if (!scoringCriteria[category]) return; // Ignorar categorias sem critérios

      const categoryScores = scores[category];
      if (typeof categoryScores !== 'object') return;

      // DEMÉRITOS: São valores negativos, somar diretamente
      if (category === 'demerits') {
        Object.keys(categoryScores).forEach(key => {
          const demeritValue = categoryScores[key];
          if (typeof demeritValue === 'number') {
            demeritsPenalty += Math.abs(demeritValue); // Converter para positivo para somar à penalidade
          }
        });
        return;
      }

      // OUTRAS CATEGORIAS: Sistema de penalidade por não atingir máximo
      Object.keys(categoryScores).forEach(key => {
        const earnedPoints = categoryScores[key];
        if (typeof earnedPoints !== 'number') return; // Ignorar objetos aninhados

        const criterion = scoringCriteria[category]?.[key];
        if (!criterion) return; // Ignorar critérios não definidos

        const maxPoints = criterion.max || 0;
        const partialPoints = criterion.partial || 0;

        // Calcular penalidade baseado no que foi conquistado
        let penalty = 0;

        if (earnedPoints === maxPoints) {
          // Ganhou pontuação máxima → Não perde nada
          penalty = 0;
        } else if (earnedPoints === partialPoints && partialPoints > 0) {
          // Ganhou pontuação parcial → Perde a diferença (max - parcial)
          penalty = maxPoints - partialPoints;
        } else if (earnedPoints === 0) {
          // Ganhou zero → Perde tudo (max)
          penalty = maxPoints;
        } else {
          // Caso customizado: perde a diferença entre max e o que ganhou
          penalty = maxPoints - earnedPoints;
        }

        totalPenalty += penalty;
      });
    });

    // Pontuação final = Máximo (1910) - Penalidades totais - Deméritos
    return Math.max(0, MAX_SCORE - totalPenalty - demeritsPenalty);
  };

  // Função para obter classificação baseada na pontuação
  const getClassification = (totalScore: number): string => {
    if (totalScore >= 1496) return "MISSIONÁRIO";
    if (totalScore >= 1232) return "VOLUNTÁRIO";
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
    const maxPossibleScore = 1910; // Score máximo possível
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
            {classification === "MISSIONÁRIO" ? (
              <>
                <Crown size={20} className="mr-2" />
                MISSIONÁRIO
              </>
            ) : classification === "VOLUNTÁRIO" ? (
              <>
                <Trophy size={20} className="mr-2" />
                VOLUNTÁRIO
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
              {calculateTotalScore(userClub.scores).toLocaleString()}
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
                Faltam {(1232 - totalScore).toLocaleString()} pontos para VOLUNTÁRIO
              </div>
            )}
            {classification === "VOLUNTÁRIO" && (
              <div className="text-lg font-semibold text-purple-600">
                Faltam {(1496 - totalScore).toLocaleString()} pontos para MISSIONÁRIO
              </div>
            )}
            {classification === "MISSIONÁRIO" && (
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

  const renderSchedule = () => {
    const scheduleData = [
      {
        day: "Quinta-feira",
        date: "20/11/2025",
        events: [
          { time: "8h", title: "Abertura de portões e montagem da área de acampamento", location: "Chegada dos clubes e liberação do check-in que deve ser feito na secretaria" },
          { time: "14h", title: "Tomada de eventos + Atividades extras", location: "Conforme escala por região" },
          { time: "18h30", title: "Jantar", location: "" },
          { time: "19h30", title: "Pré-programa", location: "" },
          { time: "20h", title: "Abertura XXI Campori", location: "" },
          { time: "20h30", title: "Reunião de diretores", location: "Presença facultativa" },
          { time: "22h30", title: "Horário de silêncio", location: "" },
        ]
      },
      {
        day: "Sexta-feira",
        date: "21/11/2025",
        events: [
          { time: "6h", title: "Despertar", location: "" },
          { time: "6h30", title: "Devoção matinal", location: "Individualmente ou por unidade" },
          { time: "6h30", title: "Reunião de diretoria", location: "" },
          { time: "7h", title: "Desjejum", location: "" },
          { time: "7h45", title: "Pré-programa", location: "" },
          { time: "8h", title: "Programa matinal", location: "" },
          { time: "9h", title: "Carrossel de eventos + Atividades extras", location: "Conforme escala por região" },
          { time: "10h", title: "Finais concursos", location: "Conforme quadro de concursos" },
          { time: "12h", title: "Almoço", location: "" },
          { time: "13h", title: "Finais concursos", location: "Conforme quadro de concursos" },
          { time: "13h", title: "Carrossel de eventos + Atividades extras", location: "Conforme escala por região" },
          { time: "14h30", title: "Início do 24h", location: "Concentração no palco da arena" },
          { time: "17h45", title: "Culto de pôr-do-sol", location: "A ser realizado no próprio clube" },
          { time: "18h30", title: "Jantar", location: "" },
          { time: "19h30", title: "Pré-programa", location: "" },
          { time: "20h", title: "Programa noturno", location: "Investiduras" },
          { time: "22h30", title: "Horário de silêncio", location: "" },
        ]
      },
      {
        day: "Sábado",
        date: "22/11/2025",
        events: [
          { time: "6h30", title: "Despertar", location: "" },
          { time: "7h", title: "Devoção matinal", location: "Individualmente ou por unidade" },
          { time: "7h", title: "Reunião de diretoria", location: "" },
          { time: "7h30", title: "Desjejum", location: "" },
          { time: "8h", title: "Início da inspeção de uniforme", location: "Uniforme A e banderim" },
          { time: "8h45", title: "Pré-programa", location: "" },
          { time: "9h", title: "Culto de adoração", location: "" },
          { time: "11h", title: "Escola Sabatina", location: "Com clube-amigo" },
          { time: "12h", title: "Almoço", location: "" },
          { time: "13h", title: "Finais concursos", location: "Conforme quadro de concursos" },
          { time: "16h", title: "Programa vespertino", location: "Com retorno do 24h" },
          { time: "18h", title: "Jantar", location: "" },
          { time: "19h", title: "Finais concursos", location: "Conforme quadro de concursos" },
          { time: "20h", title: "Livre", location: "Brinquedos, esportes, Shopping Campori e atividades extras" },
          { time: "22h30", title: "Fogo do Conselho", location: "" },
          { time: "23h30", title: "Horário de silêncio", location: "" },
        ]
      },
      {
        day: "Domingo",
        date: "23/11/2025",
        events: [
          { time: "7h", title: "Despertar", location: "" },
          { time: "7h30", title: "Devoção matinal", location: "Individualmente ou por unidade" },
          { time: "8h", title: "Reunião de diretoria", location: "Com Desjejum" },
          { time: "8h45", title: "Pré-programa", location: "" },
          { time: "9h", title: "Encerramento XXI Campori", location: "" },
          { time: "11h", title: "Entrega de troféus", location: "" },
          { time: "11h", title: "Desmontagem da área de acampamento", location: "Check-out deve ser feito na secretaria" },
          { time: "11h30", title: "Atividades extras", location: "Conforme escala por região" },
          { time: "16h", title: "Fechamento dos portões", location: "" },
        ]
      }
    ];

    const concursos = [
      { name: "Quem Sabe Prova", categories: [
        { type: "Prova objetiva", day: "Sábado", time: "13h", location: "Restaurante" },
        { type: "Grande final", day: "Sábado", time: "19h", location: "Auditório" },
      ]},
      { name: "The Voice Paulistana", categories: [
        { type: "Voz", day: "Sábado", time: "13h", location: "Auditório do Estúdio" },
        { type: "Instrumento", day: "Sexta", time: "15h", location: "Auditório do Estúdio" },
      ]},
      { name: "Pregador Mirim", categories: [
        { type: "10-12 anos", day: "Sábado", time: "13h", location: "Rádio" },
        { type: "13-15 anos", day: "Sexta", time: "13h", location: "Rádio" },
        { type: "16-21 anos", day: "Sexta", time: "17h", location: "Rádio" },
      ]},
      { name: "Ordem Unida", categories: [
        { type: "Conjunto", day: "Sábado", time: "19h", location: "Quadra 1" },
        { type: "Geométrica", day: "Sábado", time: "19h", location: "Quadra 2" },
        { type: "Evolução", day: "Sábado", time: "19h", location: "Quadra 3" },
        { type: "Fanfarra", day: "Sexta", time: "10h", location: "Quadra 1" },
      ]},
    ];

    const atividadesExtras = [
      { name: "MAB", items: [
        { type: "Museu", days: "Quinta - Domingo", schedule: "Conforme escala" },
        { type: "Jardim", days: "Quinta - Domingo", schedule: "Conforme escala" },
      ]},
      { name: "Especialidades", items: [
        { type: "Skate", days: "Quinta - Sexta", schedule: "Conforme agendamento prévio" },
        { type: "Dinossauros", days: "Quinta - Sexta", schedule: "Conforme agendamento prévio" },
        { type: "Troca de pins", days: "Quinta - Sábado", schedule: "Conforme agendamento prévio" },
      ]},
      { name: "Centro White", items: [
        { type: "—", days: "Quinta - Sexta, Domingo", schedule: "Conforme agendamento prévio" },
      ]},
      { name: "Gravação da Bíblia", items: [
        { type: "—", days: "Quinta - Sábado", schedule: "" },
      ]},
      { name: "Save Point", items: [
        { type: "Ludoteca", days: "Quinta - Domingo", schedule: "Conforme escala" },
        { type: "Campeonato de Excelência", days: "Quinta - Sexta", schedule: "Conforme agendamento prévio" },
      ]},
    ];

    return (
      <div className="p-4 space-y-4 pb-24">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          📅 Cronograma XXI Campori Paulistana
        </h2>

        {/* Programação por dia */}
        {scheduleData.map((day, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-campori-navy to-campori-darkGreen text-white p-3">
              <h3 className="text-lg font-bold">{day.day}</h3>
              <p className="text-sm opacity-90">{day.date}</p>
            </div>
            <div className="divide-y divide-gray-200">
              {day.events.map((event, eventIdx) => (
                <div key={eventIdx} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-14">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-campori-navy bg-blue-100 rounded">
                        {event.time}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm">{event.title}</h4>
                      {event.location && (
                        <p className="text-xs text-gray-600 mt-1">{event.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Quadro de Concursos */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
          <div className="bg-blue-600 text-white p-3">
            <h3 className="text-lg font-bold">🏆 Quadro de Concursos</h3>
          </div>
          <div className="p-4 space-y-4">
            {concursos.map((concurso, idx) => (
              <div key={idx}>
                <h4 className="font-bold text-blue-800 mb-2">{concurso.name}</h4>
                <div className="space-y-2">
                  {concurso.categories.map((cat, catIdx) => (
                    <div key={catIdx} className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="font-medium text-gray-700">{cat.type}</span>
                        <span className="text-gray-600">{cat.day} - {cat.time}</span>
                        <span className="col-span-2 text-xs text-gray-500">📍 {cat.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atividades Extras */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-purple-600 text-white p-3">
            <h3 className="text-lg font-bold">✨ Atividades Extras</h3>
          </div>
          <div className="p-4 space-y-4">
            {atividadesExtras.map((atividade, idx) => (
              <div key={idx}>
                <h4 className="font-bold text-purple-800 mb-2">{atividade.name}</h4>
                <div className="space-y-2">
                  {atividade.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="bg-gray-50 p-3 rounded-lg text-sm">
                      {item.type !== "—" && <div className="font-medium text-gray-700 mb-1">{item.type}</div>}
                      <div className="text-xs text-gray-600">
                        <span className="font-semibold">📅 {item.days}</span>
                        {item.schedule && <span className="ml-2">• {item.schedule}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ Informações Importantes:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Presença obrigatória em cultos e programas oficiais</li>
            <li>• Check-in e check-out devem ser feitos na secretaria</li>
            <li>• Horário de silêncio deve ser rigorosamente cumprido</li>
            <li>• Verifique o quadro de avisos para atualizações</li>
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
                {classification === "MISSIONÁRIO" ? (
                  <span className="flex items-center gap-1">
                    <Crown size={16} />
                    MISSIONÁRIO
                  </span>
                ) : classification === "VOLUNTÁRIO" ? (
                  <span className="flex items-center gap-1">
                    <Trophy size={16} />
                    VOLUNTÁRIO
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
                  {(currentScores?.secretary?.firstAidKit || 0) + (currentScores?.secretary?.secretaryFolder || 0) + 
                   (currentScores?.secretary?.healthFolder || 0)}
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
                {getClassification(calculateTotalScore(currentScores)) === "MISSIONÁRIO" ? (
                  <>
                    <Crown size={20} className="text-yellow-500" />
                    MISSIONÁRIO
                  </>
                ) : getClassification(calculateTotalScore(currentScores)) === "VOLUNTÁRIO" ? (
                  <>
                    <Trophy size={20} className="text-blue-500" />
                    VOLUNTÁRIO
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

        {/* Renderizar TODAS as categorias dinamicamente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {scoringCriteria && Object.keys(scoringCriteria).map((category) => {
            const categoryData = scoringCriteria[category];
            const categoryScores = currentScores[category] || {};
            
            // Verificar se a categoria tem dados válidos
            if (!categoryData || typeof categoryData !== 'object' || Object.keys(categoryData).length === 0) {
              return null;
            }

            // Mapear nomes e ícones das categorias
            const categoryNames: Record<string, string> = {
              prerequisites: 'Pré-requisitos',
              campground: 'Área de Acampamento',
              kitchen: 'Cozinha',
              participation: 'Participação',
              uniform: 'Uniforme',
              secretary: 'Secretaria',
              events: 'Eventos/Provas',
              bonus: 'Bônus',
              demerits: 'Deméritos'
            };

            const categoryIcons: Record<string, React.ReactElement> = {
              prerequisites: <ClipboardList size={20} />,
              campground: <Home size={20} />,
              kitchen: <ChefHat size={20} />,
              participation: <Users size={20} />,
              uniform: <Shirt size={20} />,
              secretary: <FileText size={20} />,
              events: <Star size={20} />,
              bonus: <Trophy size={20} />,
              demerits: <X size={20} />
            };

            const categoryName = categoryNames[category] || category;
            const categoryIcon = categoryIcons[category] || <Target size={20} />;
            const isDemerits = category === 'demerits';

            return renderScoringSection(
              <span className="flex items-center gap-2">
                {categoryIcon}
                {categoryName}
              </span>,
              category,
              categoryData,
              categoryScores,
              isDemerits
            );
          })}
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    // Função para atualizar dados (simula refresh pois Convex já atualiza automaticamente)
    const handleRefresh = () => {
      setIsRefreshing(true);
      // O Convex já atualiza automaticamente via useQuery
      // Apenas mostrar feedback visual ao usuário
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success("Histórico atualizado!");
      }, 500);
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
            disabled={isRefreshing}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
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

        {/* Aviso sobre persistência do histórico */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <Shield size={18} />
            Sobre o Histórico de Avaliações
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Todas as avaliações realizadas pelo staff aparecem aqui em tempo real</li>
            <li>• O histórico é permanente e não pode ser alterado pelos diretores</li>
            <li>• Mostra quem avaliou, quando, qual critério e a pontuação obtida</li>
          </ul>
        </div>

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

  // Renderizar tela de Boletins
  const renderBulletins = () => {
    const bulletins = [
      { 
        id: 1, 
        title: "Boletim 01", 
        description: "Orientações Gerais",
        url: "https://drive.google.com/file/d/1xpqKa9pOE38gRIarUtvtug_Zxmul6q0P/preview",
        icon: <FileTextIcon className="w-8 h-8" />,
        color: "from-gray-500 to-gray-600"
      },
      { 
        id: 2, 
        title: "Boletim 02", 
        description: "Concursos",
        url: "https://drive.google.com/file/d/1eepGtq06Csn8IuDjJib44DUB73gQqYt7/preview",
        icon: <Trophy className="w-8 h-8" />,
        color: "from-orange-500 to-orange-600"
      },
      { 
        id: 3, 
        title: "Boletim 03 Verde", 
        description: "Atendimento",
        url: "https://drive.google.com/file/d/1hpUzpPKg79skBc91QngFuC_jOAsYbWvO/preview",
        icon: <Heart className="w-8 h-8" />,
        color: "from-green-500 to-green-600"
      },
      { 
        id: 4, 
        title: "Boletim 04 Vinho", 
        description: "Estrutura",
        url: "https://drive.google.com/file/d/1Z61FcoN6OB0ExSa2m5a0jEPMkd9hxKBr/preview",
        icon: <Building2 className="w-8 h-8" />,
        color: "from-red-700 to-red-800"
      },
      { 
        id: 5, 
        title: "Boletim 05 Amarelo", 
        description: "Eventos",
        url: "https://drive.google.com/file/d/1RHR9M256JbMMpAufPMcEcS-ugKMIgtfi/preview",
        icon: <Calendar className="w-8 h-8" />,
        color: "from-yellow-500 to-yellow-600"
      },
      { 
        id: 6, 
        title: "Boletim 06 Azul", 
        description: "Programa",
        url: "https://drive.google.com/file/d/1_bl-Vz5x5BRd6p-ChraWzrCUd7Q_Iilf/preview",
        icon: <Newspaper className="w-8 h-8" />,
        color: "from-blue-500 to-blue-600"
      },
      { 
        id: 7, 
        title: "Mapa do Campori", 
        description: "Localização e áreas",
        url: "https://drive.google.com/file/d/1NgNz1HCCUqrFbyUuzaKkkhDoiN-uvJOg/preview",
        icon: <Map className="w-8 h-8" />,
        color: "from-teal-500 to-teal-600"
      },
      { 
        id: 8, 
        title: "Escola Sabatina", 
        description: "Orientações e programação",
        url: "https://drive.google.com/file/d/1L-2dgdCpAP0kKKg4ttdVoU0Zn2IfcHxb/preview",
        icon: <School className="w-8 h-8" />,
        color: "from-indigo-500 to-indigo-600"
      },
      { 
        id: 9, 
        title: "Check-in", 
        description: "Orientações de chegada",
        url: "https://drive.google.com/file/d/1hcctU63MM8jhVlQ4Pxz_5EraRQ5w1aYk/preview",
        icon: <ClipboardCheck className="w-8 h-8" />,
        color: "from-purple-500 to-purple-600"
      },
    ];

    // Se um boletim está selecionado, mostrar o PDF
    if (selectedBulletin) {
      return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header do visualizador */}
          <div className="bg-gradient-to-r from-campori-navy to-campori-darkGreen text-white p-4 shadow-lg flex items-center justify-between">
            <button
              onClick={() => setSelectedBulletin(null)}
              className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Voltar</span>
            </button>
            <div className="text-center flex-1">
              <h2 className="font-bold text-lg">{selectedBulletin.title}</h2>
              <p className="text-sm text-white/80">{selectedBulletin.description}</p>
            </div>
            <a
              href={selectedBulletin.url.replace('/preview', '/view')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <Download size={20} />
            </a>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 bg-gray-100">
            <iframe
              src={selectedBulletin.url}
              className="w-full h-full border-0"
              title={selectedBulletin.title}
              allow="autoplay"
            />
          </div>
        </div>
      );
    }

    // Lista de boletins
    return (
      <div className="p-4 space-y-4 pb-24">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            📰 Boletins do Campori
          </h2>
          <p className="text-sm text-gray-600">
            Clique em um boletim para visualizar
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {bulletins.map((bulletin) => (
            <button
              key={bulletin.id}
              onClick={() => setSelectedBulletin(bulletin)}
              className="group relative overflow-hidden bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${bulletin.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              <div className="p-6 flex items-center space-x-4">
                <div className={`flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br ${bulletin.color} flex items-center justify-center text-white shadow-lg`}>
                  {bulletin.icon}
                </div>
                
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {bulletin.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {bulletin.description}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <FileTextIcon size={18} />
            Informação
          </h4>
          <p className="text-sm text-blue-700">
            Toque em qualquer boletim para visualizar o PDF completo. Use o botão de download para salvar uma cópia.
          </p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const currentTab = externalActiveTab || internalActiveTab;
    switch (currentTab) {
      case "home": return renderHome();
      case "bulletins": return renderBulletins();
      case "schedule": return renderSchedule();
      case "reports": return renderScoring();
      case "profile": return renderHistory();
      default: return renderHome();
    }
  };

  const [showUserMenu, setShowUserMenu] = useState(false);

  const tabs = [
    { id: "bulletins", name: "Boletins", icon: <Newspaper size={20} /> },
    { id: "schedule", name: "Cronograma", icon: <Calendar size={20} /> },
    { id: "home", name: "Início", icon: <Home size={20} /> },
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
              className={`flex flex-col items-center py-2 px-3 transition-all duration-200 relative ${
                activeTab === tab.id
                  ? "text-campori-navy"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.id === "home" ? (
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-campori-navy to-campori-darkGreen flex items-center justify-center shadow-md">
                    <Home size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                </div>
              ) : (
                <span className={activeTab === tab.id ? "text-indigo-600" : "text-current"}>
                  {tab.icon}
                </span>
              )}
              <span className="text-xs mt-1 font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
