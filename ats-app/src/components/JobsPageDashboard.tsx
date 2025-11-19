import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Briefcase, MapPin, DollarSign, Users, Calendar, CheckCircle, Clock, XCircle, Pause, AlertCircle } from 'lucide-react';
import JobForm from './JobForm';
import ConfirmationModal from './ConfirmationModal';
import { getEmploymentTypeColors, getEmploymentTypeLabel } from '../utils/employmentTypes';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

interface Job {
  id: string;
  title: string;
  employment_type: string;
  status: string;
  company_name: string;
  location: string;
  remote_ok: boolean;
  salary_min: number | null;
  salary_max: number | null;
  salary_display?: string;
  created_at: string;
  candidate_count: number;
  active_candidates: number;
  recruiter_name: string;
  linkedin_synced: boolean;
  created_by_role?: string;
  approval_id?: number;
  approval_status?: string;
  sla_deadline?: string;
  approval_priority?: string;
}


const statusIcons = {
  draft: <Clock className="w-4 h-4 text-orange-500" />,
  active: <CheckCircle className="w-4 h-4 text-green-500" />,
  paused: <Pause className="w-4 h-4 text-yellow-500" />,
  filled: <CheckCircle className="w-4 h-4 text-blue-500" />,
  closed: <XCircle className="w-4 h-4 text-red-500" />
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  filled: 'Filled',
  closed: 'Closed'
};

// Normalize backend status to frontend status
const normalizeStatus = (status: string): string => {
  if (status === 'published') return 'active';
  return status;
};

// Denormalize frontend status filter to backend status
const denormalizeStatus = (status: string): string => {
  if (status === 'active') return 'published';
  return status;
};

