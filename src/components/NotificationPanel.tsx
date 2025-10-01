import React, { useState, useEffect } from 'react';
import { X, Bell, Check, AlertCircle, Info, Star } from 'lucide-react';
import { useHaptic } from '../hooks/useMobileGestures';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function NotificationPanel({ isOpen, onClose, user }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { lightVibrate, mediumVibrate } = useHaptic();

  useEffect(() => {
    // Mock notifications - substitua pela API real
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Nova Pontuação',
        message: 'Você recebeu 50 pontos na atividade "Caminhada Matinal"',
        type: 'success',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        action: {
          label: 'Ver detalhes',
          onClick: () => console.log('Ver pontuação')
        }
      },
      {
        id: '2',
        title: 'Evento Próximo',
        message: 'Lembrete: Atividade recreativa em 30 minutos',
        type: 'info',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
      },
      {
        id: '3',
        title: 'Meta Atingida',
        message: 'Parabéns! Você completou 100% da meta diária',
        type: 'success',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    lightVibrate();
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    mediumVibrate();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="text-green-500" size={20} />;
      case 'warning': return <AlertCircle className="text-yellow-500" size={20} />;
      case 'error': return <AlertCircle className="text-red-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (minutes < 60) {
      return `${minutes}m atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="fixed top-0 right-0 w-full max-w-sm h-full bg-white shadow-xl transform transition-transform duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell size={20} />
              <h2 className="text-lg font-semibold">Notificações</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm opacity-75 mt-1">
            {notifications.filter(n => !n.read).length} não lidas
          </p>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-screen">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bell size={48} className="mx-auto mb-4 opacity-30" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`relative p-4 rounded-2xl shadow-sm border transition-all duration-200 ${
                  notification.read 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-white border-indigo-200 shadow-md'
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${
                        notification.read ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <p className={`text-sm mt-1 ${
                      notification.read ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {formatTime(notification.timestamp)}
                      </span>
                      
                      {notification.action && !notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            notification.action?.onClick();
                            markAsRead(notification.id);
                          }}
                          className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
                        >
                          {notification.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unread indicator */}
                {!notification.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-600 rounded-full" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={() => {
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              lightVibrate();
            }}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Marcar todas como lidas
          </button>
        </div>
      </div>
    </div>
  );
}