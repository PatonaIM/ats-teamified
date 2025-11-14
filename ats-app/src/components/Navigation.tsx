import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Home, LogIn, LogOut, User } from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';
import { useAuth } from '../contexts/AuthContext';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, login, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      try {
        await login();
      } catch (error) {
        console.error('Login failed:', error);
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Sparkles className="w-6 h-6 text-brand-purple group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-xl font-bold bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
              Multi-Employment ATS
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                isActive('/')
                  ? 'bg-brand-purple/10 text-brand-purple'
                  : 'text-gray-600 dark:text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <User className="w-4 h-4 text-brand-purple" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name || user.email}</span>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 text-brand-purple hover:bg-brand-purple/10 rounded-lg font-medium transition-all duration-300"
                >
                  Dashboard
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleAuthAction}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <LogIn className="w-4 h-4" />
                <span>Login with Teamified</span>
              </button>
            )}
            
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
