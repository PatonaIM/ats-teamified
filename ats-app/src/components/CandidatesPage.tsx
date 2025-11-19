import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Mail, Phone, Calendar, ExternalLink, ChevronRight } from 'lucide-react';
import { apiRequest } from '../utils/api';

interface Candidate {
  id: string;
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  current_stage: string;
  source: string;
  status: string;
  created_at: string;
  resume_url?: string;
  job_title?: string;
  job_employment_type?: string;
}

interface Job {
  id: string;
  title: string;
  employment_type: string;
  status: string;
  company_name: string;
  candidate_count: number;
}

const sourceColors: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-800',
  direct: 'bg-green-100 text-green-800',
  referral: 'bg-purple-100 text-purple-800',
  portal: 'bg-orange-100 text-orange-800'
};

const stageColors: Record<string, string> = {
  'Screening': 'bg-yellow-100 text-yellow-800',
  'Shortlist': 'bg-blue-100 text-blue-800',
  'Client Endorsement': 'bg-purple-100 text-purple-800',
  'Ai Interview': 'bg-indigo-100 text-indigo-800',
  'AI Interview': 'bg-indigo-100 text-indigo-800',
  'Human Interview': 'bg-pink-100 text-pink-800',
  'Offer': 'bg-green-100 text-green-800',
  'Offer Accepted': 'bg-emerald-100 text-emerald-800'
};

export default function CandidatesPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch jobs
      const jobsData = await apiRequest<{ jobs: Job[] }>('/api/jobs');
      setJobs(jobsData.jobs || []);
      
      // Fetch all candidates
      const candidatesData = await apiRequest<{ candidates: Candidate[] }>('/api/candidates');
      
      // Enrich candidates with job info
      const enrichedCandidates = (candidatesData.candidates || []).map((candidate: Candidate) => {
        const job = jobsData.jobs?.find((j: Job) => j.id === candidate.job_id);
        return {
          ...candidate,
          job_title: job?.title || 'Unknown Job',
          job_employment_type: job?.employment_type || ''
        };
      });
      
      setCandidates(enrichedCandidates);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      (candidate.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.job_title || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJob = selectedJob === 'all' || candidate.job_id === selectedJob;
    const matchesStage = selectedStage === 'all' || candidate.current_stage === selectedStage;
    
    return matchesSearch && matchesJob && matchesStage;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const allStages = Array.from(new Set(candidates.map(c => c.current_stage))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-600" />
          Candidates
        </h1>
        <p className="text-gray-600 mt-2">View and manage all candidates across jobs</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Job Filter */}
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Jobs</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.title} ({job.candidate_count || 0})
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Stages</option>
            {allStages.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>

          {/* Stats */}
          <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span className="font-medium">{filteredCandidates.length}</span>
            <span>candidates</span>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {candidate.first_name[0]}{candidate.last_name[0]}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.first_name} {candidate.last_name}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                            candidate.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {candidate.status}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${candidate.email}`} className="hover:text-purple-600">
                          {candidate.email}
                        </a>
                      </div>
                      {candidate.phone && (
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {candidate.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {candidate.job_title}
                      </div>
                      {candidate.job_employment_type && (
                        <div className="text-xs text-gray-500 capitalize">
                          {candidate.job_employment_type.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        stageColors[candidate.current_stage] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {candidate.current_stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        sourceColors[candidate.source] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {candidate.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(candidate.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {candidate.resume_url && (
                          <a
                            href={candidate.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800"
                            title="View Resume"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => navigate(`/dashboard/jobs/${candidate.job_id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Job"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold">{candidates.length}</div>
          <div className="text-sm opacity-90">Total Candidates</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold">
            {candidates.filter(c => c.status === 'active').length}
          </div>
          <div className="text-sm opacity-90">Active</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold">{jobs.length}</div>
          <div className="text-sm opacity-90">Total Jobs</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold">
            {allStages.length}
          </div>
          <div className="text-sm opacity-90">Pipeline Stages</div>
        </div>
      </div>
    </div>
  );
}
