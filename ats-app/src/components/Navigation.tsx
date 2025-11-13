import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Briefcase, Home, LogIn } from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

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
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                isActive('/')
                  ? 'bg-brand-purple/10 text-brand-purple'
                  : 'text-gray-600 dark:text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden lg:inline">Home</span>
            </Link>
            <Link
              to="/jobs"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                isActive('/jobs')
                  ? 'bg-brand-purple/10 text-brand-purple'
                  : 'text-gray-600 dark:text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span className="hidden lg:inline">Jobs</span>
            </Link>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
            
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden md:inline">Login</span>
            </button>
            
            <div className="ml-2">
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
