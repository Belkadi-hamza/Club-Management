import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Users, 
  Trophy, 
  CreditCard, 
  Menu, 
  X, 
  LogOut,
  Building2,
  Settings,
  User,
  ChevronDown
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { club, logout } = useAuth();

  const navigation = [
    { name: 'Tableau de bord', icon: Home, page: 'dashboard' },
    { name: 'Athlètes', icon: Users, page: 'athletes' },
    { name: 'Sports', icon: Trophy, page: 'sports' },
    { name: 'Paiements', icon: CreditCard, page: 'payments' },
  ];

  const settingsNavigation = [
    { name: 'Paramètres du Club', icon: Building2, page: 'club-settings' },
    { name: 'Paramètres du Compte', icon: User, page: 'account-settings' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center">
              {club?.imageUrl ? (
                <img src={club.imageUrl} alt={club.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-blue-600" />
              )}
              <span className="ml-2 text-lg font-semibold text-gray-900 truncate">
                {club?.name || 'Club'}
              </span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onPageChange(item.page);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === item.page
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
            
            {/* Settings Section */}
            <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-3" />
                  Paramètres
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {settingsOpen && (
                <div className="mt-2 space-y-1 pl-8">
                  {settingsNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          onPageChange(item.page);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === item.page
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              )}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            {club?.imageUrl ? (
              <img src={club.imageUrl} alt={club.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-blue-600" />
            )}
            <span className="ml-2 text-lg font-semibold text-gray-900 truncate">
              {club?.name || 'Club'}
            </span>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => onPageChange(item.page)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === item.page
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
            
            {/* Settings Section */}
            <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-3" />
                  Paramètres
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {settingsOpen && (
                <div className="mt-2 space-y-1 pl-8">
                  {settingsNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => onPageChange(item.page)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === item.page
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              )}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find(item => item.page === currentPage)?.name || 
                 settingsNavigation.find(item => item.page === currentPage)?.name || 
                 'Tableau de bord'}
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center">
                {club?.imageUrl ? (
                  <img src={club.imageUrl} alt={club.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-blue-600" />
                )}
                <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                  {club?.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;