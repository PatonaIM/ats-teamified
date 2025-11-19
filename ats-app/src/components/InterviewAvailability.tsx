import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, Trash2, Plus, AlertCircle } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface InterviewSlot {
  id: string;
  job_id: string;
  job_title: string;
  stage_id: string;
  stage_name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  interview_type: 'phone' | 'video' | 'onsite';
  video_link?: string;
  location?: string;
  max_bookings: number;
  current_bookings: number;
  status: 'available' | 'booked' | 'cancelled';
}

interface JobWithStages {
  id: string;
  title: string;
  stages: { id: string; name: string }[];
}

export function InterviewAvailability() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [jobs, setJobs] = useState<JobWithStages[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    jobId: '',
    stageId: '',
    dateRange: {
      start: '',
      end: ''
    },
    timeSlots: {
      startHour: '9',
      startMinute: '0',
      endHour: '17',
      endMinute: '0',
      durationMinutes: 60,
      breakMinutes: 15
    },
    daysOfWeek: [1, 2, 3, 4, 5],
    interviewType: 'video' as 'phone' | 'video' | 'onsite',
    videoLink: '',
    location: ''
  });

  useEffect(() => {
    // Only fetch data when user is authenticated
    if (user?.id) {
      fetchJobs();
      fetchSlots();
    }
  }, [user?.id]);

  const fetchJobs = async () => {
    try {
      const data = await apiRequest('/api/jobs');
      if (data.jobs && Array.isArray(data.jobs)) {
        const jobsWithStages = await Promise.all(
          data.jobs.map(async (job: any) => {
            const stagesData = await apiRequest(`/api/jobs/${job.id}/stages`);
            return {
              id: job.id,
              title: job.title,
              stages: stagesData.success ? stagesData.stages.map((s: any) => ({ id: s.id, name: s.stageName })) : []
            };
          })
        );
        setJobs(jobsWithStages);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/interview-slots/my-slots`);
      if (data.success) {
        setSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlots = async () => {
    if (!formData.jobId || !formData.stageId) {
      alert('Please select a job and stage');
      return;
    }
    
    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    setCreateLoading(true);
    try {
      const data = await apiRequest(`/api/jobs/${formData.jobId}/stages/${formData.stageId}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotConfig: {
            startDate: formData.dateRange.start,
            endDate: formData.dateRange.end,
            startHour: parseInt(formData.timeSlots.startHour),
            startMinute: parseInt(formData.timeSlots.startMinute),
            endHour: parseInt(formData.timeSlots.endHour),
            endMinute: parseInt(formData.timeSlots.endMinute),
            durationMinutes: formData.timeSlots.durationMinutes,
            breakMinutes: formData.timeSlots.breakMinutes,
            daysOfWeek: formData.daysOfWeek
          },
          interviewType: formData.interviewType,
          videoLink: formData.videoLink,
          location: formData.location,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          maxBookings: 1
        })
      });

      if (data.success) {
        alert(`Created ${data.slots.length} interview slots!`);
        setShowCreateForm(false);
        fetchSlots();
        resetForm();
      } else {
        alert(data.message || 'Failed to create slots');
      }
    } catch (error) {
      console.error('Error creating slots:', error);
      alert('Failed to create interview slots');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;

    try {
      const data = await apiRequest(`/api/slots/${slotId}`, {
        method: 'DELETE'
      });

      if (data.success) {
        fetchSlots();
      } else {
        alert(data.message || 'Failed to delete slot');
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('Failed to delete slot');
    }
  };

  const resetForm = () => {
    setFormData({
      jobId: '',
      stageId: '',
      dateRange: { start: '', end: '' },
      timeSlots: {
        startHour: '9',
        startMinute: '0',
        endHour: '17',
        endMinute: '0',
        durationMinutes: 60,
        breakMinutes: 15
      },
      daysOfWeek: [1, 2, 3, 4, 5],
      interviewType: 'video',
      videoLink: '',
      location: ''
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const selectedJob = jobs.find(j => j.id === formData.jobId);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Interview Availability
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your available interview time slots for candidates
        </p>
      </div>

      {/* Create Slots Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          Create Interview Slots
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Interview Slots
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Job Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Position
              </label>
              <select
                value={formData.jobId}
                onChange={(e) => setFormData({ ...formData, jobId: e.target.value, stageId: '' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select Job</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>

            {/* Stage Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interview Stage
              </label>
              <select
                value={formData.stageId}
                onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                disabled={!formData.jobId}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="">Select Stage</option>
                {selectedJob?.stages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.dateRange.start}
                onChange={(e) => setFormData({ ...formData, dateRange: { ...formData.dateRange, start: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.dateRange.end}
                onChange={(e) => setFormData({ ...formData, dateRange: { ...formData.dateRange, end: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Time Settings */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Working Hours
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input
                  type="number"
                  placeholder="Start Hour"
                  value={formData.timeSlots.startHour}
                  onChange={(e) => setFormData({ ...formData, timeSlots: { ...formData.timeSlots, startHour: e.target.value } })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  max="23"
                />
                <input
                  type="number"
                  placeholder="Start Min"
                  value={formData.timeSlots.startMinute}
                  onChange={(e) => setFormData({ ...formData, timeSlots: { ...formData.timeSlots, startMinute: e.target.value } })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  max="59"
                />
                <input
                  type="number"
                  placeholder="End Hour"
                  value={formData.timeSlots.endHour}
                  onChange={(e) => setFormData({ ...formData, timeSlots: { ...formData.timeSlots, endHour: e.target.value } })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  max="23"
                />
                <input
                  type="number"
                  placeholder="End Min"
                  value={formData.timeSlots.endMinute}
                  onChange={(e) => setFormData({ ...formData, timeSlots: { ...formData.timeSlots, endMinute: e.target.value } })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  max="59"
                />
              </div>
            </div>

            {/* Duration & Break */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interview Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.timeSlots.durationMinutes}
                onChange={(e) => setFormData({ ...formData, timeSlots: { ...formData.timeSlots, durationMinutes: parseInt(e.target.value) } })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="15"
                step="15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Break Between Interviews (minutes)
              </label>
              <input
                type="number"
                value={formData.timeSlots.breakMinutes}
                onChange={(e) => setFormData({ ...formData, timeSlots: { ...formData.timeSlots, breakMinutes: parseInt(e.target.value) } })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
                step="5"
              />
            </div>

            {/* Interview Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interview Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="video"
                    checked={formData.interviewType === 'video'}
                    onChange={(e) => setFormData({ ...formData, interviewType: e.target.value as any })}
                    className="text-purple-600"
                  />
                  <Video size={16} />
                  <span className="text-gray-900 dark:text-white">Video Call</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="phone"
                    checked={formData.interviewType === 'phone'}
                    onChange={(e) => setFormData({ ...formData, interviewType: e.target.value as any })}
                    className="text-purple-600"
                  />
                  <span className="text-gray-900 dark:text-white">Phone</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="onsite"
                    checked={formData.interviewType === 'onsite'}
                    onChange={(e) => setFormData({ ...formData, interviewType: e.target.value as any })}
                    className="text-purple-600"
                  />
                  <MapPin size={16} />
                  <span className="text-gray-900 dark:text-white">On-site</span>
                </label>
              </div>
            </div>

            {/* Video Link */}
            {formData.interviewType === 'video' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video Meeting Link
                </label>
                <input
                  type="url"
                  value={formData.videoLink}
                  onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Location */}
            {formData.interviewType === 'onsite' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Office address..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreateSlots}
              disabled={createLoading}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {createLoading ? 'Creating...' : 'Create Slots'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Slots List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Interview Slots ({slots.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Loading slots...
          </div>
        ) : slots.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No interview slots created yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Click "Create Interview Slots" to add your availability
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {slots.map((slot) => (
              <div key={slot.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {slot.job_title}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        • {slot.stage_name}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        slot.status === 'available' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {slot.current_bookings}/{slot.max_bookings} booked
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDateTime(slot.start_time).date} at {formatDateTime(slot.start_time).time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {slot.duration_minutes} minutes
                      </div>
                      {slot.interview_type === 'video' && slot.video_link && (
                        <div className="flex items-center gap-1">
                          <Video size={14} />
                          <a href={slot.video_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Video Link
                          </a>
                        </div>
                      )}
                      {slot.interview_type === 'onsite' && slot.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          {slot.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    disabled={slot.current_bookings > 0}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={slot.current_bookings > 0 ? 'Cannot delete slot with bookings' : 'Delete slot'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
