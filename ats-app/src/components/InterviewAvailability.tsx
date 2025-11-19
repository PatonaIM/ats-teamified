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

  // Use demo user ID if not authenticated (for MVP/development)
  const effectiveUserId = user?.id || '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    fetchSlots();
  }, [effectiveUserId]);

  const fetchSlots = async () => {
    try {
      const data = await apiRequest(`/api/interview-slots/my-slots?userId=${effectiveUserId}`);
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
      
      const data = await apiRequest('/api/interview-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: slotData.start_time,
          end_time: slotData.end_time,
          duration_minutes: slotData.duration_minutes,
          interview_type: slotData.interview_type,
          video_link: slotData.video_link,
          location: slotData.location,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          max_bookings: slotData.max_bookings || 1,
          createdBy: effectiveUserId
        })
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to create slot');
      }
      
      await fetchSlots();
    } catch (error: any) {
      setCreateLoading(false);
      throw error;
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
        throw new Error(data.message || 'Failed to delete slot');
      }
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      throw error;
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
