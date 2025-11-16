import React, { useState } from 'react';
import { Home, Search, User, Menu as MenuIcon, BarChart3, Users, QrCode, Settings, X, Clock, History } from 'lucide-react';

interface MobileLayoutProps {
  user: any;
  onLogout: () => void;
  children: React.ReactNode | ((activeTab: string) => React.ReactNode);
}

export function MobileLayout({ user, onLogout, children }: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);

  // Definir abas baseadas no tipo de usuário
  const getTabsForRole = (role: string) => {
    const baseTabs = [
      {
        id: 'home',
        label: 'Início',
        icon: <Home size={24} />,
      }
    ];

    switch (role) {
      case 'admin':
        return [
          ...baseTabs,
          {
            id: 'users',
            label: 'Usuários',
            icon: <Users size={24} />,
          },
          {
            id: 'reports',
            label: 'Relatórios',
            icon: <BarChart3 size={24} />,
          },
          {
            id: 'settings',
            label: 'Config',
            icon: <Settings size={24} />,
          }
        ];
      
      case 'director':
      case 'secretary':
        return [
          ...baseTabs,
          {
            id: 'club',
            label: 'Clube',
            icon: <Users size={24} />,
          },
          {
            id: 'qrcode',
            label: 'QR Code',
            icon: <QrCode size={24} />,
          },
          {
            id: 'reports',
            label: 'Relatórios',
            icon: <BarChart3 size={24} />,
          },
          {
            id: 'profile',
            label: 'Histórico',
            icon: <History size={24} />,
          }
        ];
      
      case 'regional':
        return [
          ...baseTabs,
          {
            id: 'clubs',
            label: 'Clubes',
            icon: <Users size={24} />,
          },
          {
            id: 'reports',
            label: 'Relatórios',
            icon: <BarChart3 size={24} />,
          },
          {
            id: 'profile',
            label: 'Perfil',
            icon: <User size={24} />,
          }
        ];
      
      case 'staff':
        return [
          ...baseTabs,
          {
            id: 'qrscanner',
            label: 'QR Scanner',
            icon: <QrCode size={24} />,
          },
          {
            id: 'search',
            label: 'Buscar',
            icon: <Search size={24} />,
          },
          {
            id: 'profile',
            label: 'Perfil',
            icon: <User size={24} />,
          }
        ];
      
      default:
        return baseTabs;
    }
  };

  const tabs = getTabsForRole(user.role);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-campori-navy to-campori-darkGreen text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <button 
            className="p-2"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">
            {user.role === 'admin' ? 'Admin Panel' :
             user.role === 'director' ? 'Clube Dashboard' :
             user.role === 'regional' ? 'Regional Dashboard' :
             user.role === 'staff' ? 'Staff Panel' :
             'Sistema Aventuri'}
          </h1>
          <button 
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            onClick={onLogout}
          >
            <User className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* User Info */}
        <div className="mt-4">
          <p className="text-sm opacity-90">
            Olá, {user.name || 'Usuário'}
          </p>
          <p className="text-xs opacity-75 capitalize">
            {user.role === 'admin' ? 'Administrador' :
             user.role === 'director' ? 'Diretor' :
             user.role === 'secretary' ? 'Secretário' :
             user.role === 'regional' ? 'Regional' :
             user.role === 'staff' ? 'Staff' : user.role}
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {typeof children === 'function' ? children(activeTab) : children}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Side Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMenu(false)}>
          <div className="bg-white w-64 h-full p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Menu</h2>
              <button onClick={() => setShowMenu(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <button 
                onClick={onLogout}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}