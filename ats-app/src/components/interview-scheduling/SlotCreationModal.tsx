import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SlotCreationModalProps {
  jobId: string;
  stageId: string;
  stageName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SlotCreationModal: React.FC<SlotCreationModalProps> = ({
  jobId,
  stageId,
  stageName,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    durationMinutes: 60,
    breakMinutes: 15,
    interviewType: 'video' as 'phone' | 'video' | 'onsite',
    videoLink: '',
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    maxBookings: 1,
    bufferBefore: 15,
    bufferAfter: 15,
    excludeWeekends: true
  });

  const [previewSlots, setPreviewSlots] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setShowPreview(false);
    setError('');
  };

  const validateForm = () => {
    if (!formData.startDate || !formData.endDate) {
      setError('Please select start and end dates');
      return false;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('Start date must be before end date');
      return false;
    }
    if (formData.interviewType === 'video' && !formData.videoLink) {
      setError('Please provide a video conference link');
      return false;
    }
    if (formData.interviewType === 'onsite' && !formData.location) {
      setError('Please provide a location for onsite interview');
      return false;
    }
    return true;
  };

  const generatePreview = () => {
    if (!validateForm()) return;

    const slots = [];
    const current = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      
      if (formData.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);

      const dayStart = new Date(current);
      dayStart.setHours(startHour, startMinute, 0, 0);

      const dayEnd = new Date(current);
      dayEnd.setHours(endHour, endMinute, 0, 0);

      let slotStart = new Date(dayStart);
      while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + formData.durationMinutes * 60000);
        
        if (slotEnd <= dayEnd) {
          slots.push({
            start_time: slotStart.toISOString(),
            end_time: slotEnd.toISOString(),
            display: {
              date: slotStart.toLocaleDateString(),
              time: slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          });
        }

        slotStart = new Date(slotEnd.getTime() + formData.breakMinutes * 60000);
      }

      current.setDate(current.getDate() + 1);
    }

    setPreviewSlots(slots);
    setShowPreview(true);
  };

  const handleCreateSlots = async () => {
    if (!validateForm()) return;

    if (!user || !user.id) {
      setError('You must be logged in to create interview slots');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const excludeDays = formData.excludeWeekends ? [0, 6] : [];

      const response = await fetch(`/api/jobs/${jobId}/stages/${stageId}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotConfig: {
            startDate: formData.startDate,
            endDate: formData.endDate,
            startTime: formData.startTime,
            endTime: formData.endTime,
            durationMinutes: formData.durationMinutes,
            breakMinutes: formData.breakMinutes,
            excludeDays
          },
          interviewType: formData.interviewType,
          videoLink: formData.videoLink || null,
          location: formData.location || null,
          timezone: formData.timezone,
          maxBookings: formData.maxBookings,
          bufferBefore: formData.bufferBefore,
          bufferAfter: formData.bufferAfter,
          createdBy: user.id
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create slots');
      }

      await response.json();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Create Interview Slots</h2>
              <p className="text-gray-400 mt-1">Stage: {stageName}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-4 py-2 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-4 py-2 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="w-full px-4 py-2 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className="w-full px-4 py-2 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes) *
              </label>
              <select
                value={formData.durationMinutes}
                onChange={(e) => handleInputChange('durationMinutes', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Break (minutes)
              </label>
              <select
                value={formData.breakMinutes}
                onChange={(e) => handleInputChange('breakMinutes', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value={0}>No break</option>
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Bookings
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.maxBookings}
                onChange={(e) => handleInputChange('maxBookings', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Interview Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['video', 'phone', 'onsite'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleInputChange('interviewType', type)}
                  className={`px-4 py-3 rounded-lg border ${
                    formData.interviewType === type
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-[#0f0f1e] border-gray-700 text-gray-300 hover:border-purple-500'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {formData.interviewType === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video Conference Link *
              </label>
              <input
                type="url"
                value={formData.videoLink}
                onChange={(e) => handleInputChange('videoLink', e.target.value)}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                className="w-full px-4 py-2 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {formData.interviewType === 'onsite' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Office address or meeting room"
                className="w-full px-4 py-2 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="excludeWeekends"
              checked={formData.excludeWeekends}
              onChange={(e) => handleInputChange('excludeWeekends', e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-[#0f0f1e] border-gray-700 rounded focus:ring-purple-500"
            />
            <label htmlFor="excludeWeekends" className="ml-2 text-sm text-gray-300">
              Exclude weekends (Saturday & Sunday)
            </label>
          </div>

          {showPreview && previewSlots.length > 0 && (
            <div className="bg-[#0f0f1e] border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Preview: {previewSlots.length} slots will be created
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {previewSlots.slice(0, 10).map((slot, index) => (
                  <div key={index} className="text-sm text-gray-400 flex justify-between">
                    <span>{slot.display.date}</span>
                    <span>{slot.display.time}</span>
                  </div>
                ))}
                {previewSlots.length > 10 && (
                  <div className="text-sm text-gray-500 text-center pt-2">
                    ... and {previewSlots.length - 10} more slots
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={generatePreview}
            disabled={loading}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Preview Slots
          </button>
          <button
            onClick={handleCreateSlots}
            disabled={loading || !showPreview}
            className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : `Create ${previewSlots.length} Slots`}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
