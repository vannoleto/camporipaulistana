import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Crown, Globe, Building2, UserCheck, Zap } from "lucide-react";
import aventuriLogo from "../aventuri.png";

interface ProfileSelectionProps {
  onLogin: (user: any) => void;
}

export function ProfileSelection({ onLogin }: ProfileSelectionProps) {
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    region: "",
    clubName: "",
    role: "",
  });

  const loginUser = useMutation(api.users.loginUser);
  const registerUser = useMutation(api.users.registerUser);
  const listClubs = useQuery(api.clubs.listClubs, {});

  const profiles = [
    {
      id: "admin",
      title: "Administrador",
      description: "Acesso completo ao sistema",
      icon: <Crown size={32} />,
      color: "bg-red-500",
    },
    {
      id: "regional",
      title: "Regional",
      description: "Gerenciar clubes da região",
      icon: <Globe size={32} />,
      color: "bg-blue-500",
    },
    {
      id: "director",
      title: "Diretor/Secretário",
      description: "Gerenciar clube específico",
      icon: <Building2 size={32} />,
      color: "bg-green-500",
    },
    {
      id: "staff",
      title: "Staff",
      description: "Pontuar e editar pontuações",
      icon: <Zap size={32} />,
      color: "bg-purple-500",
    },
  ];

  const regions = Array.from({ length: 12 }, (_, i) => `R${i + 1}`);

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfile(profileId);
    if (profileId === "admin") {
      setShowLoginForm(true);
      setFormData({ ...formData, role: "admin" });
    } else {
      setShowLoginForm(true);
      setFormData({ ...formData, role: profileId === "director" ? "director" : profileId });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedProfile === "admin") {
        const user = await loginUser({
          name: "Administrador",
          password: formData.password,
          role: "admin",
        });
        onLogin(user);
        toast.success("Login realizado com sucesso!");
      } else {
        const user = await loginUser({
          name: formData.name,
          password: formData.password,
        });
        onLogin(user);
        toast.success("Login realizado com sucesso!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let clubId = undefined;
      
      // Se for diretor/secretário, encontrar o ID do clube
      if ((formData.role === "director" || formData.role === "secretary") && formData.clubName) {
        const selectedClub = listClubs?.find(club => club.name === formData.clubName);
        clubId = selectedClub?._id;
        
        if (!clubId) {
          toast.error("Clube não encontrado. Verifique se selecionou corretamente.");
          return;
        }
      }
      
      await registerUser({
        name: formData.name,
        password: formData.password,
        role: formData.role as any,
        region: formData.region || undefined,
        clubId: clubId,
      });
      
      toast.success("Cadastro realizado! Aguarde aprovação do administrador.");
      setShowRegisterForm(false);
      setShowLoginForm(false);
      setSelectedProfile("");
      setFormData({ name: "", password: "", region: "", clubName: "", role: "" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar");
    }
  };

  const resetForms = () => {
    setShowLoginForm(false);
    setShowRegisterForm(false);
    setSelectedProfile("");
    setFormData({ name: "", password: "", region: "", clubName: "", role: "" });
  };

  const renderAdminLogin = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Senha do Administrador
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="Digite a senha de administrador"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-semibold"
      >
        Entrar como Administrador
      </button>
    </form>
  );

  const renderLoginForm = () => (
    <div className="space-y-4">
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Digite seu nome"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Digite sua senha"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
        >
          Entrar
        </button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">Ainda não tem conta?</p>
        <button
          onClick={() => setShowRegisterForm(true)}
          className="text-blue-500 hover:text-blue-700 font-medium"
        >
          Cadastre-se aqui
        </button>
      </div>
    </div>
  );

  const renderRegisterForm = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Cadastro</h3>
        <button
          onClick={() => setShowRegisterForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Voltar para login
        </button>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Digite seu nome"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Digite sua senha"
            required
          />
        </div>

        {selectedProfile === "regional" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Região
            </label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Selecione a região</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedProfile === "director" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Selecione a função</option>
                <option value="director">Diretor</option>
                <option value="secretary">Secretário</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Região
              </label>
              <select
                value={formData.region}
                onChange={(e) => {
                  setFormData({ ...formData, region: e.target.value, clubName: "" });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Selecione a região</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {formData.region && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clube
                </label>
                <select
                  value={formData.clubName}
                  onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione o clube</option>
                  {listClubs
                    ?.filter(club => club.region === formData.region)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((club) => (
                      <option key={club._id} value={club.name}>
                        {club.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-semibold"
        >
          Cadastrar
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-200 via-orange-100 to-yellow-100 flex flex-col">
      {/* Header Mobile */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-b-3xl shadow-lg">
        <div className="text-center">
          <div className="mb-4">
            <img 
              src={aventuriLogo} 
              alt="Logo XXVII Aventuri - AP Heróis de Jesus" 
              className="w-20 h-20 mx-auto object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-lg font-bold mb-2">XXVII AVENTURI</h1>
          <p className="text-sm opacity-90">AP HERÓIS DE JESUS</p>
          <p className="text-xs opacity-75">26 a 28 de setembro de 2025 | Sumaré - SP</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto mt-4">

        {!selectedProfile ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Selecione seu perfil:</h2>
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleProfileSelect(profile.id)}
                className={`w-full p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 text-left group hover:shadow-md`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${profile.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                    {profile.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">
                      {profile.title}
                    </h3>
                    <p className="text-sm text-gray-600">{profile.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-6">
              <button
                onClick={resetForms}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ← Voltar
              </button>
              <h2 className="text-xl font-semibold text-gray-800">
                {profiles.find(p => p.id === selectedProfile)?.title}
              </h2>
            </div>

            {selectedProfile === "admin" && renderAdminLogin()}
            {selectedProfile !== "admin" && !showRegisterForm && renderLoginForm()}
            {selectedProfile !== "admin" && showRegisterForm && renderRegisterForm()}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
