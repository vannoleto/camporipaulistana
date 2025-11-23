import { useState, useEffect } from "react";
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
  const [demeritInputs, setDemeritInputs] = useState<Record<string, number>>({});

  const clubs = useQuery(api.clubs.listClubs, {});
  const scoringCriteria = useQuery(api.scoring.getScoringCriteria, {});
  const selectedClubData = useQuery(
    api.clubs.getClubById, 
    selectedClub ? { clubId: selectedClub._id } : "skip"
  );
  const activityLogs = useQuery(
    api.clubs.getClubActivityLogs,
    selectedClub ? { clubId: selectedClub._id } : "skip"
  );
  const lockedCriteriaData = useQuery(
    api.clubs.getLockedCriteria,
    selectedClub ? { clubId: selectedClub._id } : "skip"
  );
  const updateClubScores = useMutation(api.clubs.updateClubScores);

  // Criar estrutura completa de scores AUTOMATICAMENTE a partir dos critérios do Convex
  // Esta função é dinâmica e não requer manutenção manual
  const createCompleteScoresStructure = (existingScores: any = {}, criteria: any = null) => {
    if (!criteria) {
      // Se critérios não carregados, retornar estrutura vazia
      return {};
    }

    // Gerar estrutura dinamicamente baseada em TODAS as categorias dos critérios
    const scores: any = {};
    
    // Iterar por TODAS as categorias que existem nos critérios
    Object.keys(criteria).forEach(category => {
      if (criteria[category] && typeof criteria[category] === 'object') {
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
    
    // Carregar critérios travados do banco de dados
    // Será atualizado quando lockedCriteriaData carregar
    setLockedCriteria(new Set());
  };

  // ATUALIZAR scores em tempo real quando selectedClubData mudar
  useEffect(() => {
    if (selectedClubData && selectedClub) {
      console.log("🔄 Dados do clube atualizados, sincronizando scores...", selectedClubData.scores);
      setScores(createCompleteScoresStructure(selectedClubData.scores, scoringCriteria));
    }
  }, [selectedClubData, scoringCriteria]);

  // Effect para atualizar lockedCriteria quando os dados carregarem
  useEffect(() => {
    if (lockedCriteriaData && lockedCriteriaData.length > 0) {
      const locked = new Set<string>();
      console.log("🔒 Dados brutos do banco:", lockedCriteriaData);
      
      lockedCriteriaData.forEach((item: any) => {
        // Se tem subKey, usar criteriaKey.subKey, senão apenas criteriaKey
        const key = item.subKey 
          ? `${item.category}.${item.criteriaKey}.${item.subKey}`
          : `${item.category}.${item.criteriaKey}`;
        locked.add(key);
        console.log(`🔒 Adicionando ao Set: "${key}" (category: ${item.category}, criteriaKey: ${item.criteriaKey}, subKey: ${item.subKey || 'N/A'})`);
      });
      
      setLockedCriteria(locked);
      console.log("🔒 Set final de critérios travados:", Array.from(locked));
    } else {
      console.log("⚠️ Nenhum critério travado encontrado ou dados não carregados ainda");
    }
  }, [lockedCriteriaData]);

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
    const criteriaKey = `${category}.${key}`;
    const isLocked = lockedCriteria.has(criteriaKey);
    console.log(`🔍 Verificando lock: "${criteriaKey}" => ${isLocked ? '✅ TRAVADO' : '❌ LIBERADO'}`);
    console.log(`🔍 Set atual:`, Array.from(lockedCriteria));
    return isLocked;
  };

  const handleSave = async () => {
    if (!selectedClub) {
      toast.error("Nenhum clube selecionado");
      return;
    }

    // Filtrar apenas os scores que foram avaliados (locked)
    const evaluatedScores: any = {};
    
    lockedCriteria.forEach(criteriaKey => {
      const [category, key] = criteriaKey.split('.');
      
      if (!evaluatedScores[category]) {
        evaluatedScores[category] = {};
      }
      
      evaluatedScores[category][key] = scores[category]?.[key] || 0;
    });

    // Remover categorias vazias
    Object.keys(evaluatedScores).forEach(category => {
      if (Object.keys(evaluatedScores[category]).length === 0) {
        delete evaluatedScores[category];
      }
    });

    console.log("Salvando apenas critérios avaliados:", evaluatedScores);
    console.log("Categorias:", Object.keys(evaluatedScores));
    console.log("Total de critérios avaliados:", lockedCriteria.size);

    if (Object.keys(evaluatedScores).length === 0) {
      toast.error("Nenhum critério foi avaliado");
      return;
    }

    try {
      await updateClubScores({
        clubId: selectedClub._id,
        scores: evaluatedScores, // Enviar APENAS os avaliados
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

  // Função para calcular pontuação total usando lógica SUBTRATIVA SIMPLES
  // REGRA: penalty = maxPoints - earnedPoints (para TODOS os critérios avaliados)
  const calculateClubTotalScore = (clubScores: any, clubId?: string): number => {
    if (!scoringCriteria) {
      console.log('⚠️ calculateClubTotalScore: sem critérios');
      return 1910;
    }

    const MAX_SCORE = 1910;
    let totalPenalty = 0;
    let demeritsPenalty = 0;

    // Buscar logs para saber quais critérios foram avaliados
    const clubLogs = activityLogs?.filter((log: any) => log.clubId === clubId) || [];
    const evaluatedCriteria = new Set<string>();
    clubLogs.forEach((log: any) => {
      if (log.scoreChange) {
        const key = `${log.scoreChange.category}_${log.scoreChange.subcategory}`;
        evaluatedCriteria.add(key);
      }
    });

    if (!clubScores) {
      console.log('⚠️ calculateClubTotalScore: sem scores, retornando máximo');
      return MAX_SCORE;
    }

    // Calcular penalidades: penalty = max - earned
    Object.keys(clubScores).forEach(category => {
      if (!scoringCriteria[category]) return;
      const categoryScores = clubScores[category];
      if (typeof categoryScores !== 'object') return;

      // DEMÉRITOS
      if (category === 'demerits') {
        Object.keys(categoryScores).forEach(key => {
          const demeritValue = categoryScores[key];
          if (typeof demeritValue === 'number' && demeritValue !== 0) {
            demeritsPenalty += Math.abs(demeritValue);
          }
        });
        return;
      }

      // OUTRAS CATEGORIAS
      Object.keys(categoryScores).forEach(key => {
        const earnedPoints = categoryScores[key];
        
        // Processar objetos aninhados (carousel)
        if (typeof earnedPoints !== 'number') {
          if (typeof earnedPoints === 'object' && key === 'carousel') {
            Object.keys(earnedPoints).forEach(carouselKey => {
              const carouselEarned = earnedPoints[carouselKey];
              if (typeof carouselEarned !== 'number') return;
              
              // Verificar se foi avaliado
              const criteriaKey = `${category}_carousel.${carouselKey}`;
              if (!evaluatedCriteria.has(criteriaKey)) return;
              
              const carouselCriterion = scoringCriteria[category]?.[key]?.[carouselKey];
              if (!carouselCriterion) return;
              
              const maxPoints = carouselCriterion.max || 0;
              const penalty = maxPoints - carouselEarned; // LÓGICA SIMPLES
              totalPenalty += Math.max(0, penalty);
            });
          }
          return;
        }

        // Verificar se foi avaliado
        const criteriaKey = `${category}_${key}`;
        if (!evaluatedCriteria.has(criteriaKey)) return;

        const criterion = scoringCriteria[category]?.[key];
        if (!criterion) return;

        const maxPoints = criterion.max || 0;
        const penalty = maxPoints - earnedPoints; // LÓGICA SIMPLES: max - earned
        totalPenalty += Math.max(0, penalty);
      });
    });

    const finalScore = Math.max(0, MAX_SCORE - totalPenalty - demeritsPenalty);
    console.log(`📊 Staff Score: Clube=${clubId?.slice(-4)}, Avaliados=${evaluatedCriteria.size}, Penalidade=${totalPenalty}, Deméritos=${demeritsPenalty}, Final=${finalScore}`);
    return finalScore;
  };

  // Função para calcular pontuação total do clube selecionado (IGUAL AO ADMINDASHBOARD)
  // Usa os scores salvos no banco quando disponível
  const calculateTotalScore = (clubScores: any, clubId?: string) => {
    // Usar a mesma função para consistência
    return calculateClubTotalScore(clubScores, clubId || selectedClub?._id);
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

    // Mapeamento de nomes e ícones para TODAS as categorias
    const categoryNames: any = {
      prerequisites: "Pré-requisitos",
      campground: "Área de Acampamento",
      kitchen: "Cozinha",
      participation: "Participação",
      uniform: "Uniforme",
      secretary: "Secretaria",
      events: "Eventos/Provas",
      bonus: "Bônus",
      demerits: "Deméritos"
    };

    const categoryIcons: any = {
      prerequisites: <CheckCircle size={20} />,
      campground: <Building2 size={20} />,
      kitchen: <Trophy size={20} />,
      participation: <Users size={20} />,
      uniform: <Shield size={20} />,
      secretary: <FileText size={20} />,
      events: <Trophy size={20} />,
      bonus: <Award size={20} />,
      demerits: <X size={20} />
    };

    // Usar pontuação total do banco de dados (já calculada corretamente no backend)
    const totalScore = selectedClubData?.totalScore || selectedClub?.totalScore || 1910;
    const classification = selectedClubData?.classification || selectedClub?.classification || getClassification(totalScore);

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

        {/* Critérios de pontuação - TODAS as categorias dinâmicas */}
        <div className="space-y-4">
          {Object.entries(scoringCriteria)
            .filter(([category, criteria]: [string, any]) => {
              // Mostrar apenas categorias que têm conteúdo
              const hasContent = criteria && typeof criteria === 'object' && Object.keys(criteria).length > 0;
              console.log(`Category ${category}: hasContent=${hasContent}`);
              return hasContent;
            })
            .map(([category, criteria]: [string, any]) => {
            if (!criteria || typeof criteria !== 'object' || Object.keys(criteria).length === 0) {
              console.log(`Category ${category} is empty or invalid`);
              return null;
            }

            console.log(`Rendering category ${category} with criteria:`, criteria);

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
                    console.log(`Rendering criterion: category=${category}, key=${key}, item=`, item);
                    
                    // BUSCAR VALOR DO BANCO DE DADOS (selectedClubData.scores)
                    const currentValue = selectedClubData?.scores?.[category]?.[key] || scores[category]?.[key] || 0;
                    const maxValue = item.max || 0;
                    const partialValue = item.partial || 0;
                    const isLocked = isCriteriaLocked(category, key);
                    
                    console.log(`Criterion values: max=${maxValue}, partial=${partialValue}, locked=${isLocked}, currentValue=${currentValue}`);
                    
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
                              <p className="text-xs font-bold mt-1 px-2 py-1 bg-green-100 text-green-700 rounded inline-block">
                                ✓ Avaliado: {currentValue} pts
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {!isLocked ? (
                          // Se for DEMÉRITO, mostrar input + botão avaliar
                          category === 'demerits' ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Quantidade de ocorrências:
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={demeritInputs[key] || 0}
                                    onChange={(e) => {
                                      const quantity = parseInt(e.target.value) || 0;
                                      setDemeritInputs(prev => ({ ...prev, [key]: quantity }));
                                    }}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-gray-600 mb-1">Penalidade</div>
                                  <div className="text-2xl font-bold text-red-600">
                                    {((demeritInputs[key] || 0) * -100).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500">pontos</div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const quantity = demeritInputs[key] || 0;
                                  const demeritValue = -(quantity * 100);
                                  applyScore(category, key, demeritValue);
                                  setDemeritInputs(prev => ({ ...prev, [key]: 0 })); // Resetar input
                                }}
                                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                              >
                                <CheckCircle size={20} />
                                Avaliar Demérito
                              </button>
                            </div>
                          ) : (
                            // Para outras categorias, manter os 3 botões
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
                          )
                        ) : (
                          <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                            <div className="flex items-center justify-center mb-2">
                              <CheckCircle size={20} className="text-green-600 mr-2" />
                              <span className="text-green-700 font-semibold text-sm">
                                Critério já avaliado
                              </span>
                            </div>
                            <p className="text-xs text-green-800 text-center">
                              Apenas administradores podem editar critérios já avaliados
                            </p>
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
              console.log(`📊 StaffDashboard - Clube: ${club.name}`, {
                scores: club.scores,
                hasScores: !!club.scores,
                scoringCriteria: !!scoringCriteria
              });
              
              // LER DO BANCO (valores já calculados)
              const totalScore = club.totalScore || 1910;
              const classification = getClassification(totalScore);
              console.log(`📊 StaffDashboard - Resultado: ${club.name} = ${totalScore} pts (${classification.name})`);

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
                // LER DO BANCO
                const totalScore = club.totalScore || 1910;
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
  const renderScheduleTab = () => {
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
            <div className="bg-gradient-to-r from-campori-brown to-campori-darkRed text-white p-3">
              <h3 className="text-lg font-bold">{day.day}</h3>
              <p className="text-sm opacity-90">{day.date}</p>
            </div>
            <div className="divide-y divide-gray-200">
              {day.events.map((event, eventIdx) => (
                <div key={eventIdx} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-14">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-campori-brown bg-orange-100 rounded">
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
          <div className="bg-orange-600 text-white p-3">
            <h3 className="text-lg font-bold">🏆 Quadro de Concursos</h3>
          </div>
          <div className="p-4 space-y-4">
            {concursos.map((concurso, idx) => (
              <div key={idx}>
                <h4 className="font-bold text-orange-800 mb-2">{concurso.name}</h4>
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
