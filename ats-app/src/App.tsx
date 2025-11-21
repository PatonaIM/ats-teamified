import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { JobsPage } from './components/JobsPage';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { WorkflowBuilderList } from './components/WorkflowBuilderList';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardHome } from './components/DashboardHome';
import { JobsPageDashboard } from './components/JobsPageDashboard';
import JobDetailsKanban from './components/JobDetailsKanban';
import CandidatesPage from './components/CandidatesPage';
import ApprovalsPage from './components/ApprovalsPage';
import { AuthCallback } from './components/AuthCallback';
import { CandidateBookingPage } from './components/interview-scheduling';
import { InterviewAvailability } from './components/InterviewAvailability';
import { CandidateSlotSelection } from './components/CandidateSlotSelection';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<><Navigation /><LandingPage /></>} />
          <Route path="/jobs" element={<><Navigation /><JobsPage /></>} />
          
          {/* Interview Booking Route (Public) */}
          <Route path="/book-interview/:candidateId/:jobId" element={<CandidateBookingPage />} />
          
          {/* Candidate Slot Selection (Public) */}
          <Route path="/candidate/select-slot/:token" element={<CandidateSlotSelection />} />
          
          {/* Workflow Builder Route */}
          <Route path="/jobs/:jobId/workflow-builder" element={<WorkflowBuilder />} />
          
          {/* OAuth Callback Route */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="jobs" element={<JobsPageDashboard />} />
            <Route path="jobs/:jobId" element={<JobDetailsKanban />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="interview-availability" element={<InterviewAvailability />} />
            <Route path="workflow-builder" element={<WorkflowBuilderList />} />
            <Route path="pipeline-templates" element={<WorkflowBuilderList />} />
            <Route path="pipeline-templates/:templateId/edit" element={<WorkflowBuilder />} />
            <Route path="candidates" element={<CandidatesPage />} />
            <Route path="analytics" element={<div className="text-center py-20"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Page</h2><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
            <Route path="settings" element={<div className="text-center py-20"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings Page</h2><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
