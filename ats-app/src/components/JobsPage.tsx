import { useState, useEffect } from 'react';
import { Search, Plus, Briefcase, MapPin, DollarSign, Users, Calendar, CheckCircle, Clock, XCircle, Pause } from 'lucide-react';

interface Job {
  id: number;
  title: string;
  employment_type: string;
  status: string;
  company_name: string;
  location: string;
  remote_ok: boolean;
  salary_min: number;
  salary_max: number;
  created_at: string;
  candidate_count: number;
  active_candidates: number;
  recruiter_name: string;
  linkedin_synced: boolean;
}

const employmentTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  contract: { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  partTime: { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-500', text: 'text-green-700 dark:text-green-300' },
  fullTime: { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-500', text: 'text-orange-700 dark:text-orange-300' },
  eor: { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300' },
  default: { bg: 'bg-gray-100 dark:bg-gray-900/30', border: 'border-gray-500', text: 'text-gray-700 dark:text-gray-300' }
};

const employmentTypeLabels: Record<string, string> = {
  contract: 'Contract',
  partTime: 'Part-Time',
  fullTime: 'Full-Time',
  eor: 'EOR'
};

const statusIcons = {
  active: <CheckCircle className="w-4 h-4 text-green-500" />,
  paused: <Pause className="w-4 h-4 text-yellow-500" />,
  filled: <CheckCircle className="w-4 h-4 text-blue-500" />,
  closed: <XCircle className="w-4 h-4 text-red-500" />
};

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, [employmentTypeFilter, statusFilter, searchTerm]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (employmentTypeFilter !== 'all') params.append('employmentType', employmentTypeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/jobs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      
      const data = await response.json();
      setJobs(data.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min: number, max: number) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="w-7 h-7 text-brand-purple" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
                Jobs
              </h1>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Plus className="w-5 h-5" />
              Create Job
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition-all"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={employmentTypeFilter}
                onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-purple/50 transition-all"
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
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-purple/50 transition-all"
              >
                <option value="all">All Status</option>
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
                  {employmentTypeLabels[employmentTypeFilter as keyof typeof employmentTypeLabels]}
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

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{jobs.length}</span> jobs
          </p>
        </div>

        {/* Job Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-purple border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 text-lg mb-4">⚠️ {error}</p>
            <button
              onClick={fetchJobs}
              className="px-6 py-3 bg-brand-purple text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No jobs found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job, index) => {
              const typeColors = employmentTypeColors[job.employment_type] || employmentTypeColors.default;
              const typeLabel = employmentTypeLabels[job.employment_type] || job.employment_type;
              
              return (
                <div
                  key={job.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:border-brand-purple/50 dark:hover:border-brand-purple/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-purple transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border ${typeColors.bg} ${typeColors.border} ${typeColors.text}`}>
                            {typeLabel}
                          </span>
                          {statusIcons[job.status as keyof typeof statusIcons]}
                          {job.linkedin_synced && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              LinkedIn
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
                          <span className="font-semibold">{formatSalary(job.salary_min, job.salary_max)}</span>
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

                      {/* Pipeline Progress */}
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

                    <button className="px-5 py-2.5 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-lg whitespace-nowrap">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
