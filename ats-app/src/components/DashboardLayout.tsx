import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DarkModeToggle } from './DarkModeToggle';
import { Bell, Search, User } from 'lucide-react';
import { useState } from 'react';

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs, candidates, or anything..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition-all"
                  />
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-4 ml-6">
                <button className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                
                <DarkModeToggle />
                
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                
                <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Admin User</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">admin@company.com</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
