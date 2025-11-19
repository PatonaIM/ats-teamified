import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import CalendarSlotCreator from './CalendarSlotCreator';
import '../styles/calendar.css';

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

export function InterviewAvailability() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    // Only fetch data when user is authenticated
    if (user?.id) {
      fetchSlots();
    }
  }, [user?.id]);

  const fetchSlots = async () => {
    try {
      const data = await apiRequest(`/api/interview-slots/my-slots`);
      if (data.success) {
        setSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleCreateSlot = async (slotData: any) => {
    try {
      setCreateLoading(true);
      
      const data = await apiRequest(`/api/jobs/${slotData.job_id}/stages/${slotData.stage_id}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotConfig: {
            startDate: slotData.start_time.split('T')[0],
            endDate: slotData.end_time.split('T')[0],
            startHour: new Date(slotData.start_time).getHours(),
            startMinute: new Date(slotData.start_time).getMinutes(),
            endHour: new Date(slotData.end_time).getHours(),
            endMinute: new Date(slotData.end_time).getMinutes(),
            durationMinutes: slotData.duration_minutes,
            breakMinutes: 0,
            daysOfWeek: [new Date(slotData.start_time).getDay()]
          },
          interviewType: slotData.interview_type,
          videoLink: slotData.video_link,
          location: slotData.location,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          maxBookings: slotData.max_bookings || 1
        })
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to create slot');
      }
      
      await fetchSlots();
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const data = await apiRequest(`/api/interview-slots/${slotId}`, {
        method: 'DELETE'
      });

      if (data.success) {
        await fetchSlots();
      } else {
        alert(data.message || 'Failed to delete slot');
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('Failed to delete slot');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Interview Availability
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your available interview time slots - drag on the calendar to create slots
        </p>
      </div>

      <CalendarSlotCreator
        existingSlots={slots}
        onCreateSlot={handleCreateSlot}
        onDeleteSlot={handleDeleteSlot}
        loading={createLoading}
      />
    </div>
  );
}
