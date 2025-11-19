import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  BarChart3, 
  Trophy, 
  Crown, 
  Star, 
  Building2,
  DoorOpen,
  User,
  Home,
  Calendar,
  Newspaper,
  Target,
  MapPin,
  Users,
  Globe,
  FileText,
  Map,
  School,
  ClipboardCheck,
  Heart,
  Search,
  ArrowLeft,
  Download,
  ArrowRight
} from "lucide-react";

interface MDADashboardProps {
  user: any;
  onLogout: () => void;
}

export function MDADashboard({ user, onLogout }: MDADashboardProps) {
  const [activeTab, setActiveTab] = useState("home");
  const [clubSearch, setClubSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState<any>(null);
  const [selectedClub, setSelectedClub] = useState<any>(null);

  // Buscar TODOS os clubes (diferente do Regional que filtra por região)
  const regionClubs = useQuery(api.clubs.listClubs, {});
  
  // Buscar dados do clube selecionado
  const clubDetails = useQuery(
    api.clubs.getClubById, 
    selectedClub ? { clubId: selectedClub._id } : "skip"
  );
  
  // Buscar histórico de avaliações do clube selecionado
  const clubActivityLogs = useQuery(
    api.clubs.getClubActivityLogs,
    selectedClub ? { clubId: selectedClub._id } : "skip"
  );
  
  // Buscar critérios de pontuação (para cálculo de progresso)
  const scoringCriteria = useQuery(api.scoring.getScoringCriteria, {});

  // Calcular estatísticas da região
  const regionStats = regionClubs ? {
    total: regionClubs.length,
    averageScore: regionClubs.length > 0 
      ? Math.round(regionClubs.reduce((sum, club) => sum + club.totalScore, 0) / regionClubs.length)
      : 0,
    classifications: {
      MISSIONÁRIO: regionClubs.filter(c => c.classification === "MISSIONÁRIO").length,
      VOLUNTÁRIO: regionClubs.filter(c => c.classification === "VOLUNTÁRIO").length,
      APRENDIZ: regionClubs.filter(c => c.classification === "APRENDIZ").length,
    },
    highestScore: regionClubs.length > 0 ? Math.max(...regionClubs.map(c => c.totalScore)) : 0,
    lowestScore: regionClubs.length > 0 ? Math.min(...regionClubs.map(c => c.totalScore)) : 0,
    totalMembers: regionClubs.reduce((sum, club) => sum + (club.membersCount || 0), 0),
  } : null;

  // Filtrar clubes baseado na busca
  const filteredClubs = regionClubs?.filter(club => {
    if (!clubSearch) return true;
    
    const searchLower = clubSearch.toLowerCase();
    return (
      club.name.toLowerCase().includes(searchLower) ||
      club.classification?.toLowerCase().includes(searchLower)
    );
  });

  // Renderizar Home (Overview)
  const renderHome = () => (
    <div className="space-y-4">
      {/* Cabeçalho com nome da região */}
      <div className="bg-gradient-to-r from-campori-navy to-campori-darkGreen text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Visão Geral</h2>
            <p className="text-white/80 text-sm">Todos os Clubes do Campori</p>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900">{regionStats?.total || 0}</div>
          <div className="text-sm text-gray-600 font-medium">Clubes</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-green-100">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900">
            {regionStats?.averageScore.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600 font-medium">Média</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-yellow-100">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-900">
            {regionStats?.highestScore.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600 font-medium">Maior</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-900">
            {regionStats?.classifications.MISSIONÁRIO || 0}
          </div>
          <div className="text-sm text-gray-600 font-medium">Missionários</div>
        </div>
      </div>

      {/* Distribuição por classificação */}
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Distribuição por Classificação</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-bold text-purple-900">MISSIONÁRIO</div>
                <div className="text-xs text-purple-600">
                  {regionStats && regionStats.total > 0 
                    ? Math.round((regionStats.classifications.MISSIONÁRIO / regionStats.total) * 100) 
                    : 0}% do total
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {regionStats?.classifications.MISSIONÁRIO || 0}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-bold text-blue-900">VOLUNTÁRIO</div>
                <div className="text-xs text-blue-600">
                  {regionStats && regionStats.total > 0 
                    ? Math.round((regionStats.classifications.VOLUNTÁRIO / regionStats.total) * 100) 
                    : 0}% do total
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {regionStats?.classifications.VOLUNTÁRIO || 0}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-bold text-green-900">APRENDIZ</div>
                <div className="text-xs text-green-600">
                  {regionStats && regionStats.total > 0 
                    ? Math.round((regionStats.classifications.APRENDIZ / regionStats.total) * 100) 
                    : 0}% do total
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {regionStats?.classifications.APRENDIZ || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Card de membros totais */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90 mb-1">Total de Membros</div>
            <div className="text-4xl font-bold">{regionStats?.totalMembers || 0}</div>
          </div>
          <Users className="w-16 h-16 opacity-20" />
        </div>
      </div>
    </div>
  );

  // Renderizar Clubes
  const renderClubs = () => (
    <div className="space-y-4">
      {/* Cabeçalho com busca */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-3 text-gray-800">Todos os Clubes</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar clube..."
            value={clubSearch}
            onChange={(e) => setClubSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        {clubSearch && (
          <div className="mt-2 text-sm text-gray-600">
            {filteredClubs?.length || 0} de {regionClubs?.length || 0} clubes encontrados
          </div>
        )}
      </div>

      {/* Grid de clubes */}
      <div className="space-y-3">
        {filteredClubs?.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {clubSearch ? "Nenhum clube encontrado" : "Nenhum clube cadastrado"}
            </p>
          </div>
        ) : (
          filteredClubs
            ?.sort((a, b) => b.totalScore - a.totalScore)
            .map((club, index) => (
              <button
                key={club._id}
                onClick={() => setSelectedClub(club)}
                className="w-full bg-white p-4 rounded-xl shadow-sm border-2 border-gray-100 hover:border-blue-200 transition-all text-left"
              >
                {/* Posição e Nome */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? "bg-yellow-500 text-white" :
                      index === 1 ? "bg-gray-400 text-white" :
                      index === 2 ? "bg-orange-500 text-white" :
                      "bg-gray-200 text-gray-700"
                    }`}>
                      {index + 1}º
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{club.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600 font-medium">
                          {club.membersCount || 0} membros
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>

                {/* Pontuação */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pontuação Total</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {club.totalScore.toLocaleString()}
                      <span className="text-sm text-gray-600 ml-1">pts</span>
                    </span>
                  </div>
                </div>

                {/* Classificação e Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex-1 px-3 py-2 rounded-lg text-center text-sm font-bold ${
                    club.classification === "MISSIONÁRIO" 
                      ? "bg-purple-100 text-purple-800"
                      : club.classification === "VOLUNTÁRIO"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {club.classification === "MISSIONÁRIO" && <Crown className="w-4 h-4 inline mr-1" />}
                    {club.classification === "VOLUNTÁRIO" && <Trophy className="w-4 h-4 inline mr-1" />}
                    {club.classification === "APRENDIZ" && <Target className="w-4 h-4 inline mr-1" />}
                    {club.classification}
                  </span>
                  <span className={`px-3 py-2 rounded-lg text-xs font-medium ${
                    club.isActive 
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {club.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </button>
            ))
        )}
      </div>
    </div>
  );

  // Renderizar detalhes do clube
  const renderClubDetails = () => {
    if (!selectedClub || !clubDetails || !scoringCriteria) return null;

    // Calcular progresso baseado em critérios avaliados
    
    // Contar critérios avaliados
    const evaluatedCriteria = clubActivityLogs?.length || 0;
    
    // Contar total de critérios possíveis
    let totalCriteria = 0;
    if (scoringCriteria?.categories) {
      scoringCriteria.categories.forEach((category: any) => {
        if (category.criteria && Array.isArray(category.criteria)) {
          totalCriteria += category.criteria.length;
        }
      });
    }
    
    // Se não houver avaliações, progresso é 0%
    const progress = (evaluatedCriteria === 0 || totalCriteria === 0) 
      ? 0 
      : Math.round((evaluatedCriteria / totalCriteria) * 100);

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-campori-navy to-campori-darkGreen text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedClub(null)}
              className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Voltar</span>
            </button>
            <div className="text-center flex-1">
              <h2 className="font-bold text-lg">{clubDetails.name}</h2>
              <p className="text-sm text-white/80">{clubDetails.region}</p>
            </div>
            <div className="w-20"></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {/* Gráfico de Progresso */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-4">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{clubDetails.name}</h3>
              <p className="text-sm text-gray-600">{clubDetails.region}</p>
            </div>

            {/* Circular Progress */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg className="transform -rotate-90" width="200" height="200">
                  {/* Background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke="#10b981"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 90}`}
                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold text-gray-800">{progress}%</div>
                  <div className="text-sm text-gray-600 mt-1">Progresso</div>
                </div>
              </div>
            </div>

            {/* Classification Badge */}
            <div className="flex justify-center mb-4">
              <span className={`px-6 py-3 rounded-full text-lg font-bold inline-flex items-center gap-2 ${
                clubDetails.classification === "MISSIONÁRIO" 
                  ? "bg-green-100 text-green-800"
                  : clubDetails.classification === "VOLUNTÁRIO"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {clubDetails.classification === "MISSIONÁRIO" && <Crown className="w-6 h-6" />}
                {clubDetails.classification === "VOLUNTÁRIO" && <Trophy className="w-6 h-6" />}
                {clubDetails.classification === "APRENDIZ" && <Target className="w-6 h-6" />}
                {clubDetails.classification}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {clubDetails.totalScore.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">Pontos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {clubDetails.membersCount || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Membros</div>
              </div>
            </div>
          </div>

          {/* Histórico de Avaliações */}
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Histórico de Avaliações</h3>
            
            {!clubActivityLogs || clubActivityLogs.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma avaliação registrada ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clubActivityLogs.map((log: any) => {
                  // Determinar o tipo de avaliação
                  const isDemerit = log.category === 'Deméritos' || log.criterion?.toLowerCase().includes('demérito');
                  const scoreValue = log.scoreChange?.newValue || 0;
                  const maxValue = log.maxScore || 0;
                  
                  // Calcular pontuação para exibição
                  let displayScore = 0;
                  let scoreLabel = '';
                  let borderColor = 'border-blue-500';
                  let textColor = 'text-gray-600';
                  
                  if (isDemerit) {
                    // Deméritos sempre negativos
                    displayScore = Math.abs(scoreValue);
                    scoreLabel = `${scoreValue} pts`;
                    borderColor = 'border-red-500';
                    textColor = 'text-red-600';
                  } else if (scoreValue === maxValue && maxValue > 0) {
                    // Pontuação máxima
                    displayScore = scoreValue;
                    scoreLabel = `+${scoreValue} pts`;
                    borderColor = 'border-green-500';
                    textColor = 'text-green-600';
                  } else if (scoreValue > 0 && scoreValue < maxValue) {
                    // Pontuação parcial
                    displayScore = scoreValue;
                    scoreLabel = `+${scoreValue} pts`;
                    borderColor = 'border-yellow-500';
                    textColor = 'text-yellow-600';
                  } else if (scoreValue === 0) {
                    // Não pontuou
                    displayScore = maxValue;
                    scoreLabel = `0 pts (perdeu ${maxValue})`;
                    borderColor = 'border-gray-400';
                    textColor = 'text-gray-600';
                  }
                  
                  return (
                    <div key={log._id} className={`border-l-4 ${borderColor} bg-gray-50 p-4 rounded-r-lg`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{log.criterion}</h4>
                          <p className="text-sm text-gray-600">{log.category}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${textColor}`}>
                            {scoreLabel}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                        <span>Avaliado por: {log.evaluatorName}</span>
                        <span>{new Date(log.timestamp).toLocaleDateString('pt-BR')} às {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      {log.notes && (
                        <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded">
                          💬 {log.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar Cronograma
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
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-campori-navy to-campori-darkGreen text-white p-4 rounded-xl">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Cronograma XXI Campori
          </h2>
        </div>

        {/* Programação por dia */}
        {scheduleData.map((day, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-campori-navy to-campori-darkGreen text-white p-3">
              <h3 className="text-lg font-bold">{day.day}</h3>
              <p className="text-sm opacity-90">{day.date}</p>
            </div>
            <div className="divide-y divide-gray-200">
              {day.events.map((event, eventIdx) => (
                <div key={eventIdx} className="p-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-campori-navy bg-blue-100 rounded min-w-[3rem]">
                      {event.time}
                    </span>
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
      </div>
    );
  };

  // Renderizar Boletins (mesmo layout do DirectorDashboard)
  const renderBulletins = () => {
    const bulletins = [
      { 
        id: 1, 
        title: "Boletim 01", 
        description: "Orientações Gerais",
        url: "https://drive.google.com/file/d/1xpqKa9pOE38gRIarUtvtug_Zxmul6q0P/preview",
        icon: <FileText className="w-8 h-8" />,
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

    // Lista de boletins (mesmo layout do DirectorDashboard)
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
            <FileText size={18} />
            Informação
          </h4>
          <p className="text-sm text-blue-700">
            Toque em qualquer boletim para visualizar o PDF completo. Use o botão de download para salvar uma cópia.
          </p>
        </div>
      </div>
    );
  };

  // Renderizar visualizador de boletim
  const renderBulletinViewer = () => {
    if (!selectedBulletin) return null;

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
  };

  // Renderizar conteúdo baseado na aba ativa
  const renderContent = () => {
    if (selectedClub) return renderClubDetails();
    if (selectedBulletin) return renderBulletinViewer();

    switch (activeTab) {
      case "home":
        return renderHome();
      case "clubs":
        return renderClubs();
      case "schedule":
        return renderSchedule();
      case "bulletins":
        return renderBulletins();
      default:
        return renderHome();
    }
  };

  const tabs = [
    { id: "home", name: "Início", icon: <Home size={20} /> },
    { id: "clubs", name: "Clubes", icon: <Building2 size={20} /> },
    { id: "schedule", name: "Cronograma", icon: <Calendar size={20} /> },
    { id: "bulletins", name: "Boletins", icon: <Newspaper size={20} /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Mobile */}
      <div className="bg-gradient-to-r from-campori-navy to-campori-darkGreen text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Globe size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                Bem-vindo, {user.name}
              </h2>
              <p className="text-xs text-indigo-200">
                MDA/Coordenador
              </p>
              <p className="text-xs text-indigo-200">
                {user.mdaPosition || 'Coordenador'}
              </p>
            </div>
          </div>
          
          {/* Botão de usuário */}
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
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Globe size={16} className="text-campori-darkGreen" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">MDA/Coordenador - {user.mdaPosition || 'Coordenador'}</p>
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
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedClub(null);
                if (tab.id !== "bulletins") {
                  setSelectedBulletin(null);
                }
              }}
              className={`flex flex-col items-center py-2 px-3 transition-all duration-200 ${
                activeTab === tab.id
                  ? "text-campori-darkGreen"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className={`${
                activeTab === tab.id ? "scale-110" : "scale-100"
              } transition-transform duration-200`}>
                {tab.icon}
              </div>
              <span className={`text-xs mt-1 font-medium ${
                activeTab === tab.id ? "font-bold" : ""
              }`}>
                {tab.name}
              </span>
              {activeTab === tab.id && (
                <div className="h-1 w-1 bg-campori-darkGreen rounded-full mt-1" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
