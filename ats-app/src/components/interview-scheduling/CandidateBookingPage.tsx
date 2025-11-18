import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  interview_type: string;
  video_link?: string;
  location?: string;
  timezone: string;
  available_spots: number;
}

export const CandidateBookingPage: React.FC = () => {
  const { candidateId, jobId } = useParams();
  const [searchParams] = useSearchParams();
  const stageId = searchParams.get('stageId');

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [userTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    loadAvailableSlots();
  }, [candidateId, jobId, stageId]);

  const loadAvailableSlots = async () => {
    setLoading(true);
    setError('');

    try {
      const url = stageId
        ? `/api/candidates/${candidateId}/jobs/${jobId}/available-slots?stageId=${stageId}`
        : `/api/candidates/${candidateId}/jobs/${jobId}/available-slots`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to load available slots');
      }

      const data = await response.json();
      setAvailableSlots(data.availableSlots || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async () => {
    if (!selectedSlot || !email) {
      setError('Please select a time slot and provide your email');
      return;
    }

    setBooking(true);
    setError('');

    try {
      const response = await fetch(`/api/slots/${selectedSlot}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          confirmedEmail: email,
          candidateTimezone: userTimezone,
          notes: notes || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to book slot');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const groupSlotsByDate = (slots: TimeSlot[]) => {
    const grouped: Record<string, TimeSlot[]> = {};

    slots.forEach(slot => {
      const date = new Date(slot.start_time).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(slot);
    });

    return grouped;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '📹';
      case 'phone':
        return '📞';
      case 'onsite':
        return '🏢';
      default:
        return '📅';
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f1e] to-[#1a1a2e] flex items-center justify-center p-4">
        <div className="bg-[#1a1a2e] rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Interview Booked Successfully!</h2>
          <p className="text-gray-400 mb-6">
            You will receive a confirmation email with interview details and a calendar invitation.
          </p>
          <div className="bg-[#0f0f1e] border border-gray-700 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-400">Check your email for:</p>
            <ul className="list-disc list-inside text-sm text-gray-300 mt-2 space-y-1">
              <li>Interview date and time</li>
              <li>Meeting link or location</li>
              <li>Calendar invite (.ics file)</li>
              <li>Rescheduling options</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate(availableSlots);
  const selectedSlotData = availableSlots.find(s => s.id === selectedSlot);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1e] to-[#1a1a2e] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1a1a2e] rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600">
            <h1 className="text-3xl font-bold text-white">Schedule Your Interview</h1>
            <p className="text-purple-100 mt-2">Select a time that works best for you</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading available times...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Available Slots</h3>
                <p className="text-gray-400">
                  There are currently no available interview times. Please check back later or contact the recruiter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Available Times</h2>
                    <div className="text-sm text-gray-400">
                      Timezone: {userTimezone}
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {Object.entries(groupedSlots).map(([date, slots]) => (
                      <div key={date}>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 sticky top-0 bg-[#1a1a2e] py-2">
                          {date}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {slots.map(slot => (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlot(slot.id)}
                              className={`p-4 rounded-lg border text-left transition-all ${
                                selectedSlot === slot.id
                                  ? 'bg-purple-600 border-purple-500 text-white'
                                  : 'bg-[#0f0f1e] border-gray-700 text-gray-300 hover:border-purple-500'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{getInterviewTypeIcon(slot.interview_type)}</span>
                                <span className="font-semibold">{formatTime(slot.start_time)}</span>
                              </div>
                              <div className="text-xs opacity-80">
                                {slot.duration_minutes} minutes
                              </div>
                              {slot.available_spots > 1 && (
                                <div className="text-xs opacity-80 mt-1">
                                  {slot.available_spots} spots available
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-[#0f0f1e] border border-gray-700 rounded-lg p-6 sticky top-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Booking Details</h3>

                    {selectedSlotData ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Selected Time</label>
                          <div className="text-white">
                            {new Date(selectedSlotData.start_time).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })} at {formatTime(selectedSlotData.start_time)}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Duration</label>
                          <div className="text-white">{selectedSlotData.duration_minutes} minutes</div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Type</label>
                          <div className="text-white capitalize">
                            {getInterviewTypeIcon(selectedSlotData.interview_type)} {selectedSlotData.interview_type}
                          </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                          <label className="block text-sm text-gray-300 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Notes (optional)
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any questions or comments..."
                            rows={3}
                            className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                          />
                        </div>

                        <button
                          onClick={handleBookSlot}
                          disabled={booking || !email}
                          className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-semibold"
                        >
                          {booking ? 'Booking...' : 'Confirm Booking'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">👆</div>
                        <p>Select a time slot to continue</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
