import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Search, Calendar, Eye, X, DollarSign, MapPin, Building2, Briefcase } from 'lucide-react';
import { getEmploymentTypeConfig } from '../utils/employmentTypes';
import { apiRequest } from '../utils/api';

interface Approval {
  approval_id: string;
  job_id: string;
  title: string;
  employment_type: string;
  department: string;
  city: string;
  country: string;
  remote_flag: boolean;
  salary_from: number;
  salary_to: number;
  salary_currency: string;
  created_by_role: string;
  submitted_at: string;
  sla_deadline: string;
  priority: 'overdue' | 'urgent' | 'normal';
  approval_status: string;
  description: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedApprovals, setSelectedApprovals] = useState<Set<string>>(new Set());
  const [selectedJobDetail, setSelectedJobDetail] = useState<Approval | null>(null);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Approval[]>('/api/approvals?status=pending');
      console.log('[Approvals] Fetched', data.length, 'pending approvals');
      setApprovals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApprove = async (approvalId: string) => {
    const confirmation = window.confirm('Are you sure you want to approve this job?');
    if (!confirmation) return;

    try {
      await apiRequest(`/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverId: null,
          comments: 'Approved via manager dashboard'
        })
      });
      
      alert('Job approved successfully!');
      fetchApprovals();
    } catch (error) {
      console.error('Error approving job:', error);
      alert('Failed to approve job');
    }
  };

  const handleReject = async (approvalId: string) => {
    const comments = window.prompt('Please provide feedback for rejection (required):');
    if (!comments || comments.trim().length === 0) {
      alert('Feedback comments are required for rejection');
      return;
    }

    try {
      await apiRequest(`/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverId: null,
          comments
        })
      });
      
      alert('Job rejected with feedback');
      fetchApprovals();
    } catch (error) {
      console.error('Error rejecting job:', error);
      alert('Failed to reject job');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedApprovals.size === 0) {
      alert('Please select jobs to approve');
      return;
    }

    const confirmation = window.confirm(`Approve ${selectedApprovals.size} selected jobs?`);
    if (!confirmation) return;

    try {
      const result = await apiRequest<{ approved: number; total: number }>('/api/approvals/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalIds: Array.from(selectedApprovals),
          approverId: null,
          comments: 'Bulk approved via manager dashboard'
        })
      });
      
      alert(`Successfully approved ${result.approved}/${result.total} jobs`);
      setSelectedApprovals(new Set());
      fetchApprovals();
    } catch (error) {
      console.error('Error in bulk approval:', error);
      alert('Failed to bulk approve jobs');
    }
  };

  const toggleSelection = (approvalId: string) => {
    const newSelection = new Set(selectedApprovals);
    if (newSelection.has(approvalId)) {
      newSelection.delete(approvalId);
    } else {
      newSelection.add(approvalId);
    }
    setSelectedApprovals(newSelection);
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      overdue: { color: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle, text: 'Overdue' },
      urgent: { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: Clock, text: 'Urgent' },
      normal: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Calendar, text: 'Normal' }
    };
    const badge = badges[priority as keyof typeof badges] || badges.normal;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) return `Overdue by ${Math.abs(diffHours)}h`;
    if (diffHours < 6) return `${diffHours}h remaining`;
    return `${Math.floor(diffHours / 24)}d remaining`;
  };

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         approval.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || approval.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Job Approval Queue
        </h1>
        <p className="text-gray-600 mt-2">Review and approve pending job requests from clients</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by job title or department..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="overdue">Overdue</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </select>

          {selectedApprovals.size > 0 && (
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve {selectedApprovals.size} Selected
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading approvals...</div>
        ) : filteredApprovals.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm mt-2">No pending job approvals at this time</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedApprovals.size === filteredApprovals.length && filteredApprovals.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedApprovals(new Set(filteredApprovals.map(a => a.approval_id)));
                      } else {
                        setSelectedApprovals(new Set());
                      }
                    }}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SLA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApprovals.map((approval) => {
                const employmentConfig = getEmploymentTypeConfig(approval.employment_type);
                
                return (
                  <tr key={approval.approval_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedApprovals.has(approval.approval_id)}
                        onChange={() => toggleSelection(approval.approval_id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {getPriorityBadge(approval.priority)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{approval.title}</div>
                      <div className="text-sm text-gray-500">{approval.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employmentConfig ? `${employmentConfig.colors.bg} ${employmentConfig.colors.text}` : 'bg-gray-100 text-gray-700'}`}>
                        {employmentConfig?.label || approval.employment_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {approval.city}, {approval.country}
                      {approval.remote_flag && <span className="ml-2 text-blue-600">• Remote</span>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className={`font-medium ${approval.priority === 'overdue' ? 'text-red-600' : approval.priority === 'urgent' ? 'text-orange-600' : 'text-gray-600'}`}>
                        {getTimeRemaining(approval.sla_deadline)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(approval.submitted_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedJobDetail(approval)}
                          className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                          title="View job details"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                        <button
                          onClick={() => handleApprove(approval.approval_id)}
                          className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(approval.approval_id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {filteredApprovals.length} of {approvals.length} pending approvals
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Overdue: {approvals.filter(a => a.priority === 'overdue').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Urgent: {approvals.filter(a => a.priority === 'urgent').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Normal: {approvals.filter(a => a.priority === 'normal').length}</span>
          </div>
        </div>
      </div>

      {selectedJobDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6 flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{selectedJobDetail.title}</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {selectedJobDetail.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedJobDetail.city}, {selectedJobDetail.country}
                    {selectedJobDetail.remote_flag && ' • Remote'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedJobDetail(null)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Employment Type</div>
                    <div className="font-medium">
                      {getEmploymentTypeConfig(selectedJobDetail.employment_type)?.label || selectedJobDetail.employment_type}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Salary Range</div>
                    <div className="font-medium">
                      {selectedJobDetail.salary_currency} {selectedJobDetail.salary_from?.toLocaleString()} - {selectedJobDetail.salary_to?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500 mb-1">SLA Deadline</div>
                    <div className="font-medium">
                      {getTimeRemaining(selectedJobDetail.sla_deadline)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(selectedJobDetail.sla_deadline).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Submitted</div>
                    <div className="font-medium">
                      {new Date(selectedJobDetail.submitted_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      by {selectedJobDetail.created_by_role}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Job Description</h3>
                <div 
                  className="prose max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: selectedJobDetail.description || '<p class="text-gray-400 italic">No description provided</p>' }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleReject(selectedJobDetail.approval_id);
                    setSelectedJobDetail(null);
                  }}
                  className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => {
                    handleApprove(selectedJobDetail.approval_id);
                    setSelectedJobDetail(null);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
