import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Plus, Trash2, Save, Copy, Upload } from "lucide-react";

interface CriteriaManagerProps {
  user: any;
}

export function CriteriaManager({ user }: CriteriaManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState("prerequisites");
  const [bulkText, setBulkText] = useState("");
  const [newCriterion, setNewCriterion] = useState({
    key: "",
    description: "",
    max: 0,
    partial: 0,
  });

  const scoringCriteria = useQuery(api.scoring.getScoringCriteria, {});
  const createCriterion = useMutation(api.scoring.createScoringCriterion);
  const deleteCriterion = useMutation(api.scoring.deleteScoringCriterion);

  const categories = [
    { id: "prerequisites", name: "Pré-requisitos", color: "bg-blue-100 text-blue-800" },
    { id: "campground", name: "Área de Acampamento", color: "bg-green-100 text-green-800" },
    { id: "kitchen", name: "Cozinha", color: "bg-orange-100 text-orange-800" },
    { id: "participation", name: "Participação", color: "bg-purple-100 text-purple-800" },
    { id: "uniform", name: "Uniforme", color: "bg-indigo-100 text-indigo-800" },
    { id: "secretary", name: "Secretaria", color: "bg-pink-100 text-pink-800" },
    { id: "events", name: "Eventos/Provas", color: "bg-yellow-100 text-yellow-800" },
    { id: "bonus", name: "Bônus", color: "bg-teal-100 text-teal-800" },
    { id: "demerits", name: "Deméritos", color: "bg-red-100 text-red-800" },
  ];

  const handleAddCriterion = async () => {
    if (!newCriterion.key || !newCriterion.description || newCriterion.max <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createCriterion({
        category: selectedCategory,
        key: newCriterion.key,
        description: newCriterion.description,
        max: newCriterion.max,
        partial: newCriterion.partial || 0,
        adminId: user._id,
      });
      toast.success("Critério adicionado com sucesso!");
      setNewCriterion({ key: "", description: "", max: 0, partial: 0 });
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar critério");
    }
  };

  const handleBulkImport = () => {
    // Formato esperado: cada linha = "descrição | pontos_max | pontos_parcial"
    // Exemplo: "Presença do diretor | 30 | 0"
    const lines = bulkText.trim().split("\n");
    let successCount = 0;
    let errorCount = 0;

    lines.forEach(async (line, index) => {
      const parts = line.split("|").map(p => p.trim());
      if (parts.length >= 2) {
        const description = parts[0];
        const max = parseFloat(parts[1]) || 0;
        const partial = parts[2] ? parseFloat(parts[2]) : 0;
        const key = `item_${Date.now()}_${index}`; // Gerar chave única

        try {
          await createCriterion({
            category: selectedCategory,
            key,
            description,
            max,
            partial,
            adminId: user._id,
          });
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }
    });

    setTimeout(() => {
      if (successCount > 0) {
        toast.success(`${successCount} critérios adicionados!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} erros ao adicionar`);
      }
      setBulkText("");
    }, 500);
  };

  const handleDeleteCriterion = async (key: string) => {
    try {
      await deleteCriterion({
        category: selectedCategory,
        key,
        adminId: user._id,
      });
      toast.success("Critério removido!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover critério");
    }
  };

  const currentCriteria = scoringCriteria?.[selectedCategory] || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Gerenciador de Critérios de Pontuação
        </h1>

        {/* Seletor de Categoria */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3 rounded-lg font-medium transition-all ${
                selectedCategory === cat.id
                  ? cat.color + " ring-2 ring-offset-2 ring-blue-500"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid de 2 colunas */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Coluna 1: Adicionar Individual */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus size={20} />
              Adicionar Critério Individual
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chave Técnica (sem espaços)
                </label>
                <input
                  type="text"
                  placeholder="ex: directorPresence"
                  value={newCriterion.key}
                  onChange={(e) => setNewCriterion({ ...newCriterion, key: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (aparece no app)
                </label>
                <input
                  type="text"
                  placeholder="ex: Presença do diretor na reunião prévia"
                  value={newCriterion.description}
                  onChange={(e) => setNewCriterion({ ...newCriterion, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pontos Máximos
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    value={newCriterion.max || ""}
                    onChange={(e) => setNewCriterion({ ...newCriterion, max: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pontos Parciais (opcional)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newCriterion.partial || ""}
                    onChange={(e) => setNewCriterion({ ...newCriterion, partial: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleAddCriterion}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Adicionar Critério
              </button>
            </div>
          </div>

          {/* Coluna 2: Importar em Massa */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Upload size={20} />
              Importar em Massa (do PDF)
            </h2>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-blue-900 mb-2">📋 Como usar:</p>
                <ol className="text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Copie o texto do PDF</li>
                  <li>Cole abaixo (uma linha por critério)</li>
                  <li>Formato: <code className="bg-blue-100 px-1 rounded">Descrição | Pontos | Parcial</code></li>
                  <li>Exemplo: <code className="bg-blue-100 px-1 rounded">Presença diretor | 30 | 0</code></li>
                </ol>
              </div>

              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Presença do diretor | 30 | 0
Kit de primeiros socorros | 50 | 25
Uniforme completo | 100 | 50"
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />

              <button
                onClick={handleBulkImport}
                disabled={!bulkText.trim()}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Copy size={20} />
                Importar {bulkText.split("\n").filter(l => l.trim()).length} Critérios
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Critérios Existentes */}
        <div className="bg-white p-6 rounded-xl shadow-sm mt-6">
          <h2 className="text-xl font-bold mb-4">
            Critérios em {categories.find(c => c.id === selectedCategory)?.name}
          </h2>

          {Object.keys(currentCriteria).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum critério cadastrado nesta categoria</p>
              <p className="text-sm mt-2">Use os formulários acima para adicionar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(currentCriteria).map(([key, item]: [string, any]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>Máx: <strong>{item.max}</strong> pts</span>
                      {item.partial > 0 && (
                        <span>Parcial: <strong>{item.partial}</strong> pts</span>
                      )}
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                        {key}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteCriterion(key)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
