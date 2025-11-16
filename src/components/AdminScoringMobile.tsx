import { useState } from "react";
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
  Settings
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

  const totalScore = calculateTotalScore(editingScores);
  const classification = getClassification(totalScore);

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
                  const isLocked = isCriteriaEvaluated(selectedCategory, key, carouselKey);
                  const currentValue = editingScores?.events?.carousel?.[carouselKey] || 0;

                  return (
                    <div
                      key={carouselKey}
                      className={`bg-white border-2 rounded-xl p-4 ${
                        isLocked ? 'border-green-300 bg-green-50' : 'border-gray-200'
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

                      <div className="flex items-center gap-2">
                        <select
                          value={currentValue}
                          onChange={(e) => updateScore(selectedCategory, `carousel.${carouselKey}`, parseInt(e.target.value))}
                          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            isLocked && !adminEditMode ? 'bg-green-100 cursor-not-allowed' : 'bg-white'
                          }`}
                          disabled={isLocked && !adminEditMode}
                        >
                          <option value={0}>0 pts</option>
                          {carouselItem.partial !== undefined && (
                            <option value={carouselItem.partial}>{carouselItem.partial} pts (parcial)</option>
                          )}
                          <option value={carouselItem.max}>{carouselItem.max} pts (máximo)</option>
                        </select>

                        {!isLocked && currentValue > 0 && (
                          <button
                            onClick={() => lockSingleCriteria(selectedCategory, "carousel", carouselKey)}
                            className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                            disabled={lockingCriteria}
                          >
                            Travar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          // Critérios normais
          const isLocked = isCriteriaEvaluated(selectedCategory, key);
          const currentValue = editingScores?.[selectedCategory]?.[key] || 0;
          const isDemerits = categoryData.isDemerits;

          return (
            <div
              key={key}
              className={`bg-white border-2 rounded-xl p-4 ${
                isLocked ? 'border-green-300 bg-green-50' : 
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

              <div className="flex items-center gap-2">
                {isDemerits ? (
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
                ) : (
                  <select
                    value={currentValue}
                    onChange={(e) => updateScore(selectedCategory, key, parseInt(e.target.value))}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      isLocked && !adminEditMode ? 'bg-green-100 cursor-not-allowed' : 'bg-white'
                    }`}
                    disabled={isLocked && !adminEditMode}
                  >
                    <option value={0}>0 pts</option>
                    {item.partial !== undefined && (
                      <option value={item.partial}>{item.partial} pts (parcial)</option>
                    )}
                    <option value={item.max}>{item.max} pts (máximo)</option>
                  </select>
                )}

                {!isLocked && currentValue > 0 && (
                  <button
                    onClick={() => lockSingleCriteria(selectedCategory, key)}
                    className={`px-3 py-2 text-xs text-white rounded-lg hover:opacity-90 disabled:opacity-50 whitespace-nowrap ${
                      isDemerits ? 'bg-red-600' : 'bg-blue-600'
                    }`}
                    disabled={lockingCriteria}
                  >
                    Travar
                  </button>
                )}
              </div>
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
