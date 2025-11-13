import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  BarChart3, 
  Settings, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  LogOut
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/dashboard/jobs', icon: Briefcase, label: 'Jobs' },
  { path: '/dashboard/candidates', icon: Users, label: 'Candidates' },
  { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-purple-600 to-purple-700 transition-all duration-300 z-40 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-lg text-white">
                  Multi-Employment
                </span>
                <span className="text-xs text-purple-200">ATS Platform</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      active
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                        : 'text-purple-100 hover:bg-white/10 hover:text-white'
                    }`}
                    title={collapsed ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-4">
          <button
            onClick={() => navigate('/dashboard/profile')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-purple-100 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <UserCircle className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Profile</span>}
          </button>
          
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-purple-100 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 rounded-xl text-purple-200 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
