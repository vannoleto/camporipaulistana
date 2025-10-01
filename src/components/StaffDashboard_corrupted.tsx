import { useState,  MapPin,
  FileText, 
  Calculator, 
  Shield, 
  Star,
  Building2,
  Info
} from "lucide-react";m "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { 
  ClipboardList,
  BarChart3, 
  CheckCircle, 
  Search, 
  AlertTriangle, 
  Trophy, 
  Crown, 
  Target, 
  Users, 
  MapPin, 
  FileText, 
  Calculator, 
  Shield, 
  Star,
  Building2,
  Info
} from "lucide-react";

interface StaffDashboardProps {
  user: any;
  onLogout: () => void;
}

export function StaffDashboard({ user, onLogout }: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState("evaluation");
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [editingPenalties, setEditingPenalties] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const clubs = useQuery(api.clubs.listClubs, { 
    region: selectedRegion === "all" ? undefined : selectedRegion 
  });
  const scoringCriteria = useQuery(api.scoring.getScoringCriteria, {});
  const selectedClubData = useQuery(
    api.clubs.getClubById, 
    selectedClub ? { clubId: selectedClub._id } : "skip"
  );
  const evaluatedCriteria = useQuery(
    api.evaluation.getEvaluatedCriteria,
    selectedClub ? { clubId: selectedClub._id } : "skip"
  );

  // Mutations
  const updateClubScores = useMutation(api.clubs.updateClubScores);
  const lockCriteria = useMutation(api.evaluation.lockCriteria);

  // PONTUAÇÃO INICIAL DO EVENTO
  const INITIAL_EVENT_SCORE = 3050;

  // Função para calcular pontuação total baseada na estrutura de pontuações (IGUAL AO ADMINDASHBOARD)
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
  };  const getClassification = (totalScore: number): string => {
    if (totalScore >= 2300) return "HEROI";
    if (totalScore >= 1100) return "FIEL_ESCUDEIRO";
    return "APRENDIZ";
  };

  const handleSaveScores = async () => {
    if (!editingPenalties || !selectedClub) return;
    
    try {
      // Atualizar pontuações do clube
      await updateClubScores({
        clubId: selectedClub._id,
        scores: editingPenalties,
        userId: user._id,
      });

      // Marcar apenas os critérios que foram realmente modificados
      await lockModifiedCriteria(selectedClub._id, editingPenalties);
      
      toast.success("Penalidades salvas com sucesso!");
      setEditingPenalties(null);
      setSelectedClub(null); // Volta para a lista de clubes
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Função para verificar se foi selecionada a pontuação total
  const checkIfTotalScore = (value: any): boolean => {
    return typeof value === 'string' && value.startsWith('total_');
  };

  const lockModifiedCriteria = async (clubId: string, newScores: any) => {
    if (!selectedClubData?.scores) return;
    
    const originalScores = selectedClubData.scores;
    const lockPromises: Promise<any>[] = [];

    // Comparar e travar apenas critérios modificados
    const compareAndLock = (category: string, originalCat: any, newCat: any, parentKey?: string) => {
      if (!originalCat || !newCat) return;
      
      for (const [key, newValue] of Object.entries(newCat)) {
        const originalValue = originalCat[key];
        
        // Para objetos aninhados como carousel
        if (typeof newValue === 'object' && newValue !== null) {
          compareAndLock(category, originalValue || {}, newValue, key);
          continue;
        }
        
        // Se o valor foi modificado, travar o critério
        if (originalValue !== newValue) {
          // Verificar se foi uma avaliação com pontuação total (máx + parcial)
          const shouldAutoLock = checkIfTotalScore(category, parentKey || key, newValue as number);
          
          lockPromises.push(
            lockCriteria({
              clubId: clubId as any,
              category: category,
              criteriaKey: parentKey || key,
              subKey: parentKey ? key : undefined,
              score: newValue as number,
              evaluatedBy: user._id,
            })
          );
          
          // Se foi pontuação total, mostrar mensagem específica
          if (shouldAutoLock) {
            setTimeout(() => {
              toast.success(`Critério "${parentKey || key}" avaliado com pontuação total e bloqueado automaticamente!`);
            }, 1000);
          }
        }
      }
    };

    // Verificar cada categoria (DEMÉRITOS são excluídos do travamento pois podem ocorrer múltiplas vezes)
    if (newScores.prerequisites) compareAndLock("prerequisites", originalScores.prerequisites, newScores.prerequisites);
    if (newScores.participation) compareAndLock("participation", originalScores.participation, newScores.participation);
    if (newScores.general) compareAndLock("general", originalScores.general, newScores.general);
    if (newScores.events) compareAndLock("events", originalScores.events, newScores.events);
    if (newScores.bonus) compareAndLock("bonus", originalScores.bonus, newScores.bonus);
    // ❌ DEMÉRITOS NÃO SÃO TRAVADOS - podem ocorrer múltiplas vezes durante o evento
    // if (newScores.demerits) compareAndLock("demerits", originalScores.demerits, newScores.demerits);

    await Promise.all(lockPromises);
  };

  const isCriteriaEvaluated = (category: string, key: string, subKey?: string): boolean => {
    // DEMÉRITOS nunca são travados - podem ocorrer múltiplas vezes durante o evento
    if (category === "demerits") return false;
    
    if (!evaluatedCriteria) return false;
    
    const criteriaKey = subKey 
      ? `${category}.${key}.${subKey}`
      : `${category}.${key}`;
    
    return evaluatedCriteria[criteriaKey]?.isLocked || false;
  };

  const updatePenalty = (category: string, subcategory: string, value: number) => {
    // Validar que penalidades não podem ser negativas (exceto para deméritos que são valores positivos representando penalidades)
    if (value < 0 && category !== "demerits") {
      toast.error("Penalidades não podem ser negativas");
      return;
    }

    const newPenalties = { ...editingPenalties };
    
    if (subcategory.includes('.')) {
      const [subcat, item] = subcategory.split('.');
      newPenalties[category][subcat][item] = value;
    } else {
      newPenalties[category][subcategory] = value;
    }
    
    setEditingPenalties(newPenalties);
  };

  const startEvaluation = (club: any) => {
    setSelectedClub(club);
    // Inicializar com penalidades zeradas ou existentes
    const currentPenalties = club.scores || {
      prerequisites: { photos: 0, directorPresence: 0 },
      participation: { opening: 0, saturdayMorning: 0, saturdayNight: 0, saturdayMeeting: 0, sundayMeeting: 0 },
      general: { firstAidKit: 0, secretaryFolder: 0, doorIdentification: 0, badges: 0, uniform: 0 },
      events: { 
        twelveHour: 0, 
        carousel: { abel: 0, jacob: 0, samson: 0, rahab: 0, gideon: 0, barak: 0 }
      },
      bonus: { pastorVisit: 0, adultVolunteer: 0, healthProfessional: 0 },
      demerits: { 
        driverIssues: 0, lackReverence: 0, noBadge: 0, unaccompaniedChild: 0, 
        unauthorizedVisits: 0, vandalism: 0, silenceViolation: 0, disrespect: 0 
      }
    };
    setEditingPenalties({ ...currentPenalties });
  };

  const filteredClubs = clubs?.filter(club => 
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.region.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const tabs = [
    { id: "evaluation", name: "Avaliação", icon: <ClipboardList size={20} /> },
    { id: "overview", name: "Visão Geral", icon: <BarChart3 size={20} /> },
  ];

  const renderClubSelection = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-center">
          <Info size={20} className="text-blue-600 mr-2" />
          <div className="text-blue-800">
            <p className="font-medium">Sistema de Pontuação do Evento</p>
            <p className="text-sm">Todos os clubes iniciam com <strong>{INITIAL_EVENT_SCORE.toLocaleString()} pontos</strong>. Durante o evento, apenas penalidades podem ser aplicadas, reduzindo a pontuação.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar clube por nome ou região..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas as Regiões</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={`R${i + 1}`}>Região {i + 1}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClubs.map((club) => (
          <div
            key={club._id}
            className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => startEvaluation(club)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 truncate">{club.name}</h3>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {club.region}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pontuação:</span>
                <span className="font-medium text-blue-600">
                  {club.totalScore ? club.totalScore.toLocaleString() : INITIAL_EVENT_SCORE.toLocaleString()} pts
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Classificação:</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  club.classification === "HEROI" 
                    ? "bg-purple-100 text-purple-800"
                    : club.classification === "FIEL_ESCUDEIRO"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}>
                  {club.classification === "HEROI" ? (
                    <span className="flex items-center gap-1">
                      <Crown size={12} />
                      HERÓI
                    </span>
                  ) : club.classification === "FIEL_ESCUDEIRO" ? (
                    <span className="flex items-center gap-1">
                      <Trophy size={12} />
                      FIEL ESCUDEIRO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Target size={12} />
                      APRENDIZ
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors text-sm">
                Avaliar Clube
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClubs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search size={64} />
          </div>
          <p className="text-gray-600">Nenhum clube encontrado com os filtros aplicados.</p>
        </div>
      )}
    </div>
  );

  const renderEvaluationForm = () => {
    if (!selectedClub || !scoringCriteria || !editingPenalties) return null;

    const currentScores = editingPenalties; // Usando as pontuações do clube
    const totalScore = calculateTotalScore(currentScores);
    const classification = getClassification(totalScore);

    const renderScoreSection = (title: any, category: string, data: any, scores: any, isDemerits = false) => (
      <div className={`p-6 rounded-xl shadow-sm ${isDemerits ? 'bg-red-50 border border-red-200' : 'bg-white'}`}>
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
                    {Object.entries(item).map(([carouselKey, carouselItem]: [string, any]) => {
                      const isCarouselLocked = isCriteriaEvaluated(category, key, carouselKey);
                      
                      return (
                        <div key={carouselKey} className={`flex items-center justify-between p-3 rounded-lg ${
                          isCarouselLocked ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium">{carouselItem.description}</div>
                              {isCarouselLocked && (
                                <div title="Critério avaliado e travado">
                                  <CheckCircle size={16} className="text-green-600" />
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Pontuação máxima: {carouselItem.max} pts
                              {carouselItem.partial !== undefined && ` | Parcial: ${carouselItem.partial} pts`}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={scores.carousel[carouselKey]}
                              onChange={(e) => updatePenalty(category, `carousel.${carouselKey}`, parseInt(e.target.value))}
                              className={`px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500 ${
                                isCarouselLocked ? 'bg-green-100 cursor-not-allowed' : ''
                              }`}
                              disabled={isCarouselLocked}
                            >
                              <option value={0}>0 pts</option>
                              {carouselItem.partial !== undefined && (
                                <option value={carouselItem.partial}>{carouselItem.partial} pts (parcial)</option>
                              )}
                              <option value={carouselItem.max}>{carouselItem.max} pts (máximo)</option>
                              {carouselItem.partial !== undefined && (
                                <option value={`total_${carouselItem.max}`}>
                                  {carouselItem.max} pts (Pontuação Total)
                                </option>
                              )}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const currentValue = scores[key];
            const isLocked = isCriteriaEvaluated(category, key);
            
            return (
              <div key={key} className={`flex items-center justify-between p-3 rounded-lg ${
                isLocked ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
              }`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{item.description}</div>
                    {isLocked && (
                      <div title="Critério avaliado e travado">
                        <CheckCircle size={16} className="text-green-600" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isDemerits ? (
                      `Penalidade: ${item.penalty} pts por ocorrência`
                    ) : (
                      `Pontuação disponível: ${item.max} pts${item.partial !== undefined ? ` | Parcial: ${item.partial} pts` : ''}`
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isDemerits ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Ocorrências:</span>
                      <input
                        type="number"
                        value={Math.abs(currentValue / item.penalty) || 0}
                        onChange={(e) => {
                          const occurrences = parseInt(e.target.value) || 0;
                          updatePenalty(category, key, Math.abs(occurrences * item.penalty));
                        }}
                        className={`w-16 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-blue-500 ${
                          isLocked ? 'bg-green-100 cursor-not-allowed' : ''
                        }`}
                        min={0}
                        placeholder="0"
                        disabled={isLocked}
                      />
                      <span className="text-sm font-medium text-red-600">
                        ➝ Total: -{currentValue ? currentValue.toLocaleString() : 0} pts
                      </span>
                    </div>
                  ) : (
                    <select
                      value={currentValue}
                      onChange={(e) => updatePenalty(category, key, parseInt(e.target.value))}
                      className={`px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500 ${
                        isLocked ? 'bg-green-100 cursor-not-allowed' : ''
                      }`}
                      disabled={isLocked}
                    >
                      <option value={0}>0 pts</option>
                      {item.partial !== undefined && (
                        <option value={item.partial}>{item.partial} pts (parcial)</option>
                      )}
                      <option value={item.max}>{item.max} pts (máximo)</option>
                      {item.partial !== undefined && (
                        <option value={`total_${item.max}`}>
                          {item.max} pts (Pontuação Total)
                        </option>
                      )}
                    </select>
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
        {/* Header da Avaliação */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedClub.name}</h2>
              <p className="text-gray-600">Região: {selectedClub.region}</p>
            </div>
            <button
              onClick={() => {
                setSelectedClub(null);
                setEditingPenalties(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Fechar
            </button>
          </div>

          {/* Pontuação Atual */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Pontuação Atual</h3>
                <p className="text-blue-100">
                  Inscritos: {selectedClub?.membersCount || 0} Membros
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {totalScore.toLocaleString()} pts
                </div>
                <div className="text-lg flex items-center gap-2 mt-2">
                  {classification === "HEROI" ? (
                    <>
                      <Crown size={20} className="text-yellow-500" />
                      HERÓI
                    </>
                  ) : classification === "FIEL_ESCUDEIRO" ? (
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
        </div>

        {/* Aviso sobre presença */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center">
            <Users size={16} className="text-blue-600 mr-2" />
            <div className="text-blue-800">
              <p className="font-medium">Controle de Presença</p>
              <p className="text-sm">
                Alguns critérios exigem 100% de presença dos membros inscritos. Verifique se todos estão presentes antes de avaliar.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setSelectedClub(null);
              setEditingPenalties(null);
            }}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveScores}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Salvar Pontuações
          </button>
        </div>

        {/* Seções de Pontuação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <ClipboardList size={20} />
              Pré-requisitos
            </span>, 
            "prerequisites", scoringCriteria.prerequisites, currentScores.prerequisites
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Users size={20} />
              Participação
            </span>, 
            "participation", scoringCriteria.participation, currentScores.participation
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Target size={20} />
              Critérios Gerais
            </span>, 
            "general", scoringCriteria.general, currentScores.general
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Star size={20} />
              Eventos
            </span>, 
            "events", scoringCriteria.events, currentScores.events
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Trophy size={20} />
              Bônus
            </span>, 
            "bonus", scoringCriteria.bonus, currentScores.bonus
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              <span className="text-red-700">Deméritos</span>
            </span>, 
            "demerits", scoringCriteria.demerits, currentScores.demerits, true
          )}
        </div>
        
        {/* Aviso sobre deméritos */}
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle size={16} className="text-red-600 mr-2" />
            <div className="text-red-800">
              <p className="font-medium">Atenção - Deméritos</p>
              <p className="text-sm">
                Os pontos dos deméritos são <strong>subtraídos</strong> da pontuação total do clube. Digite o número de ocorrências e o sistema calculará automaticamente a penalidade.
              </p>
              <p className="text-sm mt-1">
                <strong>Importante:</strong> Deméritos podem ser aplicados <strong>múltiplas vezes</strong> durante o evento (ex: vários membros sem crachá).
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => {
    const stats = clubs ? {
      total: clubs.length,
      heroi: clubs.filter(c => c.classification === "HEROI").length,
      fiel: clubs.filter(c => c.classification === "FIEL_ESCUDEIRO").length,
      aprendiz: clubs.filter(c => c.classification === "APRENDIZ").length,
      avgScore: Math.round(clubs.reduce((sum, club) => sum + (club.totalScore || INITIAL_EVENT_SCORE), 0) / clubs.length)
    } : null;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Visão Geral</h2>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-gray-600">Total de Clubes</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.heroi}</div>
              <div className="text-gray-600 flex items-center gap-1">
                <Crown size={16} />
                Heróis
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.fiel}</div>
              <div className="text-gray-600 flex items-center gap-1">
                <Trophy size={16} />
                Fiéis Escudeiros
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-3xl font-bold text-green-600">{stats.aprendiz}</div>
              <div className="text-gray-600 flex items-center gap-1">
                <Target size={16} />
                Aprendizes
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Clubes por Região</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }, (_, i) => {
              const region = `R${i + 1}`;
              const regionClubs = clubs?.filter(c => c.region === region) || [];
              return (
                <div key={region} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900">{regionClubs.length}</div>
                  <div className="text-sm text-gray-600">{region}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === "evaluation") {
      return selectedClub ? renderEvaluationForm() : renderClubSelection();
    }
    
    switch (activeTab) {
      case "overview": return renderOverview();
      default: return renderClubSelection();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="text-blue-500">
                <UserCheck size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Painel Staff</h1>
                <p className="text-sm text-gray-600">Bem-vindo, {user.name}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <DoorOpen size={16} />
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== "evaluation") {
                      setSelectedClub(null);
                      setEditingPenalties(null);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
