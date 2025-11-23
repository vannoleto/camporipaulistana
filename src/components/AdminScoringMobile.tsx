import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { 
  ClipboardList,
  Building2,
  ChefHat,
  Users, 
  Shield,
  FileText,
  Star,
  Trophy,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  Crown,
  Settings,
  X
} from "lucide-react";

interface AdminScoringMobileProps {
  selectedClub: any;
  editingScores: any;
  scoringCriteria: any;
  adminEditMode: boolean;
  lockingCriteria: boolean;
  onClose: () => void;
  onSave: () => void;
  onEnableEditMode: () => void;
  onSaveAdminChanges: () => void;
  updateScore: (category: string, field: string, value: number) => void;
  lockSingleCriteria: (category: string, field: string, subField?: string) => void;
  isCriteriaEvaluated: (category: string, field: string, subField?: string) => boolean;
  calculateTotalScore: (scores: any) => number;
  getClassification: (score: number) => string;
}

export function AdminScoringMobile({
  selectedClub,
  editingScores,
  scoringCriteria,
  adminEditMode,
  lockingCriteria,
  onClose,
  onSave,
  onEnableEditMode,
  onSaveAdminChanges,
  updateScore,
  lockSingleCriteria,
  isCriteriaEvaluated,
  calculateTotalScore,
  getClassification
}: AdminScoringMobileProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lockedCriteria, setLockedCriteria] = useState<Set<string>>(new Set());

  // Query para buscar critérios travados
  const lockedCriteriaData = useQuery(
    api.clubs.getLockedCriteria,
    selectedClub ? { clubId: selectedClub._id } : "skip"
  );

  // Carregar critérios travados quando os dados mudarem
  useEffect(() => {
    if (lockedCriteriaData) {
      const locked = new Set<string>();
      lockedCriteriaData.forEach((item: any) => {
        // Format: category:key ou category:subCategory.key
        const fullKey = item.criteriaKey.includes('.')
          ? `${item.category}:${item.criteriaKey}`
          : `${item.category}:${item.criteriaKey}`;
        locked.add(fullKey);
      });
      setLockedCriteria(locked);
    }
  }, [lockedCriteriaData]);

  // Função para verificar se critério está travado
  const isCriteriaLocked = (category: string, key: string, subKey?: string): boolean => {
    const fullKey = subKey 
      ? `${category}:${key}.${subKey}`
      : `${category}:${key}`;
    return lockedCriteria.has(fullKey);
  };

  // Função para aplicar pontuação (atualiza apenas o estado local, travamento acontece no save)
  const applyScore = (category: string, key: string, value: number, subKey?: string) => {
    // Verifica se já está travado (e não está em modo de edição admin)
    if (isCriteriaLocked(category, key, subKey) && !adminEditMode) {
      toast.error("Este critério já foi avaliado.", {
        duration: 3000,
      });
      return;
    }

    // Atualiza o score usando a função do AdminDashboard
    if (subKey) {
      updateScore(category, `${key}.${subKey}`, value);
    } else {
      updateScore(category, key, value);
    }

    // Marca localmente como travado para feedback visual
    const fullKey = subKey 
      ? `${category}:${key}.${subKey}`
      : `${category}:${key}`;
    
    setLockedCriteria(prev => new Set(prev).add(fullKey));

    // Mostra feedback
    toast.success("Pontuação aplicada! Clique em 'Salvar' para persistir.", {
      duration: 2000,
    });
  };

  const totalScore = selectedClub.totalScore || 1910;
  const classification = selectedClub.classification || getClassification(totalScore);

  const categories = [
    { 
      id: "prerequisites", 
      name: "Pré-requisitos", 
      icon: <ClipboardList size={20} />, 
      max: 30, 
      color: "bg-green-50 border-green-300 text-green-700",
      data: scoringCriteria?.prerequisites
    },
    { 
      id: "campground", 
      name: "Acampamento", 
      icon: <Building2 size={20} />, 
      max: 280, 
      color: "bg-orange-50 border-orange-300 text-orange-700",
      data: scoringCriteria?.campground
    },
    { 
      id: "kitchen", 
      name: "Cozinha", 
      icon: <ChefHat size={20} />, 
      max: 240, 
      color: "bg-purple-50 border-purple-300 text-purple-700",
      data: scoringCriteria?.kitchen
    },
    { 
      id: "participation", 
      name: "Participação", 
      icon: <Users size={20} />, 
      max: 420, 
      color: "bg-blue-50 border-blue-300 text-blue-700",
      data: scoringCriteria?.participation
    },
    { 
      id: "uniform", 
      name: "Uniforme", 
      icon: <Shield size={20} />, 
      max: 120, 
      color: "bg-indigo-50 border-indigo-300 text-indigo-700",
      data: scoringCriteria?.uniform
    },
    { 
      id: "secretary", 
      name: "Secretaria", 
      icon: <FileText size={20} />, 
      max: 300, 
      color: "bg-teal-50 border-teal-300 text-teal-700",
      data: scoringCriteria?.secretary
    },
    { 
      id: "events", 
      name: "Eventos/Provas", 
      icon: <Star size={20} />, 
      max: 350, 
      color: "bg-yellow-50 border-yellow-300 text-yellow-700",
      data: scoringCriteria?.events
    },
    { 
      id: "bonus", 
      name: "Bônus", 
      icon: <Trophy size={20} />, 
      max: 150, 
      color: "bg-pink-50 border-pink-300 text-pink-700",
      data: scoringCriteria?.bonus
    },
    { 
      id: "demerits", 
      name: "Deméritos", 
      icon: <AlertTriangle size={20} />, 
      max: 0, 
      color: "bg-red-50 border-red-300 text-red-700",
      data: scoringCriteria?.demerits,
      isDemerits: true
    }
  ];

  // Visão de lista de categorias
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-50 pb-4">
        {/* Header do Clube */}
        <div className="bg-white shadow-sm p-4 sticky top-0 z-40">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-lg font-bold text-gray-900">{selectedClub.name}</h2>
              <p className="text-sm text-gray-600">{selectedClub.region} • {selectedClub?.membersCount || 0} membros</p>
            </div>
            <div className="w-10" />
          </div>

          {/* Pontuação */}
          <div className="bg-gradient-to-r from-campori-brown to-campori-darkRed text-white p-3 rounded-lg mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">Pontuação Total</p>
                <p className="text-2xl font-bold">{totalScore} pts</p>
              </div>
              <div className="flex items-center gap-2">
                {classification === "MISSIONÁRIO" && <Crown size={20} className="text-yellow-300" />}
                {classification === "VOLUNTÁRIO" && <Trophy size={20} className="text-blue-300" />}
                {classification === "APRENDIZ" && <Star size={20} className="text-orange-300" />}
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  {classification}
                </span>
              </div>
            </div>
          </div>

          {/* Modo Admin Edit */}
          {adminEditMode && (
            <div className="bg-orange-50 border border-orange-200 p-2 rounded-lg mb-3">
              <p className="text-xs text-orange-800 font-medium text-center">
                🔓 Modo Edição Ativo - Critérios destravados
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2">
            {!adminEditMode ? (
              <button
                onClick={onEnableEditMode}
                className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Settings size={16} />
                Editar
              </button>
            ) : (
              <button
                onClick={onSaveAdminChanges}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Salvar Edição
              </button>
            )}
            <button
              onClick={onSave}
              className="flex-1 bg-campori-brown text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ display: adminEditMode ? 'none' : 'flex' }}
            >
              <Save size={16} />
              Salvar
            </button>
          </div>
        </div>

        {/* Lista de Categorias */}
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Categorias de Avaliação</h3>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full ${cat.color} border-2 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-[0.98]`}
            >
              <div className="flex items-center gap-3">
                {cat.icon}
                <div className="text-left">
                  <p className="font-semibold">{cat.name}</p>
                  <p className="text-xs opacity-75">
                    {cat.isDemerits ? "Penalidades" : `Máximo: ${cat.max} pts`}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Visão de detalhes da categoria
  const categoryData = categories.find(c => c.id === selectedCategory);
  if (!categoryData?.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Carregando critérios...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header da Categoria */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-40">
        <button
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-3"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <div className={`${categoryData.color} p-2 rounded-lg border-2`}>
            {categoryData.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold">{categoryData.name}</h2>
            <p className="text-sm text-gray-600">{selectedClub.name}</p>
          </div>
        </div>
      </div>

      {/* Lista de Critérios */}
      <div className="p-4 space-y-3">
        {Object.entries(categoryData.data).map(([key, item]: [string, any]) => {
          // Tratamento especial para carousel (eventos)
          if (key === 'carousel' && typeof item === 'object' && !item.max) {
            return (
              <div key={key} className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800">Carrossel de Atividades</p>
                </div>
                {Object.entries(item).map(([carouselKey, carouselItem]: [string, any]) => {
                  const isLocked = isCriteriaLocked(selectedCategory, 'carousel', carouselKey);
                  const currentValue = editingScores?.events?.carousel?.[carouselKey] || 0;

                  return (
                    <div
                      key={carouselKey}
                      className={`bg-white border-2 rounded-xl p-4 ${
                        isLocked ? 'border-green-400 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{carouselItem.description}</p>
                            {isLocked && <CheckCircle size={16} className="text-green-600" />}
                          </div>
                          <p className="text-xs text-gray-500">
                            Máximo: {carouselItem.max} pts
                            {carouselItem.partial !== undefined && ` • Parcial: ${carouselItem.partial} pts`}
                          </p>
                        </div>
                      </div>

                      {isLocked ? (
                        <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                          <p className="text-sm text-green-800 font-medium">
                            ✓ Critério já avaliado ({currentValue} pts)
                          </p>
                          {!adminEditMode && (
                            <p className="text-xs text-green-700 mt-1">
                              Apenas administradores podem editar
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {/* Botão Pontuação Total */}
                          <button
                            onClick={() => applyScore(selectedCategory, 'carousel', carouselItem.max, carouselKey)}
                            className="flex flex-col items-center justify-center gap-2 p-3 bg-green-50 hover:bg-green-100 border-2 border-green-300 rounded-lg transition-all active:scale-95"
                          >
                            <Trophy size={24} className="text-green-600" />
                            <span className="text-xs font-semibold text-green-700">Total</span>
                            <span className="text-sm font-bold text-green-800">{carouselItem.max} pts</span>
                          </button>

                          {/* Botão Pontuação Parcial */}
                          {carouselItem.partial !== undefined && (
                            <button
                              onClick={() => applyScore(selectedCategory, 'carousel', carouselItem.partial, carouselKey)}
                              className="flex flex-col items-center justify-center gap-2 p-3 bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-300 rounded-lg transition-all active:scale-95"
                            >
                              <Star size={24} className="text-yellow-600" />
                              <span className="text-xs font-semibold text-yellow-700">Parcial</span>
                              <span className="text-sm font-bold text-yellow-800">{carouselItem.partial} pts</span>
                            </button>
                          )}

                          {/* Botão Zero */}
                          <button
                            onClick={() => applyScore(selectedCategory, 'carousel', 0, carouselKey)}
                            className={`flex flex-col items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 border-2 border-red-300 rounded-lg transition-all active:scale-95 ${
                              carouselItem.partial === undefined ? 'col-span-1' : ''
                            }`}
                          >
                            <X size={24} className="text-red-600" />
                            <span className="text-xs font-semibold text-red-700">Zero</span>
                            <span className="text-sm font-bold text-red-800">0 pts</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }

          // Critérios normais
          const isLocked = isCriteriaLocked(selectedCategory, key);
          const currentValue = editingScores?.[selectedCategory]?.[key] || 0;
          const isDemerits = categoryData.isDemerits;

          return (
            <div
              key={key}
              className={`bg-white border-2 rounded-xl p-4 ${
                isLocked ? 'border-green-400 bg-green-50' : 
                isDemerits ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">{item.description}</p>
                    {isLocked && <CheckCircle size={16} className="text-green-600" />}
                  </div>
                  <p className="text-xs text-gray-500">
                    {isDemerits ? (
                      `Penalidade: ${item.penalty} pts por ocorrência`
                    ) : (
                      `Máximo: ${item.max} pts${item.partial !== undefined ? ` • Parcial: ${item.partial} pts` : ''}`
                    )}
                  </p>
                </div>
              </div>

              {isDemerits ? (
                // Deméritos mantém input numérico
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={currentValue}
                    onChange={(e) => updateScore(selectedCategory, key, parseInt(e.target.value) || 0)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                      isLocked && !adminEditMode ? 'bg-red-100 cursor-not-allowed' : 'bg-white'
                    }`}
                    disabled={isLocked && !adminEditMode}
                    placeholder="Número de ocorrências"
                  />
                  {!isLocked && currentValue > 0 && (
                    <button
                      onClick={() => {
                        const fullKey = `${selectedCategory}:${key}`;
                        setLockedCriteria(prev => new Set(prev).add(fullKey));
                        toast.success("Demérito travado!");
                      }}
                      className="px-3 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
                      disabled={lockingCriteria}
                    >
                      Travar
                    </button>
                  )}
                </div>
              ) : isLocked ? (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Critério já avaliado ({currentValue} pts)
                  </p>
                  {!adminEditMode && (
                    <p className="text-xs text-green-700 mt-1">
                      Apenas administradores podem editar
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {/* Botão Pontuação Total */}
                  <button
                    onClick={() => applyScore(selectedCategory, key, item.max)}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-green-50 hover:bg-green-100 border-2 border-green-300 rounded-lg transition-all active:scale-95"
                  >
                    <Trophy size={24} className="text-green-600" />
                    <span className="text-xs font-semibold text-green-700">Total</span>
                    <span className="text-sm font-bold text-green-800">{item.max} pts</span>
                  </button>

                  {/* Botão Pontuação Parcial */}
                  {item.partial !== undefined && (
                    <button
                      onClick={() => applyScore(selectedCategory, key, item.partial)}
                      className="flex flex-col items-center justify-center gap-2 p-3 bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-300 rounded-lg transition-all active:scale-95"
                    >
                      <Star size={24} className="text-yellow-600" />
                      <span className="text-xs font-semibold text-yellow-700">Parcial</span>
                      <span className="text-sm font-bold text-yellow-800">{item.partial} pts</span>
                    </button>
                  )}

                  {/* Botão Zero */}
                  <button
                    onClick={() => applyScore(selectedCategory, key, 0)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 border-2 border-red-300 rounded-lg transition-all active:scale-95 ${
                      item.partial === undefined ? 'col-span-1' : ''
                    }`}
                  >
                    <X size={24} className="text-red-600" />
                    <span className="text-xs font-semibold text-red-700">Zero</span>
                    <span className="text-sm font-bold text-red-800">0 pts</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Avisos */}
      {categoryData.isDemerits && (
        <div className="px-4 pb-4">
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <p className="text-xs text-red-800">
              <strong>Deméritos:</strong> Digite o número de ocorrências. Os pontos serão subtraídos automaticamente da pontuação total.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
