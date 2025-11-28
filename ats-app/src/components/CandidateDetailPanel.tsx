import { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  Clock,
  FileText,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Download,
  User,
  TrendingUp,
  Brain,
  Video,
  CheckCircle2,
  AlertCircle,
  Loader2,
  History,
  Award,
  Target,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '../utils/api';

interface CandidateDocument {
  id: string;
  document_type: string;
  file_name: string;
  blob_url: string;
  file_size: number;
  uploaded_at: string;
}

interface CandidateCommunication {
  id: string;
  communication_type: string;
  subject: string;
  content: string;
  sent_at: string;
}

interface StageHistoryEntry {
  id: string;
  previous_stage: string | null;
  new_stage: string;
  changed_by_user_id: string | null;
  notes: string | null;
  changed_at: string;
}

interface CandidateDetail {
  id: string;
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  current_stage: string;
  candidate_substage: string | null;
  source: string;
  status: string;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
  job_title: string;
  employment_type: string;
  company_name: string;
  city: string;
  country: string;
  ai_interview_score: number | null;
  ai_sentiment_score: number | null;
  ai_confidence_score: number | null;
  ai_analysis_status: string | null;
  ai_analysis_report: any;
  ai_interview_completed_at: string | null;
  ai_interview_duration_seconds: number | null;
  ai_interview_questions_total: number | null;
  ai_interview_questions_answered: number | null;
  interviewer_name: string | null;
  interviewer_email: string | null;
  interview_scheduled_at: string | null;
  interview_completed_at: string | null;
  interview_feedback: string | null;
  interview_duration_minutes: number | null;
  meeting_platform: string | null;
  meeting_link: string | null;
  documents: CandidateDocument[];
  communications: CandidateCommunication[];
  stageHistory: StageHistoryEntry[];
}

interface CandidateDetailPanelProps {
  candidateId: string | null;
  onClose: () => void;
  onStageChange?: () => void;
}

const stageColors: Record<string, { bg: string; text: string; border: string }> = {
  'Screening': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'Shortlist': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Client Endorsement': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'AI Interview': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Human Interview': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'Offer': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'Offer Accepted': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
};

const sourceColors: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-800',
  direct: 'bg-green-100 text-green-800',
  referral: 'bg-purple-100 text-purple-800',
  portal: 'bg-orange-100 text-orange-800'
};

