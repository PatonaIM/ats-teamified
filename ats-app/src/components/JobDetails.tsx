import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Users, Calendar, Building, FileText } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { getEmploymentTypeColors, getEmploymentTypeLabel } from '../utils/employmentTypes';

interface JobDetails {
  id: string;
  title: string;
  employment_type: string;
  job_status: string;
  department: string;
  location: string;
  remote_flag: boolean;
  salary_from: number | null;
  salary_to: number | null;
  description: string;
  requirements: string;
  created_at: string;
  candidate_count?: number;
}

export default function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        console.log('[JobDetails] Fetching job:', jobId);
        setLoading(true);
        const data = await apiRequest(`/api/jobs/${jobId}`);
        console.log('[JobDetails] Received job data:', data);
        setJob(data);
        setError(null);
      } catch (err: any) {
        console.error('[JobDetails] Error fetching job details:', err);
        setError(err.message || 'Failed to load job details');
      } finally {
        console.log('[JobDetails] Setting loading to false');
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  console.log('[JobDetails] Render state:', { loading, hasJob: !!job, hasError: !!error });

  if (loading) {
    console.log('[JobDetails] Rendering loading state');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    console.log('[JobDetails] Rendering error state');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Job not found'}</p>
          <button
            onClick={() => navigate('/dashboard/jobs')}
            className="mt-4 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  console.log('[JobDetails] Rendering job details for:', job.title);

  const employmentColors = getEmploymentTypeColors(job.employment_type);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/dashboard/jobs')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-brand-purple dark:hover:text-brand-purple mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Jobs
        </button>

        {/* Job Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {job.title}
              </h1>
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>{job.department || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                  {job.remote_flag && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                      Remote OK
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg font-semibold ${employmentColors.bg} ${employmentColors.text}`}>
              {getEmploymentTypeLabel(job.employment_type)}
            </div>
          </div>

          {/* Job Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {job.salary_from && job.salary_to && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <DollarSign className="w-5 h-5 text-brand-purple" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Salary Range</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${job.salary_from.toLocaleString()} - ${job.salary_to.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Users className="w-5 h-5 text-brand-purple" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Candidates</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {job.candidate_count || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Calendar className="w-5 h-5 text-brand-purple" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Posted</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(job.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-brand-purple" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Description</h2>
          </div>
          <div 
            className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: job.description || '<p>No description provided.</p>' }}
          />
        </div>

        {/* Job Requirements */}
        {job.requirements && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-brand-purple" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Requirements</h2>
            </div>
            <div 
              className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: job.requirements }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
