import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Crown, Globe, Building2, UserCheck, Zap, ArrowLeft, Lock, User, Key, Sparkles, MapPin, Users, Eye, EyeOff } from "lucide-react";
import aventuriLogo from "../aventuri.png";

// Adicionar animações CSS inline
const animationStyles = `
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

// Injetar estilos
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = animationStyles;
if (!document.querySelector('style[data-profile-animations]')) {
  styleSheet.setAttribute('data-profile-animations', 'true');
  document.head.appendChild(styleSheet);
}

interface ProfileSelectionProps {
  onLogin: (user: any) => void;
}

export function ProfileSelection({ onLogin }: ProfileSelectionProps) {
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <Lock size={16} className="text-red-500" />
          Senha do Administrador
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200 bg-gray-50 focus:bg-white text-lg"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <p className="text-xs text-gray-500">Digite sua senha de acesso administrativo</p>
      </div>
      
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2"
      >
        <Crown size={20} />
        <span>Entrar como Administrador</span>
      </button>
    </form>
  );

  const renderLoginForm = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Fazer Login</h3>
        <p className="text-sm text-gray-600">Entre com suas credenciais</p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <User size={16} className="text-blue-500" />
            Nome de Usuário
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 bg-gray-50 focus:bg-white text-lg"
            placeholder="Digite seu nome"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <Key size={16} className="text-blue-500" />
            Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 bg-gray-50 focus:bg-white text-lg"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2"
        >
          <UserCheck size={20} />
          <span>Entrar</span>
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500">ou</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">Ainda não tem uma conta?</p>
        <button
          onClick={() => setShowRegisterForm(true)}
          className="w-full border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
        >
          <Sparkles size={18} className="text-purple-500" />
          <span>Criar Nova Conta</span>
        </button>
      </div>
    </div>
  );

  const renderRegisterForm = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Criar Nova Conta</h3>
        <p className="text-sm text-gray-600">Preencha os dados para se cadastrar</p>
        <button
          onClick={() => setShowRegisterForm(false)}
          className="mt-3 text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center justify-center mx-auto space-x-1"
        >
          <ArrowLeft size={14} />
          <span>Voltar para login</span>
        </button>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <User size={16} className="text-green-500" />
            Nome Completo
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white text-lg"
            placeholder="Digite seu nome completo"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <Key size={16} className="text-green-500" />
            Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white text-lg"
              placeholder="Crie uma senha segura"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {selectedProfile === "regional" && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <MapPin size={16} className="text-green-500" />
              Região
            </label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white text-lg"
              required
            >
              <option value="">Selecione sua região</option>
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
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <UserCheck size={16} className="text-green-500" />
                Função
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white text-lg"
                required
              >
                <option value="">Selecione sua função</option>
                <option value="director">Diretor</option>
                <option value="secretary">Secretário</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <MapPin size={16} className="text-green-500" />
                Região
              </label>
              <select
                value={formData.region}
                onChange={(e) => {
                  setFormData({ ...formData, region: e.target.value, clubName: "" });
                }}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white text-lg"
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
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <Users size={16} className="text-green-500" />
                  Clube
                </label>
                <select
                  value={formData.clubName}
                  onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white text-lg"
                  required
                >
                  <option value="">Selecione seu clube</option>
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
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2"
        >
          <UserCheck size={20} />
          <span>Finalizar Cadastro</span>
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex flex-col relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-8 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
        <div className="absolute bottom-32 left-6 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-12 w-20 h-20 bg-blue-400/15 rounded-full blur-lg"></div>
      </div>

      {/* Header Mobile */}
      <div className="relative z-10 text-white px-6 pt-12 pb-8">
        <div className="text-center">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-lg transform scale-110"></div>
            <img 
              src={aventuriLogo} 
              alt="Logo XXVII Aventuri - AP Heróis de Jesus" 
              className="relative w-24 h-24 mx-auto object-contain drop-shadow-xl"
            />
          </div>
          <h1 className="text-2xl font-bold mb-2 tracking-wide">XXVII AVENTURI</h1>
          <p className="text-lg opacity-90 font-medium">AP HERÓIS DE JESUS</p>
          <p className="text-sm opacity-75 mt-2">26 a 28 de setembro de 2025 | Sumaré - SP</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-8 relative z-10">
        <div className="max-w-md mx-auto">

        {!selectedProfile ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-white mb-2">Bem-vindo!</h2>
              <p className="text-white/80 text-sm">Selecione seu perfil para começar</p>
            </div>
            
            <div className="space-y-4">
              {profiles.map((profile, index) => (
                <button
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile.id)}
                  className={`w-full p-5 rounded-2xl bg-white/95 backdrop-blur-sm border border-white/20 hover:bg-white hover:scale-[1.02] transition-all duration-300 text-left group shadow-xl hover:shadow-2xl`}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: 'slideInUp 0.6s ease-out forwards'
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 ${profile.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {profile.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-gray-700 transition-colors">
                        {profile.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{profile.description}</p>
                    </div>
                    <div className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Footer Info */}
            <div className="text-center mt-8 pt-6">
              <p className="text-white/60 text-xs">
                Sistema de Pontuação Digital
              </p>
              <p className="text-white/40 text-xs mt-1">
                Desenvolvido para o XXVII Aventuri
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6">
            {/* Header da seleção */}
            <div className="flex items-center mb-8">
              <button
                onClick={resetForms}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all duration-200 mr-4 hover:scale-105"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${profiles.find(p => p.id === selectedProfile)?.color} rounded-xl flex items-center justify-center text-white`}>
                  {profiles.find(p => p.id === selectedProfile)?.icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {profiles.find(p => p.id === selectedProfile)?.title}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {profiles.find(p => p.id === selectedProfile)?.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {selectedProfile === "admin" && renderAdminLogin()}
              {selectedProfile !== "admin" && !showRegisterForm && renderLoginForm()}
              {selectedProfile !== "admin" && showRegisterForm && renderRegisterForm()}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