export default function CandidateDetailPanel({ candidateId, onClose }: CandidateDetailPanelProps) {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-interview' | 'documents' | 'history'>('overview');
  const [resumeExpanded, setResumeExpanded] = useState(false);

  useEffect(() => {
    if (candidateId) {
      fetchCandidateDetails();
    }
  }, [candidateId]);

  const fetchCandidateDetails = async () => {
    if (!candidateId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiRequest<{ candidate: CandidateDetail }>(`/api/candidates/${candidateId}`);
      setCandidate(data.candidate);
    } catch (err) {
      console.error('Error fetching candidate details:', err);
      setError('Failed to load candidate details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (!candidateId) return null;

  const stageStyle = stageColors[candidate?.current_stage || ''] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={fetchCandidateDetails}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        ) : candidate ? (
          <>
            <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="relative flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                  {candidate.first_name[0]}{candidate.last_name[0]}
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">
                    {candidate.first_name} {candidate.last_name}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      candidate.status === 'active' 
                        ? 'bg-green-400/30 text-green-100' 
                        : candidate.status === 'disqualified'
                        ? 'bg-red-400/30 text-red-100'
                        : 'bg-gray-400/30 text-gray-100'
                    }`}>
                      {candidate.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20`}>
                      {candidate.current_stage}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${sourceColors[candidate.source] || 'bg-gray-100 text-gray-800'}`}>
                      {candidate.source}
                    </span>
                  </div>
                  
                  <div className="mt-3 text-sm text-white/80">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {candidate.job_title}
                      {candidate.employment_type && (
                        <span className="text-white/60">
                          ({candidate.employment_type.replace(/([A-Z])/g, ' $1').trim()})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex">
                {[
                  { id: 'overview', label: 'Overview', icon: User },
                  { id: 'ai-interview', label: 'AI Interview', icon: Brain },
                  { id: 'documents', label: 'Documents', icon: FileText },
                  { id: 'history', label: 'History', icon: History }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'overview' && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</div>
                      <a href={`mailto:${candidate.email}`} className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {candidate.email}
                      </a>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {candidate.phone || 'Not provided'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Applied</div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(candidate.created_at)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {candidate.city && candidate.country 
                          ? `${candidate.city}, ${candidate.country}` 
                          : 'Not specified'}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`rounded-xl p-4 border ${stageStyle.border} ${stageStyle.bg}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-semibold ${stageStyle.text}`}>Current Stage</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${stageStyle.bg} ${stageStyle.text} border ${stageStyle.border}`}>
                        {candidate.current_stage}
                      </span>
                    </div>
                    {candidate.candidate_substage && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Substage:</span> {candidate.candidate_substage.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                  
                  {candidate.interviewer_name && (
                    <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                      <h3 className="font-semibold text-pink-700 mb-3 flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Human Interview
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Interviewer:</span>
                          <p className="font-medium text-gray-900">{candidate.interviewer_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Platform:</span>
                          <p className="font-medium text-gray-900 capitalize">{candidate.meeting_platform || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Scheduled:</span>
                          <p className="font-medium text-gray-900">{formatDateTime(candidate.interview_scheduled_at)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <p className={`font-medium ${candidate.interview_completed_at ? 'text-green-600' : 'text-yellow-600'}`}>
                            {candidate.interview_completed_at ? 'Completed' : 'Scheduled'}
                          </p>
                        </div>
                      </div>
                      {candidate.interview_feedback && (
                        <div className="mt-3 pt-3 border-t border-pink-200">
                          <span className="text-gray-500 text-sm">Feedback:</span>
                          <p className="text-gray-700 mt-1">{candidate.interview_feedback}</p>
                        </div>
                      )}
                      {candidate.meeting_link && (
                        <a
                          href={candidate.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm"
                        >
                          <Video className="w-4 h-4" />
                          Join Meeting
                        </a>
                      )}
                    </div>
                  )}
                  
                  {candidate.resume_url && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-blue-700 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Resume
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setResumeExpanded(!resumeExpanded)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                          >
                            {resumeExpanded ? 'Collapse' : 'Preview'}
                          </button>
                          <a
                            href={candidate.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </a>
                        </div>
                      </div>
                      
                      {resumeExpanded && (
                        <div className="mt-4 bg-white rounded-lg border border-blue-200 overflow-hidden">
                          <iframe
                            src={`${candidate.resume_url}#view=FitH`}
                            className="w-full h-96"
                            title="Resume Preview"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {candidate.communications && candidate.communications.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                        Recent Communications
                      </h3>
                      <div className="space-y-2">
                        {candidate.communications.slice(0, 3).map((comm) => (
                          <div key={comm.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                comm.communication_type === 'email' ? 'bg-blue-100 text-blue-700' :
                                comm.communication_type === 'call' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {comm.communication_type}
                              </span>
                              <span className="text-xs text-gray-500">{formatDateTime(comm.sent_at)}</span>
                            </div>
                            {comm.subject && (
                              <p className="text-sm font-medium text-gray-900">{comm.subject}</p>
                            )}
                            <p className="text-sm text-gray-600 line-clamp-2">{comm.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'ai-interview' && (
                <div className="p-6 space-y-6">
                  {candidate.ai_analysis_status ? (
                    <>
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-indigo-700 flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            AI Interview Results
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            candidate.ai_analysis_status === 'completed' 
                              ? 'bg-green-100 text-green-700'
                              : candidate.ai_analysis_status === 'processing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {candidate.ai_analysis_status}
                          </span>
                        </div>
                        
                        {candidate.ai_interview_completed_at && (
                          <div className="text-sm text-gray-600 mb-4">
                            Completed: {formatDateTime(candidate.ai_interview_completed_at)}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className={`rounded-lg p-4 ${getScoreBg(candidate.ai_interview_score)}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="w-5 h-5 text-gray-600" />
                              <span className="text-sm text-gray-600">Overall Score</span>
                            </div>
                            <div className={`text-3xl font-bold ${getScoreColor(candidate.ai_interview_score)}`}>
                              {candidate.ai_interview_score !== null ? `${Math.round(candidate.ai_interview_score)}%` : 'N/A'}
                            </div>
                          </div>
                          
                          <div className={`rounded-lg p-4 ${getScoreBg(candidate.ai_sentiment_score)}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-5 h-5 text-gray-600" />
                              <span className="text-sm text-gray-600">Sentiment</span>
                            </div>
                            <div className={`text-3xl font-bold ${getScoreColor(candidate.ai_sentiment_score)}`}>
                              {candidate.ai_sentiment_score !== null ? `${Math.round(candidate.ai_sentiment_score)}%` : 'N/A'}
                            </div>
                          </div>
                          
                          <div className={`rounded-lg p-4 ${getScoreBg(candidate.ai_confidence_score)}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-5 h-5 text-gray-600" />
                              <span className="text-sm text-gray-600">Confidence</span>
                            </div>
                            <div className={`text-3xl font-bold ${getScoreColor(candidate.ai_confidence_score)}`}>
                              {candidate.ai_confidence_score !== null ? `${Math.round(candidate.ai_confidence_score)}%` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Duration</div>
                          <div className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            {formatDuration(candidate.ai_interview_duration_seconds)}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Questions</div>
                          <div className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-gray-400" />
                            {candidate.ai_interview_questions_answered || 0} / {candidate.ai_interview_questions_total || 0}
                          </div>
                        </div>
                      </div>
                      
                      {candidate.ai_analysis_report && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" />
                            AI Analysis Report
                          </h4>
                          <div className="prose prose-sm max-w-none">
                            {typeof candidate.ai_analysis_report === 'object' ? (
                              <div className="space-y-4">
                                {candidate.ai_analysis_report.summary && (
                                  <div>
                                    <h5 className="font-medium text-gray-700">Summary</h5>
                                    <p className="text-gray-600">{candidate.ai_analysis_report.summary}</p>
                                  </div>
                                )}
                                {candidate.ai_analysis_report.strengths && (
                                  <div>
                                    <h5 className="font-medium text-green-700">Strengths</h5>
                                    <ul className="list-disc list-inside text-gray-600">
                                      {Array.isArray(candidate.ai_analysis_report.strengths) 
                                        ? candidate.ai_analysis_report.strengths.map((s: string, i: number) => (
                                            <li key={i}>{s}</li>
                                          ))
                                        : <li>{candidate.ai_analysis_report.strengths}</li>
                                      }
                                    </ul>
                                  </div>
                                )}
                                {candidate.ai_analysis_report.areas_for_improvement && (
                                  <div>
                                    <h5 className="font-medium text-yellow-700">Areas for Improvement</h5>
                                    <ul className="list-disc list-inside text-gray-600">
                                      {Array.isArray(candidate.ai_analysis_report.areas_for_improvement)
                                        ? candidate.ai_analysis_report.areas_for_improvement.map((s: string, i: number) => (
                                            <li key={i}>{s}</li>
                                          ))
                                        : <li>{candidate.ai_analysis_report.areas_for_improvement}</li>
                                      }
                                    </ul>
                                  </div>
                                )}
                                {candidate.ai_analysis_report.recommendation && (
                                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                    <h5 className="font-medium text-purple-700">Recommendation</h5>
                                    <p className="text-gray-700">{candidate.ai_analysis_report.recommendation}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                                {JSON.stringify(candidate.ai_analysis_report, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Interview Data</h3>
                      <p className="text-gray-500">This candidate hasn't completed an AI interview yet.</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'documents' && (
                <div className="p-6 space-y-4">
                  {candidate.resume_url && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Resume</p>
                          <p className="text-sm text-gray-500">Primary resume document</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={candidate.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                          title="View"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                        <a
                          href={candidate.resume_url}
                          download
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {candidate.documents && candidate.documents.length > 0 ? (
                    candidate.documents.map((doc) => (
                      <div key={doc.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doc.file_name}</p>
                            <p className="text-sm text-gray-500">
                              {doc.document_type} · {formatFileSize(doc.file_size)} · {formatDate(doc.uploaded_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={doc.blob_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                            title="View"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                          <a
                            href={doc.blob_url}
                            download
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    ))
                  ) : !candidate.resume_url && (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
                      <p className="text-gray-500">No documents have been uploaded for this candidate.</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'history' && (
                <div className="p-6">
                  {candidate.stageHistory && candidate.stageHistory.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                      
                      <div className="space-y-6">
                        {candidate.stageHistory.map((entry, index) => (
                          <div key={entry.id} className="relative pl-10">
                            <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                              index === 0 
                                ? 'bg-purple-600' 
                                : 'bg-gray-300'
                            }`}>
                              {index === 0 ? (
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              ) : (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            
                            <div className={`rounded-lg p-4 ${
                              index === 0 ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {entry.previous_stage && (
                                    <>
                                      <span className="text-gray-500">{entry.previous_stage}</span>
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </>
                                  )}
                                  <span className={`font-medium ${index === 0 ? 'text-purple-700' : 'text-gray-900'}`}>
                                    {entry.new_stage}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                {formatDateTime(entry.changed_at)}
                              </div>
                              
                              {entry.notes && (
                                <p className="mt-2 text-sm text-gray-600 bg-white rounded p-2">
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No History</h3>
                      <p className="text-gray-500">No stage transitions recorded yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