export function JobsPageDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishingJobId, setPublishingJobId] = useState<string | null>(null);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'success' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    onConfirm: () => {}
  });
  
  // Check for action=create in URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    
    if (action === 'create') {
      setIsCreateModalOpen(true);
      // Remove the query param from URL
      navigate('/dashboard/jobs', { replace: true });
    }
  }, [location.search, navigate]);
  
  // Check if user is a client
  const isClient = user?.role === 'client_admin' || user?.role === 'client_hr';
  
  // Filter draft jobs for clients
  const draftJobs = isClient ? jobs.filter(job => job.status === 'draft') : [];

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (employmentTypeFilter !== 'all') params.append('employmentType', employmentTypeFilter);
      if (statusFilter !== 'all') params.append('status', denormalizeStatus(statusFilter));
      if (searchTerm) params.append('search', searchTerm);

      const endpoint = `/api/jobs?${params}`;
      console.log('Fetching jobs from:', endpoint);
      
      const data = await apiRequest<{ jobs: Job[] }>(endpoint);
      console.log('Jobs received:', data.jobs?.length || 0);
      console.log('First job:', data.jobs?.[0]);
      
      // Normalize status from backend (published → active)
      const normalizedJobs = (data.jobs || []).map(job => ({
        ...job,
        status: normalizeStatus(job.status)
      }));
      
      setJobs(normalizedJobs);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch jobs';
      console.error('Fetch error:', message, err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [employmentTypeFilter, statusFilter, searchTerm]);

  useEffect(() => {
    console.log('useEffect triggered, calling fetchJobs');
    fetchJobs().catch(err => console.error('fetchJobs failed:', err));
  }, [fetchJobs]);

  const formatSalary = (min: number | null, max: number | null, display?: string) => {
    if (display && display !== ' ') return display.trim();
    if (!min || !max) return 'Negotiable';
    return `$${(min / 1000).toFixed(0)}k-$${(max / 1000).toFixed(0)}k`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleCreateJob = async (formData: any) => {
    try {
      setIsSubmitting(true);
      const newJob = await apiRequest<Job>('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setJobs(prev => [newJob, ...prev]);
      setIsCreateModalOpen(false);
      await fetchJobs();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create job';
      console.error('Create job error:', message);
      alert('Error: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishJob = async (jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    setConfirmModal({
      isOpen: true,
      title: 'Publish Job',
      message: 'Are you sure you want to publish this job? It will become visible to candidates immediately.',
      confirmText: 'Publish',
      variant: 'success',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });

        try {
          setPublishingJobId(jobId);
          console.log('[UI] Publishing job:', jobId);

          const response = await apiRequest<{ success: boolean; job: Job }>(`/api/jobs/${jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_status: 'published' })
          });

          console.log('[UI] Publish response:', response);

          if (response.success) {
            setJobs(prev => prev.map(job => 
              job.id === jobId 
                ? { ...response.job, status: normalizeStatus(response.job.status) }
                : job
            ));
            
            alert('✅ Job published successfully!');
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to publish job';
          console.error('[UI] Publish error:', message);
          
          if (message.includes('403') || message.includes('approval')) {
            alert('⚠️ This job requires approval before publishing. Please use the approval workflow.');
          } else {
            alert('❌ Error: ' + message);
          }
        } finally {
          setPublishingJobId(null);
        }
      }
    });
  };

  const handleStatusChange = async (jobId: string, newStatus: string, confirmMessage: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Determine the variant and title based on the status
    const getModalConfig = () => {
      switch (newStatus) {
        case 'paused':
          return { title: 'Pause Job', variant: 'warning' as const, confirmText: 'Pause' };
        case 'published':
          return { title: 'Resume Job', variant: 'success' as const, confirmText: 'Resume' };
        case 'filled':
          return { title: 'Mark as Filled', variant: 'success' as const, confirmText: 'Mark Filled' };
        case 'closed':
          return { title: 'Close Job', variant: 'danger' as const, confirmText: 'Close' };
        default:
          return { title: 'Confirm Action', variant: 'primary' as const, confirmText: 'Confirm' };
      }
    };

    const config = getModalConfig();
    
    setConfirmModal({
      isOpen: true,
      title: config.title,
      message: confirmMessage,
      confirmText: config.confirmText,
      variant: config.variant,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });

        try {
          setPublishingJobId(jobId);
          console.log('[UI] Changing job status to:', newStatus);

          const response = await apiRequest<{ success: boolean; job: Job }>(`/api/jobs/${jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_status: newStatus })
          });

          console.log('[UI] Status change response:', response);

          if (response.success) {
            setJobs(prev => prev.map(job => 
              job.id === jobId 
                ? { ...response.job, status: normalizeStatus(response.job.status) }
                : job
            ));
            
            const statusMessages: Record<string, string> = {
              paused: '⏸️ Job paused successfully!',
              published: '▶️ Job resumed successfully!',
              filled: '✅ Job marked as filled!',
              closed: '🔒 Job closed successfully!'
            };
            
            alert(statusMessages[newStatus] || '✅ Job status updated!');
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to update job status';
          console.error('[UI] Status change error:', message);
          alert('❌ Error: ' + message);
        } finally {
          setPublishingJobId(null);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Jobs</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all your job postings</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Create Job
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={employmentTypeFilter}
              onChange={(e) => setEmploymentTypeFilter(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-purple/50 transition-all"
            >
              <option value="all">All Types</option>
              <option value="fullTime">Full-Time</option>
              <option value="partTime">Part-Time</option>
              <option value="contract">Contract</option>
              <option value="eor">EOR</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-purple/50 transition-all"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft (Awaiting Approval)</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="filled">Filled</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {(employmentTypeFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active Filters:</span>
            {employmentTypeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-purple/10 text-brand-purple text-sm">
                {getEmploymentTypeLabel(employmentTypeFilter)}
                <button onClick={() => setEmploymentTypeFilter('all')} className="hover:text-brand-purple/70">×</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-sm capitalize">
                {statusFilter}
                <button onClick={() => setStatusFilter('all')} className="hover:text-brand-blue/70">×</button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 text-sm">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-purple-700/70">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setEmploymentTypeFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand-purple transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Draft Jobs Alert for Clients */}
      {isClient && draftJobs.length > 0 && statusFilter !== 'draft' && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                You have {draftJobs.length} draft job{draftJobs.length > 1 ? 's' : ''} awaiting approval
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                These jobs require manager approval before going live
              </p>
              <button
                onClick={() => setStatusFilter('draft')}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                View Draft Jobs ({draftJobs.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing <span className="font-semibold text-gray-900 dark:text-white">{jobs.length}</span> jobs
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-purple border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-red-500 text-lg mb-4">⚠️ {error}</p>
          <button
            onClick={fetchJobs}
            className="px-6 py-3 bg-brand-purple text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No jobs found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, index) => {
            const typeColors = getEmploymentTypeColors(job.employment_type);
            const typeLabel = getEmploymentTypeLabel(job.employment_type);
            
            return (
              <div
                key={job.id}
                className={`group bg-white dark:bg-gray-800 rounded-xl border p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-slide-up ${
                  job.status === 'draft' 
                    ? 'border-orange-300 dark:border-orange-600 bg-orange-50/30 dark:bg-orange-900/10' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-brand-purple/50 dark:hover:border-brand-purple/50'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-purple transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border ${typeColors.bg} ${typeColors.border} ${typeColors.text}`}>
                          {typeLabel}
                        </span>
                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold ${
                          job.status === 'draft' 
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-600' 
                            : job.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300'
                            : job.status === 'paused'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300'
                            : job.status === 'filled'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300'
                        }`}>
                          {statusIcons[job.status as keyof typeof statusIcons]}
                          <span className="capitalize">{statusLabels[job.status as keyof typeof statusLabels] || job.status}</span>
                        </span>
                        {job.linkedin_synced && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            LinkedIn
                          </span>
                        )}
                        {job.approval_status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-600">
                            <Clock className="w-4 h-4" />
                            Pending Approval
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        {job.company_name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {job.location} {job.remote_ok && '(Remote OK)'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Posted: {formatDate(job.created_at)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="font-semibold">{formatSalary(job.salary_min, job.salary_max, job.salary_display)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <Users className="w-4 h-4 text-brand-purple" />
                        Candidates: <span className="font-semibold">{job.candidate_count}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <Clock className="w-4 h-4 text-brand-blue" />
                        Active: <span className="font-semibold">{job.active_candidates}</span>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Recruiter: {job.recruiter_name}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Pipeline Progress</span>
                        <span className="font-medium">
                          {job.active_candidates}/{job.candidate_count} active
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-purple to-brand-blue rounded-full transition-all duration-500"
                          style={{
                            width: `${job.candidate_count > 0 ? (job.active_candidates / job.candidate_count) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Publish button for draft recruiter jobs */}
                    {job.status === 'draft' && job.created_by_role === 'recruiter' && (
                      <button 
                        onClick={(e) => handlePublishJob(job.id, e)}
                        disabled={publishingJobId === job.id}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publishingJobId === job.id ? 'Processing...' : '✓ Publish'}
                      </button>
                    )}

                    {/* Pause/Resume button for active/paused jobs */}
                    {job.status === 'active' && (
                      <button 
                        onClick={(e) => handleStatusChange(job.id, 'paused', 'Pause this job? It will be hidden from candidates.', e)}
                        disabled={publishingJobId === job.id}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publishingJobId === job.id ? 'Processing...' : '⏸ Pause'}
                      </button>
                    )}

                    {job.status === 'paused' && (
                      <button 
                        onClick={(e) => handleStatusChange(job.id, 'published', 'Resume this job? It will become visible to candidates again.', e)}
                        disabled={publishingJobId === job.id}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publishingJobId === job.id ? 'Processing...' : '▶ Resume'}
                      </button>
                    )}

                    {/* Mark as Filled button for active/paused jobs */}
                    {(job.status === 'active' || job.status === 'paused') && (
                      <button 
                        onClick={(e) => handleStatusChange(job.id, 'filled', 'Mark this job as filled? This indicates you have found a candidate.', e)}
                        disabled={publishingJobId === job.id}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publishingJobId === job.id ? 'Processing...' : '✓ Mark Filled'}
                      </button>
                    )}

                    {/* Close button for active/paused jobs */}
                    {(job.status === 'active' || job.status === 'paused') && (
                      <button 
                        onClick={(e) => handleStatusChange(job.id, 'closed', 'Close this job permanently? This cannot be undone.', e)}
                        disabled={publishingJobId === job.id}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publishingJobId === job.id ? 'Processing...' : '🔒 Close'}
                      </button>
                    )}

                    {/* Always show View Details button */}
                    <button 
                      onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                      className="px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-lg text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <JobForm 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateJob}
        isSubmitting={isSubmitting}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
