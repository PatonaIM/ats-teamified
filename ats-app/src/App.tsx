import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { JobsPage } from './components/JobsPage';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardHome } from './components/DashboardHome';
import { JobsPageDashboard } from './components/JobsPageDashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<><Navigation /><LandingPage /></>} />
        <Route path="/jobs" element={<><Navigation /><JobsPage /></>} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="jobs" element={<JobsPageDashboard />} />
          <Route path="candidates" element={<div className="text-center py-20"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Candidates Page</h2><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
          <Route path="analytics" element={<div className="text-center py-20"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Page</h2><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
          <Route path="settings" element={<div className="text-center py-20"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings Page</h2><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
