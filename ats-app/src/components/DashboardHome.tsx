import { Users, Briefcase, CheckCircle, Clock, Target, ArrowUp, ArrowDown } from 'lucide-react';

export function DashboardHome() {
  const stats = [
    {
      label: 'Total Jobs',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Active Candidates',
      value: '156',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      label: 'Interviews Scheduled',
      value: '32',
      change: '+24%',
      trend: 'up',
      icon: Clock,
      color: 'from-orange-500 to-orange-600'
    },
    {
      label: 'Positions Filled',
      value: '18',
      change: '-5%',
      trend: 'down',
      icon: CheckCircle,
      color: 'from-green-500 to-green-600'
    }
  ];

  const recentJobs = [
    { id: 1, title: 'Senior Full-Stack Developer', candidates: 12, status: 'Active', type: 'Full-Time' },
    { id: 2, title: 'DevOps Engineer', candidates: 8, status: 'Active', type: 'Contract' },
    { id: 3, title: 'UX/UI Designer', candidates: 15, status: 'Active', type: 'Part-Time' },
    { id: 4, title: 'Data Analyst (EOR)', candidates: 10, status: 'Active', type: 'EOR' },
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
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
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
            <a href="/dashboard/jobs" className="text-sm text-brand-purple hover:text-brand-blue transition-colors font-medium">
              View All →
            </a>
          </div>
          <div className="space-y-4">
            {recentJobs.map((job, index) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-purple transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {job.candidates} candidates
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                      {job.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">{job.status}</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md">
              <Briefcase className="w-5 h-5" />
              <span className="font-semibold">Post New Job</span>
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
              <Users className="w-5 h-5" />
              <span className="font-semibold">Add Candidate</span>
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
              <Target className="w-5 h-5" />
              <span className="font-semibold">View Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
