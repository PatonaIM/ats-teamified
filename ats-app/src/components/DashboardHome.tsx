import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, CheckCircle, Clock, AlertCircle, ArrowUp } from 'lucide-react';
import { getEmploymentTypeConfig } from '../utils/employmentTypes';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  draftJobs: number;
  pendingApprovals: number;
  overdueApprovals: number;
  recentJobs: Array<{
    id: string;
    title: string;
    employment_type: string;
    status: string;
    city: string;
    country: string;
    candidate_count: number;
  }>;
}

export function DashboardHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[DashboardHome] Component mounted, fetching stats...');
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('[DashboardHome] Starting fetch...');
      setLoading(true);
      
      // Fetch jobs and approvals using direct backend URL (bypasses Vite proxy issues)
      console.log('[DashboardHome] Fetching jobs from http://localhost:3001/api/jobs');
      const jobsRes = await fetch('http://localhost:3001/api/jobs');
      console.log('[DashboardHome] Jobs response received');
      const jobsData = await jobsRes.json();
      console.log('[DashboardHome] Jobs data parsed');
      
      console.log('[DashboardHome] Fetching approvals from http://localhost:3001/api/approvals');
      const approvalsRes = await fetch('http://localhost:3001/api/approvals?status=pending');
      console.log('[DashboardHome] Approvals response received');
      const approvals = await approvalsRes.json();
      console.log('[DashboardHome] Approvals data parsed');
      
      console.log('[DashboardHome] Received data:', { jobsCount: jobsData.jobs?.length, approvalsCount: approvals.length });
      
      // Extract jobs array from response object
      const jobs = jobsData.jobs || [];
      
      // Calculate stats from jobs data
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter((j: any) => j.status === 'published').length;
      const draftJobs = jobs.filter((j: any) => j.status === 'draft').length;
      const pendingApprovals = approvals.length;
      
      // Get recent jobs (last 5)
      const recentJobs = jobs
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((job: any) => ({
          id: job.id,
          title: job.title,
          employment_type: job.employment_type,
          status: job.status,
          city: job.location?.split(',')[0] || job.city || 'Unknown',
          country: job.location?.split(',')[1]?.trim() || job.country || 'Unknown',
          candidate_count: job.candidate_count || 0
        }));
      
      const overdueApprovals = approvals.filter((a: any) => {
        const createdAt = new Date(a.created_at);
        const hoursSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceCreated > 24; // Consider overdue after 24 hours
      }).length;
      
      console.log('[DashboardHome] Setting stats:', { totalJobs, activeJobs, draftJobs, pendingApprovals });
      setStats({
        totalJobs,
        activeJobs,
        draftJobs,
        pendingApprovals,
        overdueApprovals,
        recentJobs
      });
    } catch (error) {
      console.error('[DashboardHome] Error fetching dashboard stats:', error);
      // Set empty stats to avoid infinite loading
      setStats({
        totalJobs: 0,
        activeJobs: 0,
        draftJobs: 0,
        pendingApprovals: 0,
        overdueApprovals: 0,
        recentJobs: []
      });
    } finally {
      console.log('[DashboardHome] Fetch complete, setting loading=false');
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Jobs',
      value: stats.totalJobs.toString(),
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
      link: '/dashboard/jobs'
    },
    {
      label: 'Active Jobs',
      value: stats.activeJobs.toString(),
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      link: '/dashboard/jobs'
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals.toString(),
      icon: stats.overdueApprovals > 0 ? AlertCircle : Clock,
      color: stats.overdueApprovals > 0 ? 'from-red-500 to-red-600' : 'from-orange-500 to-orange-600',
      link: '/dashboard/approvals',
      badge: stats.overdueApprovals > 0 ? `${stats.overdueApprovals} overdue` : null
    },
    {
      label: 'Draft Jobs',
      value: stats.draftJobs.toString(),
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
      link: '/dashboard/jobs'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, Admin! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your hiring process today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              onClick={() => navigate(stat.link)}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                {stat.badge && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    {stat.badge}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-purple-600 transition-colors">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Jobs & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Jobs */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Jobs</h2>
            <button
              onClick={() => navigate('/dashboard/jobs')}
              className="text-sm text-purple-600 hover:text-blue-500 transition-colors font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {stats.recentJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No jobs yet. Create your first job posting!</p>
              </div>
            ) : (
              stats.recentJobs.map((job, index) => {
                const employmentConfig = getEmploymentTypeConfig(job.employment_type);
                const statusColor = job.status === 'published' ? 'text-green-600' : 'text-orange-600';
                
                return (
                  <div
                    key={job.id}
                    onClick={() => navigate('/dashboard/jobs')}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer group border border-transparent hover:border-purple-200"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.candidate_count} candidates
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${employmentConfig ? `${employmentConfig.colors.bg} ${employmentConfig.colors.text}` : 'bg-gray-100 text-gray-700'}`}>
                          {employmentConfig?.label || job.employment_type}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>{job.city}, {job.country}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${statusColor}`}>
                        {job.status === 'published' ? 'Active' : 'Draft'}
                      </span>
                      {job.status === 'published' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard/jobs')}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Briefcase className="w-5 h-5" />
              <span className="font-semibold">Post New Job</span>
            </button>
            
            {stats.pendingApprovals > 0 && (
              <button
                onClick={() => navigate('/dashboard/approvals')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Review Approvals</span>
                </div>
                <span className="bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 text-xs font-bold px-2 py-1 rounded-full">
                  {stats.pendingApprovals}
                </span>
              </button>
            )}
            
            <button
              onClick={() => navigate('/dashboard/candidates')}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <Users className="w-5 h-5" />
              <span className="font-semibold">View Candidates</span>
            </button>
            
            <button
              onClick={() => navigate('/dashboard/analytics')}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <ArrowUp className="w-5 h-5" />
              <span className="font-semibold">View Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
