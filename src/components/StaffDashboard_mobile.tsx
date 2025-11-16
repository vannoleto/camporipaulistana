import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { QRScanner } from "./QRScanner";
import { 
  ClipboardList,
  Users, 
  Trophy, 
  Target, 
  Building2,
  X,
  User,
  DoorOpen,
  QrCode,
  Shield,
  FileText,
  ChevronRight,
  ChevronLeft,
  Save
} from "lucide-react";

interface StaffDashboardProps {
  user: any;
  onLogout: () => void;
}

export function StaffDashboard({ user, onLogout }: StaffDashboardProps) {
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const clubs = useQuery(api.clubs.listClubs, {});
  const selectedClubData = useQuery(
    api.clubs.getClubById, 
    selectedClub ? { clubId: selectedClub._id } : "skip"
  );
  const updateClubScores = useMutation(api.clubs.updateClubScores);

  const categories = [
    { id: "prerequisites", name: "Pré-requisitos", icon: <ClipboardList size={20} />, max: "30", color: "bg-green-50 border-green-300 text-green-700" },
    { id: "campground", name: "Acampamento", icon: <Building2 size={20} />, max: "280", color: "bg-orange-50 border-orange-300 text-orange-700" },
    { id: "kitchen", name: "Cozinha", icon: <Trophy size={20} />, max: "240", color: "bg-purple-50 border-purple-300 text-purple-700" },
    { id: "participation", name: "Participação", icon: <Users size={20} />, max: "420", color: "bg-blue-50 border-blue-300 text-blue-700" },
    { id: "uniform", name: "Uniforme", icon: <Shield size={20} />, max: "120", color: "bg-indigo-50 border-indigo-300 text-indigo-700" },
    { id: "secretary", name: "Secretaria", icon: <FileText size={20} />, max: "300", color: "bg-teal-50 border-teal-300 text-teal-700" },
  ];

  const handleClubScanned = (clubData: any) => {
    const club = clubs?.find(c => c._id === clubData.clubId || c.name === clubData.name);
    if (club) {
      setSelectedClub(club);
      toast.success(`Clube ${club.name} selecionado!`);
    } else {
      toast.error("Clube não encontrado");
    }
    setShowQRScanner(false);
  };

  const handleSave = async () => {
    if (!selectedClub || !formData || Object.keys(formData).length === 0) {
      toast.error("Nenhuma alteração para salvar");
      return;
    }

    try {
      await updateClubScores({
        clubId: selectedClub._id,
        scores: formData,
        staffId: user._id,
      });
      toast.success("Pontuações salvas com sucesso!");
      setFormData({});
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!selectedClub) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-campori-brown to-campori-darkRed text-white p-4 shadow-lg sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{user.name}</h2>
              <p className="text-xs opacity-90">Staff - Avaliação</p>
            </div>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative"
            >
              <User size={20} />
              {showUserMenu && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-xl border z-50">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-lg"
                  >
                    <DoorOpen size={16} />
                    Sair
                  </button>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Botão QR Scanner */}
        <div className="p-4">
          <button
            onClick={() => setShowQRScanner(true)}
            className="w-full bg-gradient-to-r from-campori-brown to-campori-darkRed text-white py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <QrCode size={24} />
            <span className="font-semibold">Escanear QR Code do Clube</span>
          </button>

          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>Peça ao diretor do clube para mostrar o QR Code</p>
            <p className="mt-1">disponível no Dashboard do clube</p>
          </div>
        </div>

        {showQRScanner && (
          <QRScanner
            onScanResult={(data) => {
              try {
                const clubData = JSON.parse(data);
                handleClubScanned(clubData);
              } catch {
                toast.error('QR Code inválido');
              }
            }}
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </div>
    );
  }

  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-50 pb-4">
        {/* Header do Clube */}
        <div className="bg-white shadow-sm p-4 sticky top-0 z-40">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setSelectedClub(null)}
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
          <div className="bg-gradient-to-r from-campori-brown to-campori-darkRed text-white p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">Pontuação Total</p>
                <p className="text-2xl font-bold">{selectedClubData?.totalScore || 1910} pts</p>
              </div>
              <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                {selectedClubData?.classification || "APRENDIZ"}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Categorias */}
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Selecione uma Categoria para Avaliar</h3>
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
                  <p className="text-xs opacity-75">Máximo: {cat.max} pts</p>
                </div>
              </div>
              <ChevronRight size={20} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const categoryData = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header da Categoria */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-40">
        <button
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-3"
        >
          <ChevronLeft size={20} />
          <span>Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <div className={`${categoryData?.color} p-2 rounded-lg border-2`}>
            {categoryData?.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold">{categoryData?.name}</h2>
            <p className="text-sm text-gray-600">{selectedClub.name}</p>
          </div>
        </div>
      </div>

      {/* Formulário Simplificado */}
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-center text-gray-500 text-sm">
            Formulário de avaliação em desenvolvimento
          </p>
        </div>
      </div>

      {/* Botão Salvar Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <button
          onClick={handleSave}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Save size={20} />
          Salvar Avaliação
        </button>
      </div>
    </div>
  );
}
