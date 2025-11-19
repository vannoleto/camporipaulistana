import { useState } from "react";
import { Toaster } from "sonner";
import { ProfileSelection } from "./components/ProfileSelection";
import AdminDashboard from "./components/AdminDashboard";
import { DirectorDashboard } from "./components/DirectorDashboard";
import { RegionalDashboard } from "./components/RegionalDashboard";
import { MDADashboard } from "./components/MDADashboard";
import { StaffDashboard } from "./components/StaffDashboard";
import { MobileLayout } from "./components/MobileLayout";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

function App() {
  const [user, setUser] = useState<any>(null);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <>
        <ProfileSelection onLogin={handleLogin} />
        <Toaster position="top-right" />
      </>
    );
  }

  // Renderizar dashboard baseado no role do usuário
  const renderDashboard = () => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard user={user} onLogout={handleLogout} />;
      case "mda":
        return <MDADashboard user={user} onLogout={handleLogout} />;
      case "director":
      case "secretary":
        return <DirectorDashboard user={user} onLogout={handleLogout} />;
      case "regional":
        return <RegionalDashboard user={user} onLogout={handleLogout} />;
      case "staff":
        return <StaffDashboard user={user} onLogout={handleLogout} />;
      default:
        return <div className="p-4 text-center">Tipo de usuário não reconhecido</div>;
    }
  };

  return (
    <>
      {renderDashboard()}
      <PWAInstallPrompt />
      <Toaster position="top-right" />
    </>
  );
}

export default App;
