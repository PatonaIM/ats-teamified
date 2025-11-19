import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, Phone, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../utils/api';

interface InterviewSlot {
  id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  interview_type: 'phone' | 'video' | 'onsite';
  video_link?: string;
  location?: string;
  timezone: string;
  max_bookings: number;
  current_bookings: number;
  status: 'available' | 'booked' | 'cancelled';
  bookings?: InterviewBooking[];
}

interface InterviewBooking {
  id: string;
  candidate_id: string;
  status: 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
  booked_at: string;
  confirmed_email: string;
  booking_token: string;
  notes?: string;
}

interface Props {
  candidateId: string;
  jobId: string;
  currentStage: string;
  stages: Array<{ id: string; stageName: string }>;
  isViewOnly: boolean;
}

export default function InterviewScheduling({ candidateId, jobId, currentStage, stages, isViewOnly }: Props) {
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [booking, setBooking] = useState<(InterviewBooking & { slot: InterviewSlot }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    interviewType: 'video' as 'phone' | 'video' | 'onsite',
    videoLink: '',
    location: '',
    dateRange: {
      start: '',
      end: ''
    },
    timeSlots: {
      startHour: '09',
      startMinute: '00',
      endHour: '17',
      endMinute: '00',
      durationMinutes: 60,
      breakMinutes: 15
    },
    daysOfWeek: [1, 2, 3, 4, 5] // Mon-Fri by default
  });

  const currentStageObj = stages.find(s => s.stageName === currentStage);

  useEffect(() => {
    if (currentStageObj?.id) {
      fetchSlots();
      fetchBooking();
    }
  }, [candidateId, currentStageObj?.id]);

  const fetchSlots = async () => {
    if (!currentStageObj?.id) return;
    
    try {
      setLoading(true);
      const response = await apiRequest(`/api/jobs/${jobId}/stages/${currentStageObj.id}/slots`);
      const data = await response.json();
      if (data.success) {
        setSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooking = async () => {
    try {
      const response = await apiRequest(`/api/jobs/${jobId}/bookings?stageId=${currentStageObj?.id}`);
      const data = await response.json();
      if (data.success && data.bookings) {
        const candidateBooking = data.bookings.find((b: any) => b.candidate_id === candidateId && b.status === 'confirmed');
        setBooking(candidateBooking || null);
      } else {
        setBooking(null);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      setBooking(null);
    }
  };

  const handleCreateSlots = async () => {
    if (!currentStageObj?.id) return;
    
    setCreateLoading(true);
    try {
      const response = await apiRequest(`/api/jobs/${jobId}/stages/${currentStageObj.id}/slots`, {
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
          maxBookings: 1,
          createdBy: 'current-user-id' // TODO: Get from auth context
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Created ${data.slots.length} interview slots!`);
        setShowCreateForm(false);
        fetchSlots();
        
        // Reset form
        setFormData({
          ...formData,
          videoLink: '',
          location: '',
          dateRange: { start: '', end: '' }
        });
      } else {
        throw new Error(data.error || 'Failed to create slots');
      }
    } catch (error: any) {
      console.error('Error creating slots:', error);
      alert(error.message || 'Failed to create slots. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;
    
    try {
      await apiRequest(`/api/slots/${slotId}`, {
        method: 'DELETE'
      });
      
      alert('Slot deleted successfully');
      fetchSlots();
    } catch (error: any) {
      alert(error.message || 'Failed to delete slot. It may have confirmed bookings.');
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} className="text-blue-500" />;
      case 'phone': return <Phone size={16} className="text-green-500" />;
      case 'onsite': return <MapPin size={16} className="text-purple-500" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
        <div className="text-center text-gray-500">Loading interview information...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar size={20} className="text-purple-500" />
          Interview Scheduling
        </h3>
        
        {!isViewOnly && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            Create Slots
          </button>
        )}
      </div>

      {/* Booked Interview */}
      {booking && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-green-900 dark:text-green-100 mb-2">
                Interview Confirmed
              </div>
              <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  {formatDateTime(booking.slot.start_time).date} at {formatDateTime(booking.slot.start_time).time}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  {booking.slot.duration_minutes} minutes
                </div>
                {booking.slot.interview_type === 'video' && booking.slot.video_link && (
                  <div className="flex items-center gap-2">
                    <Video size={14} />
                    <a href={booking.slot.video_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Join Meeting
                    </a>
                  </div>
                )}
                {booking.slot.interview_type === 'onsite' && booking.slot.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    {booking.slot.location}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Slots Form */}
      {showCreateForm && (
        <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Create Interview Slots</h4>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interview Type
              </label>
              <div className="flex gap-2">
                {(['video', 'phone', 'onsite'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, interviewType: type })}
                    className={`
                      flex-1 px-4 py-2 rounded-lg border-2 transition-all capitalize
                      ${formData.interviewType === type
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Link / Location */}
            {formData.interviewType === 'video' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video Meeting Link
                </label>
                <input
                  type="url"
                  value={formData.videoLink}
                  onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            )}

            {formData.interviewType === 'onsite' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Office address..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.dateRange.start}
                  onChange={(e) => setFormData({ ...formData, dateRange: { ...formData.dateRange, start: e.target.value } })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Time Slots */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.timeSlots.startHour}
                    onChange={(e) => setFormData({ ...formData, timeSlots: { ...formData.timeSlots, startHour: e.target.value.padStart(2, '0') } })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="HH"
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.timeSlots.startMinute}
                    onChange={(e) => setFormData({ ...formData, timeSlots: { ...formData.timeSlots, startMinute: e.target.value.padStart(2, '0') } })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="MM"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.timeSlots.endHour}
                    onChange={(e) => setFormData({ ...formData, timeSlots: { ...formData.timeSlots, endHour: e.target.value.padStart(2, '0') } })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="HH"
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.timeSlots.endMinute}
                    onChange={(e) => setFormData({ ...formData, timeSlots: { ...formData.timeSlots, endMinute: e.target.value.padStart(2, '0') } })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="MM"
                  />
                </div>
              </div>
            </div>

            {/* Duration & Break */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slot Duration (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="240"
                  step="15"
                  value={formData.timeSlots.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, timeSlots: { ...formData.timeSlots, durationMinutes: parseInt(e.target.value) } })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Break Between (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="5"
                  value={formData.timeSlots.breakMinutes}
                  onChange={(e) => setFormData({ ...formData, timeSlots: { ...formData.timeSlots, breakMinutes: parseInt(e.target.value) } })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleCreateSlots}
                disabled={createLoading || !formData.dateRange.start || !formData.dateRange.end}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium"
              >
                {createLoading ? 'Creating...' : 'Create Slots'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Slots List */}
      {!booking && slots.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Available Time Slots ({slots.length})
          </div>
          <div className="space-y-2">
            {slots.map(slot => {
              const { date, time } = formatDateTime(slot.start_time);
              const isBooked = slot.current_bookings >= slot.max_bookings;
              
              return (
                <div
                  key={slot.id}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${isBooked 
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60' 
                      : 'border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 bg-white dark:bg-gray-800'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getInterviewTypeIcon(slot.interview_type)}
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {slot.interview_type} Interview
                        </span>
                        {isBooked && (
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                            Booked
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {date} at {time}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          {slot.duration_minutes} minutes
                        </div>
                        {slot.video_link && (
                          <div className="flex items-center gap-2">
                            <Video size={14} />
                            <span className="text-xs text-blue-600 dark:text-blue-400">Meeting link provided</span>
                          </div>
                        )}
                        {slot.location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            {slot.location}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!isViewOnly && (
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete slot"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!booking && slots.length === 0 && !showCreateForm && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <AlertCircle size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No interview slots created yet.</p>
          {!isViewOnly && (
            <p className="text-xs mt-2">Click "Create Slots" to add available time slots.</p>
          )}
        </div>
      )}
    </div>
  );
}
