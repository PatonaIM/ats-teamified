import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Briefcase, Home } from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';

export function Navigation() {
  const location = useLocation();

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
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isActive('/')
                  ? 'bg-brand-purple/10 text-brand-purple'
                  : 'text-gray-600 dark:text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              to="/jobs"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isActive('/jobs')
                  ? 'bg-brand-purple/10 text-brand-purple'
                  : 'text-gray-600 dark:text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Jobs
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
