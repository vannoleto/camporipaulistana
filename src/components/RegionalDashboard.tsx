import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  Crown, 
  Star, 
  Search, 
  Globe,
  Target,
  Building2,
  DoorOpen,
  CheckCircle,
  User
} from "lucide-react";

interface RegionalDashboardProps {
  user: any;
  onLogout: () => void;
}

export function RegionalDashboard({ user, onLogout }: RegionalDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [clubSearch, setClubSearch] = useState("");

  // Buscar dados específicos da região do usuário
  const regionClubs = useQuery(api.clubs.listClubs, { region: user.region });
  const allRanking = useQuery(api.clubs.getRanking, {});
  const allRegionStats = useQuery(api.clubs.getRegionStats, {});

  // Filtrar ranking para a região
  const regionRanking = allRanking?.filter(club => club.region === user.region);

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

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Clubes na Região</p>
              <p className="text-2xl font-bold text-blue-900">{regionStats?.total || 0}</p>
            </div>
            <div className="text-blue-500">
              <Building2 size={32} />
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Pontuação Média</p>
              <p className="text-2xl font-bold text-green-900">
                {regionStats?.averageScore.toLocaleString() || 0}
              </p>
            </div>
            <div className="text-green-500">
              <BarChart3 size={32} />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Maior Pontuação</p>
              <p className="text-2xl font-bold text-yellow-900">
                {regionStats?.highestScore.toLocaleString() || 0}
              </p>
            </div>
            <div className="text-yellow-500">
              <Star size={32} />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Clubes Missionário</p>
              <p className="text-2xl font-bold text-purple-900">
                {regionStats?.classifications.MISSIONÁRIO || 0}
              </p>
            </div>
            <div className="text-purple-500">
              <Crown size={32} />
            </div>
          </div>
        </div>
      </div>

      {regionStats && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Classificação - {user.region}</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mb-3 text-yellow-500">
                <Crown size={40} />
              </div>
              <div className="text-3xl font-bold text-purple-600">{regionStats.classifications.MISSIONÁRIO}</div>
              <div className="text-sm text-gray-600 font-medium">MISSIONÁRIO</div>
              <div className="text-xs text-gray-500 mt-1">
                {regionStats.total > 0 ? Math.round((regionStats.classifications.MISSIONÁRIO / regionStats.total) * 100) : 0}%
              </div>
            </div>
            <div className="text-center">
              <div className="mb-3 text-blue-600">
                <Trophy size={40} />
              </div>
              <div className="text-3xl font-bold text-blue-600">{regionStats.classifications.VOLUNTÁRIO}</div>
              <div className="text-sm text-gray-600 font-medium">VOLUNTÁRIO</div>
              <div className="text-xs text-gray-500 mt-1">
                {regionStats.total > 0 ? Math.round((regionStats.classifications.VOLUNTÁRIO / regionStats.total) * 100) : 0}%
              </div>
            </div>
            <div className="text-center">
              <div className="mb-3 text-green-600">
                <Target size={40} />
              </div>
              <div className="text-3xl font-bold text-green-600">{regionStats.classifications.APRENDIZ}</div>
              <div className="text-sm text-gray-600 font-medium">APRENDIZ</div>
              <div className="text-xs text-gray-500 mt-1">
                {regionStats.total > 0 ? Math.round((regionStats.classifications.APRENDIZ / regionStats.total) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Resumo da Região {user.region}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{regionStats?.total || 0}</div>
            <div className="text-sm text-gray-600">Total de Clubes</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {regionStats?.averageScore.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">Pontuação Média</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {regionStats?.highestScore.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">Maior Pontuação</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {regionStats?.lowestScore.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">Menor Pontuação</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClubs = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Clubes da {user.region}</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nome ou classificação..."
            value={clubSearch}
            onChange={(e) => setClubSearch(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
        </div>
      </div>

      {clubSearch && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <p className="text-blue-800 text-sm">
            Mostrando {filteredClubs?.length || 0} de {regionClubs?.length || 0} clubes
            {clubSearch && ` para "${clubSearch}"`}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Posição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Clube
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Membros
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pontuação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Classificação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClubs?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {clubSearch ? "Nenhum clube encontrado para a busca" : "Nenhum clube cadastrado na região"}
                  </td>
                </tr>
              ) : (
                filteredClubs
                  ?.sort((a, b) => b.totalScore - a.totalScore)
                  .map((club, index) => (
                    <tr key={club._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? "bg-yellow-500 text-white" :
                          index === 1 ? "bg-gray-400 text-white" :
                          index === 2 ? "bg-orange-500 text-white" :
                          "bg-gray-200 text-gray-700"
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{club.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-blue-600 font-medium">{club.membersCount || 0} membros</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-lg">
                        {club.totalScore.toLocaleString()} pts
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          club.classification === "MISSIONÁRIO" 
                            ? "bg-purple-100 text-purple-800"
                            : club.classification === "VOLUNTÁRIO"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {club.classification === "MISSIONÁRIO" ? (
                            <span className="flex items-center gap-1">
                              <Crown size={12} />
                              MISSIONÁRIO
                            </span>
                          ) : club.classification === "VOLUNTÁRIO" ? (
                            <span className="flex items-center gap-1">
                              <Trophy size={12} />
                              VOLUNTÁRIO
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Target size={12} />
                              {club.classification}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          club.isActive 
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {club.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRanking = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Ranking da {user.region}</h2>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          {regionRanking?.slice(0, 10).map((club, index) => (
            <div key={club._id} className={`flex items-center justify-between p-4 rounded-lg mb-3 ${
              index === 0 ? "bg-yellow-50 border-2 border-yellow-200" :
              index === 1 ? "bg-gray-50 border-2 border-gray-200" :
              index === 2 ? "bg-orange-50 border-2 border-orange-200" :
              "bg-gray-25 border border-gray-100"
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  index === 0 ? "bg-yellow-500 text-white" :
                  index === 1 ? "bg-gray-400 text-white" :
                  index === 2 ? "bg-orange-500 text-white" :
                  "bg-gray-200 text-gray-700"
                }`}>
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{club.name}</h3>
                  <p className="text-sm text-gray-600">{club.region}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-xl">{club.totalScore.toLocaleString()} pts</div>
                <div className={`text-sm px-3 py-1 rounded-full font-medium ${
                  club.classification === "MISSIONÁRIO" 
                    ? "bg-purple-100 text-purple-800"
                    : club.classification === "VOLUNTÁRIO"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}>
                  {club.classification === "MISSIONÁRIO" ? (
                    <span className="flex items-center gap-1">
                      <Crown size={14} />
                      MISSIONÁRIO
                    </span>
                  ) : club.classification === "VOLUNTÁRIO" ? (
                    <span className="flex items-center gap-1">
                      <Trophy size={14} />
                      VOLUNTÁRIO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Target size={14} />
                      {club.classification}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Comparação com Outras Regiões</h2>

      {allRegionStats && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Posição da {user.region} no Ranking Geral</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(allRegionStats)
              .sort(([, a]: [string, any], [, b]: [string, any]) => b.averageScore - a.averageScore)
              .map(([region, stats]: [string, any], index) => (
              <div key={region} className={`border rounded-lg p-4 ${
                region === user.region ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-lg">{region}</div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-yellow-500 text-white" :
                    index === 1 ? "bg-gray-400 text-white" :
                    index === 2 ? "bg-orange-500 text-white" :
                    "bg-gray-200 text-gray-700"
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {stats.total} clubes
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {stats.averageScore.toLocaleString()} pts
                </div>
                <div className="text-xs text-gray-500">média</div>
                <div className="mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-yellow-500" />
                    {stats.classifications.MISSIONÁRIO}
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-blue-500" />
                    {stats.classifications.VOLUNTÁRIO}
                  </div>
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-green-500" />
                    {stats.classifications.APRENDIZ}
                  </div>
                </div>
                {region === user.region && (
                  <div className="mt-2 text-xs font-medium text-blue-600">
                    Sua Região
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {regionStats && allRegionStats && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Estatísticas Detalhadas da {user.region}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Posição no ranking:</span>
                  <span className="font-medium">
                    {Object.entries(allRegionStats)
                      .sort(([, a]: [string, any], [, b]: [string, any]) => b.averageScore - a.averageScore)
                      .findIndex(([region]) => region === user.region) + 1}º lugar
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pontuação média:</span>
                  <span className="font-medium">{regionStats.averageScore.toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Melhor clube:</span>
                  <span className="font-medium">{regionStats.highestScore.toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clube com menor pontuação:</span>
                  <span className="font-medium">{regionStats.lowestScore.toLocaleString()} pts</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Distribuição</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Crown size={16} />
                    Missionários:
                  </span>
                  <span className="font-medium">
                    {regionStats.classifications.MISSIONÁRIO} 
                    ({regionStats.total > 0 ? Math.round((regionStats.classifications.MISSIONÁRIO / regionStats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Trophy size={16} />
                    Voluntários:
                  </span>
                  <span className="font-medium">
                    {regionStats.classifications.VOLUNTÁRIO}
                    ({regionStats.total > 0 ? Math.round((regionStats.classifications.VOLUNTÁRIO / regionStats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Target size={16} />
                    Aprendizes:
                  </span>
                  <span className="font-medium">
                    {regionStats.classifications.APRENDIZ}
                    ({regionStats.total > 0 ? Math.round((regionStats.classifications.APRENDIZ / regionStats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "clubs": return renderClubs();
      case "ranking": return renderRanking();
      case "comparison": return renderComparison();
      default: return renderOverview();
    }
  };

  const [showUserMenu, setShowUserMenu] = useState(false);

  const tabs = [
    { id: "overview", name: "Visão Geral", icon: <BarChart3 size={20} /> },
    { id: "clubs", name: "Clubes", icon: <Building2 size={20} /> },
    { id: "ranking", name: "Ranking", icon: <Trophy size={20} /> },
    { id: "reports", name: "Relatórios", icon: <Target size={20} /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Mobile */}
      <div className="bg-gradient-to-r from-campori-darkGreen to-campori-green text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Globe size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                Bem-vindo, {user.name || 'Regional'}
              </h2>
              <p className="text-xs text-indigo-200">
                Regional
              </p>
              <p className="text-xs text-indigo-200">
                Região: {user.region}
              </p>
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
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Globe size={16} className="text-campori-darkGreen" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{user.name || 'Regional'}</p>
                      <p className="text-xs text-gray-500">Regional - {user.region}</p>
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
              className={`flex flex-col items-center py-2 px-3 transition-all duration-200 ${
                activeTab === tab.id
                  ? "text-campori-darkGreen"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className={activeTab === tab.id ? "text-indigo-600" : "text-current"}>
                {tab.icon}
              </span>
              <span className="text-xs mt-1 font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
