import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export default function DebugScoring() {
  const [clubName, setClubName] = useState("");
  const debugData = useQuery(api.debug.debugClubScoring, clubName ? { clubName } : {});

  if (!debugData) return <div className="p-8">Carregando...</div>;

  if ("error" in debugData) {
    return <div className="p-8 text-red-600">{debugData.error}</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-red-600">🔍 DEBUG DE PONTUAÇÃO</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Nome do Clube:</label>
          <input
            type="text"
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            placeholder="Digite o nome do clube (deixe vazio para o primeiro)"
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">📊 Resumo do Clube: {debugData.clubName}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Pontuação Atual no DB:</p>
              <p className="text-2xl font-bold text-blue-600">{debugData.currentTotalScore} pts</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Classificação Atual:</p>
              <p className="text-2xl font-bold text-green-600">{debugData.currentClassification}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Logs de Avaliação:</p>
              <p className="text-2xl font-bold text-purple-600">{debugData.totalEvaluationLogs}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Critérios Avaliados:</p>
              <p className="text-2xl font-bold text-orange-600">{debugData.evaluatedCriteriaCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Penalidade Calculada:</p>
              <p className="text-2xl font-bold text-red-600">{debugData.calculatedPenalty} pts</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Score Esperado:</p>
              <p className="text-2xl font-bold text-green-600">{debugData.expectedScore} pts</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded mb-6">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ PROBLEMA IDENTIFICADO:</h3>
          {debugData.currentTotalScore === 1910 && debugData.evaluatedCriteriaCount > 0 ? (
            <p className="text-yellow-800">
              ❌ O clube tem {debugData.evaluatedCriteriaCount} critérios avaliados mas está com 1910 pts (pontuação máxima).
              <br/>
              ✅ Deveria ter: {debugData.expectedScore} pts (com {debugData.calculatedPenalty} pts de penalidade)
            </p>
          ) : (
            <p className="text-green-800">✅ Pontuação parece estar correta</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-bold mb-3">📋 Critérios Avaliados:</h3>
          <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-40">
            {debugData.evaluatedCriteriaList.join(", ")}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-bold mb-3">📝 Detalhes de Cada Critério:</h3>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="p-2 text-left">Categoria</th>
                  <th className="p-2 text-left">Critério</th>
                  <th className="p-2 text-center">Pontos Ganhos</th>
                  <th className="p-2 text-center">Foi Avaliado?</th>
                  <th className="p-2 text-center">Vai Penalizar?</th>
                </tr>
              </thead>
              <tbody>
                {debugData.scoreDetails.map((detail: any, idx: number) => (
                  <tr key={idx} className={detail.wasEvaluated ? "bg-yellow-50" : ""}>
                    <td className="p-2 border-t">{detail.category}</td>
                    <td className="p-2 border-t">{detail.key}</td>
                    <td className="p-2 border-t text-center font-bold">{detail.earnedPoints}</td>
                    <td className="p-2 border-t text-center">
                      {detail.wasEvaluated ? "✅ SIM" : "❌ NÃO"}
                    </td>
                    <td className="p-2 border-t text-center">
                      {detail.willPenalize ? "⚠️ SIM" : "✅ NÃO"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-bold mb-3">🗂️ Scores Brutos do DB:</h3>
          <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(debugData.rawScores, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-3">📜 Todos os Logs:</h3>
          <div className="space-y-2 max-h-96 overflow-auto">
            {debugData.allLogs.map((log: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-3 rounded border">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-blue-600">{log.action}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{log.details}</p>
                {log.scoreChange && (
                  <div className="mt-2 bg-yellow-100 p-2 rounded text-xs">
                    <strong>ScoreChange:</strong> {log.scoreChange.category}.{log.scoreChange.subcategory}
                    <br/>
                    Valor: {log.scoreChange.oldValue} → {log.scoreChange.newValue} (diff: {log.scoreChange.difference})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
