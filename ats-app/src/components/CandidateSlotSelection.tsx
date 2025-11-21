import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, Check } from 'lucide-react';

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  timezone: string;
  duration_minutes: number;
  job_title?: string;
  stage_name?: string;
}

export function CandidateSlotSelection() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid link - missing token');
      setLoading(false);
      return;
    }
    
    fetchAvailableSlots();
  }, [token]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      
      // For now, we'll fetch via the public endpoint
      // In production, this would be a dedicated public endpoint
      const response = await fetch(`/api/candidates/human-interview/available-slots-public?token=${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load available slots');
      }
      
      const data = await response.json();
      setSlots(data.slots || []);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching slots:', err);
      setError(err.message || 'Failed to load available slots. Please try again.');
      setLoading(false);
    }
  };

  const handleSelectSlot = async () => {
    if (!selectedSlotId || !token) return;
    
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/candidates/human-interview/select-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          slotId: selectedSlotId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to select slot');
      }
      
      setMeetingInfo(data.meeting);
      setSuccess(true);
    } catch (err: any) {
      console.error('Error selecting slot:', err);
      alert(err.message || 'Failed to select slot. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string, timezone: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        timeZone: timezone 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZone: timezone
      })
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading available time slots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Slots</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            Please contact the recruiter if this link has expired or is invalid.
          </p>
        </div>
      </div>
    );
  }

  if (success && meetingInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Scheduled!</h2>
            <p className="text-gray-600">Your interview has been successfully scheduled.</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-900">
                <Calendar size={18} className="text-purple-500" />
                <span className="font-medium">
                  {formatDateTime(meetingInfo.startTime, meetingInfo.timezone).date}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-900">
                <Clock size={18} className="text-purple-500" />
                <span className="font-medium">
                  {formatDateTime(meetingInfo.startTime, meetingInfo.timezone).time} - 
                  {formatDateTime(meetingInfo.endTime, meetingInfo.timezone).time}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                ({meetingInfo.timezone})
              </div>
            </div>
          </div>
          
          {meetingInfo.link && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Meeting Link:</strong>
              </p>
              <a
                href={meetingInfo.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm break-all"
              >
                {meetingInfo.link}
              </a>
              <p className="text-xs text-gray-500 mt-2">
                Platform: {meetingInfo.platform?.replace('_', ' ') || 'Video call'}
              </p>
            </div>
          )}
          
          {meetingInfo.instructions && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                {meetingInfo.instructions}
              </p>
            </div>
          )}
          
          <div className="mt-6 text-center text-sm text-gray-500">
            You will receive a confirmation email shortly with the meeting details.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Select Your Interview Time</h1>
            <p className="text-purple-100">Choose a time slot that works best for you</p>
          </div>
          
          <div className="p-6">
            {slots.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No available time slots found.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Please contact the recruiter to schedule an interview.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {slots.map((slot) => {
                    const { date, time } = formatDateTime(slot.start_time, slot.timezone);
                    const endTime = formatDateTime(slot.end_time, slot.timezone).time;
                    const isSelected = selectedSlotId === slot.id;
                    
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar size={18} className={isSelected ? 'text-purple-600' : 'text-gray-400'} />
                              <span className="font-semibold text-gray-900">{date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock size={16} className="text-gray-400" />
                              <span>{time} - {endTime}</span>
                              <span className="text-sm text-gray-500">({slot.timezone})</span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Duration: {slot.duration_minutes} minutes
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                              <Check size={14} className="text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={handleSelectSlot}
                  disabled={!selectedSlotId || submitting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all shadow-lg"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Confirming...
                    </span>
                  ) : (
                    'Confirm Selected Time Slot'
                  )}
                </button>
                
                {!selectedSlotId && (
                  <p className="text-sm text-gray-500 text-center mt-3">
                    Please select a time slot to continue
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
