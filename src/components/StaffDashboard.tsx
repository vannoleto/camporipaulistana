import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { 
  ClipboardList,
  Users, 
  Trophy, 
  Target, 
  Building2,
  X,
  User,
  DoorOpen,
  Shield,
  FileText,
  Save,
  Search,
  Calendar,
  MapPin,
  Crown,
  Star,
  ArrowLeft,
  CheckCircle,
  Award
} from "lucide-react";

interface StaffDashboardProps {
  user: any;
  onLogout: () => void;
}

export function StaffDashboard({ user, onLogout }: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState("evaluation"); // evaluation, search, schedule
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scores, setScores] = useState<any>({});
  const [lockedCriteria, setLockedCriteria] = useState<Set<string>>(new Set());

  const clubs = useQuery(api.clubs.listClubs, {});
  const scoringCriteria = useQuery(api.scoring.getScoringCriteria, {});
  const selectedClubData = useQuery(
    api.clubs.getClubById, 
    selectedClub ? { clubId: selectedClub._id } : "skip"
  );
  const updateClubScores = useMutation(api.clubs.updateClubScores);

  // Criar estrutura completa de scores AUTOMATICAMENTE a partir dos critérios do Convex
  // Esta função é dinâmica e não requer manutenção manual
  const createCompleteScoresStructure = (existingScores: any = {}, criteria: any = null) => {
    if (!criteria) {
      // Fallback para estrutura mínima se critérios não estiverem carregados
      return {
        prerequisites: { photos: 0, directorPresence: 0 },
        participation: { opening: 0, saturdayMorning: 0, saturdayNight: 0, saturdayMeeting: 0, sundayMeeting: 0 },
        general: { firstAidKit: 0, secretaryFolder: 0, doorIdentification: 0, badges: 0, uniform: 0 },
        events: { twelveHour: 0, carousel: { abel: 0, jacob: 0, samson: 0, rahab: 0, gideon: 0, barak: 0 } },
        bonus: { pastorVisit: 0, adultVolunteer: 0, healthProfessional: 0 },
        demerits: { driverIssues: 0, lackReverence: 0, noBadge: 0, unaccompaniedChild: 0, unauthorizedVisits: 0, vandalism: 0, silenceViolation: 0, disrespect: 0 },
      };
    }

    // Gerar estrutura dinamicamente baseada nos critérios carregados
    const scores: any = {};
    
    // Mapear categorias válidas do schema do Convex
    const validCategories = ['prerequisites', 'participation', 'general', 'events', 'bonus', 'demerits'];
    
    validCategories.forEach(category => {
      if (criteria[category]) {
        scores[category] = {};
        
        Object.entries(criteria[category]).forEach(([key, item]: [string, any]) => {
          // Se for carousel (objeto aninhado)
          if (key === 'carousel' && typeof item === 'object') {
            scores[category][key] = {};
            Object.keys(item).forEach(carouselKey => {
              scores[category][key][carouselKey] = existingScores?.[category]?.[key]?.[carouselKey] || 0;
            });
          } else {
            // Campo normal
            scores[category][key] = existingScores?.[category]?.[key] || 0;
          }
        });
      }
    });

    return scores;
  };

  // Inicializar scores quando um clube é selecionado
  const initializeScores = (club: any) => {
    setSelectedClub(club);
    setScores(createCompleteScoresStructure(club.scores, scoringCriteria));
    setLockedCriteria(new Set());
  };

  const handleScoreChange = (category: string, key: string, value: number) => {
    setScores((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // Função para aplicar pontuação e travar critério
  const applyScore = (category: string, key: string, value: number) => {
    const criteriaKey = `${category}.${key}`;
    
    // Atualizar score
    setScores((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));

    // Travar critério
    setLockedCriteria((prev) => new Set(prev).add(criteriaKey));

    toast.success(`Critério avaliado: ${value} pts`);
  };

  // Verificar se um critério está travado
  const isCriteriaLocked = (category: string, key: string): boolean => {
    return lockedCriteria.has(`${category}.${key}`);
  };

  const handleSave = async () => {
    if (!selectedClub) {
      toast.error("Nenhum clube selecionado");
      return;
    }

    try {
      await updateClubScores({
        clubId: selectedClub._id,
        scores: scores,
        userId: user._id,
      });
      toast.success("Avaliação salva com sucesso!");
      setSelectedClub(null);
      setScores({});
      setLockedCriteria(new Set());
    } catch (error: any) {
      console.error("Erro ao salvar avaliação:", error);
      toast.error(error.message || "Erro ao salvar avaliação");
    }
  };

  // Função para calcular pontuação total
  // SISTEMA: Clubes iniciam com 1910 pontos e PERDEM pontos por não atender critérios
  const calculateTotalScore = (clubScores: any) => {
    if (!clubScores) return 1910; // Pontuação máxima inicial

    const MAX_SCORE = 1910;
    let penalties = 0;

    // Calcular penalidades (pontos perdidos) por cada categoria
    Object.values(clubScores).forEach((category: any) => {
      if (typeof category === 'object') {
        Object.values(category).forEach((value: any) => {
          penalties += Math.abs(value || 0);
        });
      }
    });

    // Pontuação final = Máximo - Penalidades
    return Math.max(0, MAX_SCORE - penalties);
  };

  // Função para calcular classificação
  const getClassification = (score: number) => {
    if (score >= 1496) return { name: "MISSIONÁRIO", color: "text-purple-600", bg: "bg-purple-100", icon: <Crown size={12} /> };
    if (score >= 1232) return { name: "VOLUNTÁRIO", color: "text-blue-600", bg: "bg-blue-100", icon: <Trophy size={12} /> };
    return { name: "APRENDIZ", color: "text-green-600", bg: "bg-green-100", icon: <Star size={12} /> };
  };

  // Filtrar clubes pela busca
  const filteredClubs = clubs?.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.region?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Renderizar formulário de avaliação
  const renderEvaluationForm = () => {
    if (!selectedClub || !scoringCriteria) return null;

    // Mapear apenas as categorias que existem no schema do Convex
    const validCategories = ['prerequisites', 'participation', 'general', 'events', 'bonus', 'demerits'];
    
    const categoryNames: any = {
      prerequisites: "Pré-requisitos",
      participation: "Participação",
      general: "Critérios Gerais",
      events: "Eventos/Provas",
      bonus: "Bônus",
      demerits: "Deméritos"
    };

    const categoryIcons: any = {
      prerequisites: <CheckCircle size={20} />,
      participation: <Users size={20} />,
      general: <FileText size={20} />,
      events: <Trophy size={20} />,
      bonus: <Award size={20} />,
      demerits: <X size={20} />
    };

    const totalScore = calculateTotalScore(scores);
    const classification = getClassification(totalScore);

    return (
      <div className="space-y-4">
        {/* Header com informações do clube */}
        <div className="bg-white p-4 rounded-xl shadow-sm sticky top-0 z-10">
          <button
            onClick={() => {
              setSelectedClub(null);
              setScores({});
              setLockedCriteria(new Set());
            }}
            className="flex items-center gap-2 text-campori-brown mb-3"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Voltar</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{selectedClub.name}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin size={14} />
                {selectedClub.region}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-campori-brown">{totalScore} pts</div>
              <div className={`${classification.bg} ${classification.color} px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 justify-end mt-1`}>
                {classification.icon}
                {classification.name}
              </div>
            </div>
          </div>
        </div>

        {/* Critérios de pontuação - apenas categorias válidas do schema */}
        <div className="space-y-4">
          {Object.entries(scoringCriteria)
            .filter(([category]) => validCategories.includes(category))
            .map(([category, criteria]: [string, any]) => {
            if (!criteria || typeof criteria !== 'object' || Object.keys(criteria).length === 0) return null;

            return (
              <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-campori-brown to-campori-darkRed text-white p-4">
                  <div className="flex items-center gap-3">
                    {categoryIcons[category]}
                    <h3 className="font-bold text-lg">{categoryNames[category] || category}</h3>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  {Object.entries(criteria).map(([key, item]: [string, any]) => {
                    const currentValue = scores[category]?.[key] || 0;
                    const maxValue = item.max || 0;
                    const partialValue = item.partial || 0;
                    const isLocked = isCriteriaLocked(category, key);
                    
                    return (
                      <div 
                        key={key} 
                        className={`border-2 rounded-lg p-3 transition-all ${
                          isLocked 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 text-sm">{item.description}</p>
                              {isLocked && (
                                <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Máximo: {maxValue} pts
                              {partialValue > 0 && ` | Parcial: ${partialValue} pts`}
                            </p>
                            {isLocked && (
                              <p className="text-xs text-green-700 font-semibold mt-1">
                                ✓ Avaliado: {currentValue} pts
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {!isLocked ? (
                          <div className="grid grid-cols-3 gap-2">
                            {/* Botão Pontuação Total */}
                            <button
                              onClick={() => applyScore(category, key, maxValue)}
                              className="flex flex-col items-center justify-center py-3 px-2 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg active:scale-[0.97] transition-all"
                            >
                              <Trophy size={18} className="mb-1" />
                              <span className="text-xs">Total</span>
                              <span className="text-sm font-bold">{maxValue}</span>
                            </button>

                            {/* Botão Pontuação Parcial - só exibe se houver valor parcial */}
                            {partialValue > 0 ? (
                              <button
                                onClick={() => applyScore(category, key, partialValue)}
                                className="flex flex-col items-center justify-center py-3 px-2 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg active:scale-[0.97] transition-all"
                              >
                                <Star size={18} className="mb-1" />
                                <span className="text-xs">Parcial</span>
                                <span className="text-sm font-bold">{partialValue}</span>
                              </button>
                            ) : (
                              <div className="flex items-center justify-center py-3 px-2 bg-gray-100 rounded-lg opacity-50">
                                <span className="text-xs text-gray-500">Sem parcial</span>
                              </div>
                            )}

                            {/* Botão Zero */}
                            <button
                              onClick={() => applyScore(category, key, 0)}
                              className="flex flex-col items-center justify-center py-3 px-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg active:scale-[0.97] transition-all"
                            >
                              <X size={18} className="mb-1" />
                              <span className="text-xs">Zero</span>
                              <span className="text-sm font-bold">0</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-4 bg-green-100 rounded-lg">
                            <CheckCircle size={20} className="text-green-600 mr-2" />
                            <span className="text-green-700 font-semibold text-sm">
                              Critério já avaliado
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão salvar fixo no bottom */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent">
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-transform font-semibold"
          >
            <Save size={24} />
            Salvar Avaliação
          </button>
        </div>
      </div>
    );
  };

  // Renderizar lista de clubes para avaliação
  const renderEvaluationTab = () => {
    // Se há um clube selecionado, mostrar o formulário
    if (selectedClub) {
      return renderEvaluationForm();
    }

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Sistema de Avaliação</h3>
          <p className="text-sm text-gray-600">
            Selecione um clube abaixo para iniciar a avaliação.
          </p>
        </div>

        {/* Lista de Clubes */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Todos os Clubes ({clubs?.length || 0})</h4>
          {!clubs ? (
            <div className="text-center py-8 text-gray-500">Carregando clubes...</div>
          ) : clubs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum clube cadastrado</div>
          ) : (
            clubs.map((club: any) => {
              const totalScore = calculateTotalScore(club.scores);
              const classification = getClassification(totalScore);
              
              return (
                <div
                  key={club._id}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-campori-brown hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{club.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <MapPin size={14} />
                        <span>{club.region || "Região não definida"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-600 mt-1">
                        <Users size={14} />
                        <span className="font-medium">{club.membersCount || 0} membros</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl text-campori-brown">
                        {totalScore} pts
                      </div>
                      <div className={`${classification.bg} ${classification.color} px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 justify-end mt-1`}>
                        {classification.icon}
                        {classification.name}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => initializeScores(club)}
                    className="w-full bg-gradient-to-r from-campori-brown to-campori-darkRed text-white py-3 rounded-lg font-semibold hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <ClipboardList size={20} />
                    AVALIAR
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Renderizar aba de busca
  const renderSearchTab = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Buscar Clube</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Digite o nome do clube ou região..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-campori-brown focus:outline-none"
            />
          </div>
        </div>

        {/* Resultados da Busca */}
        <div className="space-y-3">
          {searchQuery.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-3 opacity-50" />
              <p>Digite algo para buscar</p>
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhum clube encontrado</p>
            </div>
          ) : (
            <>
              <h4 className="text-sm font-semibold text-gray-700">
                {filteredClubs.length} {filteredClubs.length === 1 ? 'resultado' : 'resultados'}
              </h4>
              {filteredClubs.map((club: any) => {
                const totalScore = calculateTotalScore(club.scores);
                const classification = getClassification(totalScore);
                
                return (
                  <div
                    key={club._id}
                    className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-campori-brown hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{club.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <MapPin size={14} />
                          <span>{club.region || "Região não definida"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-campori-brown">
                          {totalScore} pts
                        </div>
                        <div className={`${classification.bg} ${classification.color} px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 justify-end mt-1`}>
                          {classification.icon}
                          {classification.name}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        initializeScores(club);
                        setActiveTab("evaluation");
                      }}
                      className="w-full bg-gradient-to-r from-campori-brown to-campori-darkRed text-white py-3 rounded-lg font-semibold hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <ClipboardList size={20} />
                      AVALIAR
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  };

  // Renderizar aba de programação
  const renderScheduleTab = () => {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-campori-brown to-campori-darkRed text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={32} />
            <div>
              <h3 className="text-xl font-bold">Programação do Evento</h3>
              <p className="text-sm opacity-90">XXI Campori Paulistana</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
          <h4 className="font-semibold text-gray-800 mb-2">Programação em Breve</h4>
          <p className="text-sm text-gray-600">
            A programação completa do evento será disponibilizada em breve. Fique atento!
          </p>
        </div>
      </div>
    );
  };

  // Renderizar conteúdo baseado na aba ativa
  const renderContent = () => {
    switch (activeTab) {
      case "evaluation":
        return renderEvaluationTab();
      case "search":
        return renderSearchTab();
      case "schedule":
        return renderScheduleTab();
      default:
        return renderEvaluationTab();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-campori-brown to-campori-darkRed text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Bem-vindo, {user.name}</h2>
              <p className="text-xs text-white/80">Função no evento: Staff</p>
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
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                >
                  <DoorOpen size={16} />
                  Sair
                </button>
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
          <button
            onClick={() => {
              setActiveTab("evaluation");
              setSelectedClub(null);
              setScores({});
              setLockedCriteria(new Set());
            }}
            className={`flex flex-col items-center py-2 px-4 transition-all duration-200 ${
              activeTab === "evaluation"
                ? "text-campori-brown"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ClipboardList size={24} />
            <span className="text-xs mt-1 font-medium">Avaliação</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("search");
              setSelectedClub(null);
              setScores({});
              setLockedCriteria(new Set());
            }}
            className={`flex flex-col items-center py-2 px-4 transition-all duration-200 ${
              activeTab === "search"
                ? "text-campori-brown"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Search size={24} />
            <span className="text-xs mt-1 font-medium">Buscar</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("schedule");
              setSelectedClub(null);
              setScores({});
              setLockedCriteria(new Set());
            }}
            className={`flex flex-col items-center py-2 px-4 transition-all duration-200 ${
              activeTab === "schedule"
                ? "text-campori-brown"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Calendar size={24} />
            <span className="text-xs mt-1 font-medium">Programação</span>
          </button>
        </div>
      </div>
    </div>
  );
}
