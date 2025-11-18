import React, { useState, useEffect } from 'react';

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  interview_type: string;
  video_link?: string;
  location?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  stage_name: string;
  status: string;
  booked_at: string;
}

interface BookingDashboardProps {
  jobId: string;
}

export const BookingDashboard: React.FC<BookingDashboardProps> = ({ jobId }) => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState({
    status: 'all',
    stageId: '',
    view: 'upcoming' as 'upcoming' | 'past' | 'all'
  });

  useEffect(() => {
    loadBookings();
  }, [jobId, filter]);

  const loadBookings = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      
      if (filter.status !== 'all') {
        params.append('status', filter.status);
      }
      if (filter.stageId) {
        params.append('stageId', filter.stageId);
      }

      const response = await fetch(`/api/jobs/${jobId}/bookings?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load bookings');
      }

      const data = await response.json();
      let filteredBookings = data.bookings || [];

      // Filter by view (upcoming/past)
      const now = new Date();
      if (filter.view === 'upcoming') {
        filteredBookings = filteredBookings.filter(
          (b: Booking) => new Date(b.start_time) >= now
        );
      } else if (filter.view === 'past') {
        filteredBookings = filteredBookings.filter(
          (b: Booking) => new Date(b.start_time) < now
        );
      }

      setBookings(filteredBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const groupBookingsByDate = (bookings: Booking[]) => {
    const grouped: Record<string, Booking[]> = {};

    bookings.forEach(booking => {
      const dateKey = new Date(booking.start_time).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });

    return grouped;
  };

  const groupedBookings = groupBookingsByDate(bookings);
  const sortedDates = Object.keys(groupedBookings).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Interview Schedule</h2>
        <button
          onClick={loadBookings}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div>
          <select
            value={filter.view}
            onChange={(e) => setFilter({ ...filter, view: e.target.value as any })}
            className="px-4 py-2 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="all">All</option>
          </select>
        </div>

        <div>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading interviews...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-[#0f0f1e] border border-gray-700 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Interviews Scheduled</h3>
          <p className="text-gray-400">
            {filter.view === 'upcoming' 
              ? 'No upcoming interviews scheduled yet'
              : filter.view === 'past'
              ? 'No past interviews found'
              : 'No interviews scheduled yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateKey => {
            const dateBookings = groupedBookings[dateKey];
            const { date } = formatDateTime(dateBookings[0].start_time);
            
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-white">{date}</h3>
                  {isToday(dateBookings[0].start_time) && (
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full">
                      Today
                    </span>
                  )}
                  <div className="flex-1 h-px bg-gray-700"></div>
                </div>

                <div className="space-y-3">
                  {dateBookings.map(booking => {
                    const { time } = formatDateTime(booking.start_time);
                    
                    return (
                      <div
                        key={booking.id}
                        className="bg-[#0f0f1e] border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{getInterviewTypeIcon(booking.interview_type)}</span>
                              <div>
                                <h4 className="text-lg font-semibold text-white">
                                  {booking.first_name} {booking.last_name}
                                </h4>
                                <p className="text-sm text-gray-400">{booking.email}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <div className="text-xs text-gray-400 mb-1">Time</div>
                                <div className="text-white">{time}</div>
                              </div>

                              <div>
                                <div className="text-xs text-gray-400 mb-1">Duration</div>
                                <div className="text-white">{booking.duration_minutes} min</div>
                              </div>

                              <div>
                                <div className="text-xs text-gray-400 mb-1">Stage</div>
                                <div className="text-white">{booking.stage_name}</div>
                              </div>

                              <div>
                                <div className="text-xs text-gray-400 mb-1">Type</div>
                                <div className="text-white capitalize">{booking.interview_type}</div>
                              </div>
                            </div>

                            {booking.video_link && (
                              <div className="mt-3">
                                <a
                                  href={booking.video_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Join Video Call
                                </a>
                              </div>
                            )}

                            {booking.location && (
                              <div className="mt-3 text-sm text-gray-400">
                                📍 {booking.location}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            
                            <div className="text-xs text-gray-500">
                              Booked {new Date(booking.booked_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
