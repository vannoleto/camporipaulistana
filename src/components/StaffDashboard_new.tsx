import { useState, useEffect } from "react";
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

  // Mutations
  const updateClub = useMutation(api.clubs.updateClub);
  const lockCriteria = useMutation(api.evaluation.lockCriteria);
  const unlockCriteria = useMutation(api.evaluation.unlockCriteria);

  // Função para calcular pontuação total baseada na estrutura de pontuações (IGUAL AO ADMINDASHBOARD)
  const calculateTotalScore = (scores: any) => {
    if (!scores) return 0;
    
    let total = 0;
    
    // Pré-requisitos
    if (scores.prerequisites) {
      total += scores.prerequisites.photos || 0;
      total += scores.prerequisites.directorPresence || 0;
    }
    
    // Participação
    if (scores.participation) {
      total += scores.participation.opening || 0;
      total += scores.participation.saturdayMorning || 0;
      total += scores.participation.saturdayNight || 0;
      total += scores.participation.saturdayMeeting || 0;
      total += scores.participation.sundayMeeting || 0;
    }
    
    // Organização Geral
    if (scores.general) {
      total += scores.general.firstAidKit || 0;
      total += scores.general.secretaryFolder || 0;
      total += scores.general.doorIdentification || 0;
      total += scores.general.badges || 0;
      total += scores.general.uniform || 0;
    }
    
    // Atividades e Eventos
    if (scores.events) {
      total += scores.events.twelveHour || 0;
      
      // Carrossel de atividades
      if (scores.events.carousel) {
        total += scores.events.carousel.abel || 0;
        total += scores.events.carousel.jacob || 0;
        total += scores.events.carousel.samson || 0;
        total += scores.events.carousel.rahab || 0;
        total += scores.events.carousel.gideon || 0;
        total += scores.events.carousel.barak || 0;
      }
    }
    
    // Pontos Extras
    if (scores.bonus) {
      total += scores.bonus.pastorVisit || 0;
      total += scores.bonus.adultVolunteer || 0;
      total += scores.bonus.healthProfessional || 0;
    }
    
    // Subtrair deméritos
    if (scores.demerits) {
      total -= scores.demerits.driverIssues || 0;
      total -= scores.demerits.lackReverence || 0;
      total -= scores.demerits.noBadge || 0;
      total -= scores.demerits.unaccompaniedChild || 0;
      total -= scores.demerits.unauthorizedVisits || 0;
      total -= scores.demerits.vandalism || 0;
      total -= scores.demerits.silenceViolation || 0;
      total -= scores.demerits.disrespect || 0;
    }
    
    return Math.max(0, total); // Garantir que não seja negativo
  };

  // Função para determinar classificação baseada na pontuação
  const getClassification = (totalScore: number) => {
    if (totalScore >= 6500) return "HEROI";
    if (totalScore >= 5000) return "FIEL_ESCUDEIRO";
    return "APRENDIZ";
  };

  // Atualizar pontuação quando editingPenalties mudar
  useEffect(() => {
    if (selectedClub && editingPenalties) {
      const totalScore = calculateTotalScore(editingPenalties);
      const classification = getClassification(totalScore);
      
      // Fazer o update no banco de dados
      updateClub({
        clubId: selectedClub._id,
        scores: editingPenalties,
        totalScore,
        classification
      });
    }
  }, [editingPenalties]);

  // Função para verificar se foi selecionada a pontuação total
  const checkIfTotalScore = (value: any): boolean => {
    return typeof value === 'string' && value.startsWith('total_');
  };

  const updatePenalty = (category: string, subcategory: string, value: any) => {
    let actualValue = value;
    let shouldAutoLock = false;

    // Verificar se é uma seleção de pontuação total
    if (checkIfTotalScore(value)) {
      actualValue = parseInt(value.replace('total_', ''));
      shouldAutoLock = true;
    } else if (typeof value === 'string') {
      actualValue = parseInt(value);
    }

    // Validar que penalidades não podem ser negativas (exceto para deméritos que são valores positivos representando penalidades)
    if (actualValue < 0 && category !== "demerits") {
      toast.error("Penalidades não podem ser negativas");
      return;
    }

    const newPenalties = { ...editingPenalties };
    
    if (subcategory.includes('.')) {
      const [subcat, item] = subcategory.split('.');
      newPenalties[category][subcat][item] = actualValue;
    } else {
      newPenalties[category][subcategory] = actualValue;
    }
    
    setEditingPenalties(newPenalties);

    // Auto-travar se foi selecionada pontuação total
    if (shouldAutoLock && selectedClub) {
      lockCriteria.mutate({
        clubId: selectedClub._id,
        category,
        subcategory
      });
      
      toast.success("Pontuação total selecionada! Critério travado automaticamente.");
    }
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
            <p className="font-medium">Sistema de Avaliação - Staff</p>
            <p className="text-sm">
              Selecione um clube da sua região para iniciar ou continuar sua avaliação.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar clube por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
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
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pontuação:</span>
                <span className="font-medium text-gray-900">
                  {club.totalScore?.toLocaleString() || 0} pts
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Classificação:</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  club.classification === "HEROI" 
                    ? "bg-purple-100 text-purple-800"
                    : club.classification === "FIEL_ESCUDEIRO"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}>
                  {club.classification === "HEROI" ? "HERÓI" : 
                   club.classification === "FIEL_ESCUDEIRO" ? "FIEL ESCUDEIRO" : "APRENDIZ"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Membros:</span>
                <span className="text-sm font-medium text-gray-900">
                  {club.membersCount || 'Não informado'}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEvaluation(club);
                }}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Avaliar Clube
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Função para verificar se um critério foi avaliado
  const isCriteriaEvaluated = (category: string, subcategory: string, item?: string): boolean => {
    if (!selectedClubData?.evaluatedCriteria) return false;
    
    const key = item ? `${category}.${subcategory}.${item}` : `${category}.${subcategory}`;
    return selectedClubData.evaluatedCriteria.some((criteria: any) => criteria.key === key);
  };

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
                            onChange={(e) => updatePenalty(category, `carousel.${carouselKey}`, e.target.value)}
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
                    onChange={(e) => updatePenalty(category, key, e.target.value)}
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

  const renderEvaluationForm = () => {
    if (!selectedClub || !scoringCriteria || !editingPenalties) return null;

    const totalScore = calculateTotalScore(editingPenalties);
    const classification = getClassification(totalScore);

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
                      <Trophy size={20} className="text-blue-300" />
                      FIEL ESCUDEIRO
                    </>
                  ) : (
                    <>
                      <Target size={20} className="text-green-300" />
                      APRENDIZ
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seções de Avaliação */}
        <div className="grid grid-cols-1 gap-6">
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              Pré-requisitos
            </span>, 
            "prerequisites", scoringCriteria.prerequisites, editingPenalties.prerequisites
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Users size={20} />
              Participação
            </span>, 
            "participation", scoringCriteria.participation, editingPenalties.participation
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Shield size={20} />
              Organização Geral
            </span>, 
            "general", scoringCriteria.general, editingPenalties.general
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Star size={20} />
              Atividades e Eventos
            </span>, 
            "events", scoringCriteria.events, editingPenalties.events
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Trophy size={20} />
              Bônus
            </span>, 
            "bonus", scoringCriteria.bonus, editingPenalties.bonus
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              <span className="text-red-700">Deméritos</span>
            </span>, 
            "demerits", scoringCriteria.demerits, editingPenalties.demerits, true
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

  const renderEvaluation = () => {
    return selectedClub ? renderEvaluationForm() : renderClubSelection();
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Clubes na Região</p>
              <p className="text-2xl font-bold text-blue-900">{filteredClubs?.length || 0}</p>
            </div>
            <div className="text-blue-500">
              <Building2 size={32} />
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Maior Pontuação</p>
              <p className="text-2xl font-bold text-green-900">
                {Math.max(...(filteredClubs?.map(c => c.totalScore || 0) || [0])).toLocaleString()}
              </p>
            </div>
            <div className="text-green-500">
              <Trophy size={32} />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Clubes Herói</p>
              <p className="text-2xl font-bold text-purple-900">
                {filteredClubs?.filter(c => c.classification === "HEROI").length || 0}
              </p>
            </div>
            <div className="text-purple-500">
              <Crown size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Clubes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Clubes da Região</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clube</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Região</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pontuação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classificação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Membros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClubs.map((club) => (
                <tr key={club._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{club.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{club.region}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {club.totalScore?.toLocaleString() || 0} pts
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                      club.classification === "HEROI" 
                        ? "bg-purple-100 text-purple-800"
                        : club.classification === "FIEL_ESCUDEIRO"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {club.classification === "HEROI" ? "HERÓI" : 
                       club.classification === "FIEL_ESCUDEIRO" ? "FIEL ESCUDEIRO" : "APRENDIZ"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {club.membersCount || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                Painel Staff - {user.region}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.name} ({user.role})
              </span>
              <button
                onClick={onLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "evaluation" && renderEvaluation()}
        {activeTab === "overview" && renderOverview()}
      </div>
    </div>
  );
}