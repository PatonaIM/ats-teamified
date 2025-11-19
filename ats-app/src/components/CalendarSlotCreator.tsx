import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, type Event, Views, type ToolbarProps, type SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Clock, Video, MapPin, Trash2, Grid3x3, List, ChevronLeft, ChevronRight, AlertCircle, X } from 'lucide-react';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CustomToolbar = (props: ToolbarProps) => {
  const goToBack = () => {
    props.onNavigate('PREV');
  };

  const goToNext = () => {
    props.onNavigate('NEXT');
  };

  const goToToday = () => {
    props.onNavigate('TODAY');
  };

  const label = () => {
    return props.label;
  };

  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" onClick={goToToday}>
          Today
        </button>
        <button type="button" onClick={goToBack} className="flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <button type="button" onClick={goToNext} className="flex items-center justify-center">
          <ChevronRight size={20} />
        </button>
      </span>

      <span className="rbc-toolbar-label">{label()}</span>

      <span className="rbc-btn-group">
        {props.views && (props.views as string[]).map((name) => (
          <button
            key={name}
            type="button"
            className={props.view === name ? 'rbc-active' : ''}
            onClick={() => props.onView(name as any)}
          >
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </button>
        ))}
      </span>
    </div>
  );
};

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
  status: string;
}

interface CalendarSlotCreatorProps {
  existingSlots: InterviewSlot[];
  onCreateSlot: (slotData: any) => Promise<void>;
  onDeleteSlot: (slotId: string) => Promise<void>;
  loading: boolean;
}

interface CalendarEvent extends Event {
  slot?: InterviewSlot;
  isNew?: boolean;
}

export default function CalendarSlotCreator({ 
  existingSlots, 
  onCreateSlot, 
  onDeleteSlot,
  loading 
}: CalendarSlotCreatorProps) {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [interviewType, setInterviewType] = useState<'phone' | 'video' | 'onsite'>('video');
  const [videoLink, setVideoLink] = useState('');
  const [location, setLocation] = useState('');
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [alertModal, setAlertModal] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'warning' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return existingSlots.map(slot => ({
      title: `${slot.job_title} - ${slot.stage_name}`,
      start: new Date(slot.start_time),
      end: new Date(slot.end_time),
      slot,
      resource: slot
    }));
  }, [existingSlots]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setPendingSlot({
      start: slotInfo.start as Date,
      end: slotInfo.end as Date
    });
    setShowSlotModal(true);
  }, []);

  const handleCreateSlot = async () => {
    if (!pendingSlot) return;

    const durationMinutes = Math.round((pendingSlot.end.getTime() - pendingSlot.start.getTime()) / (1000 * 60));

    const slotData = {
      start_time: pendingSlot.start.toISOString(),
      end_time: pendingSlot.end.toISOString(),
      duration_minutes: durationMinutes,
      interview_type: interviewType,
      video_link: interviewType === 'video' ? videoLink : null,
      location: interviewType === 'onsite' ? location : null,
      max_bookings: 1
    };

    try {
      await onCreateSlot(slotData);
      setShowSlotModal(false);
      setPendingSlot(null);
      setVideoLink('');
      setLocation('');
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Slot Creation Failed',
        message: error?.message || 'Failed to create slot. Please try again.',
        type: 'error'
      });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Interview Slot',
      message: 'Are you sure you want to delete this slot? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, show: false });
        await onDeleteSlot(slotId);
      }
    });
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const slot = event.slot;
    if (!slot) return { style: {} };

    const isBooked = slot.current_bookings > 0;
    const isFull = slot.current_bookings >= slot.max_bookings;

    let backgroundColor = '#8096FD';
    if (isFull) {
      backgroundColor = '#A16AE8';
    } else if (isBooked) {
      backgroundColor = '#6B7FFF';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        fontSize: '0.875rem',
        padding: '4px 8px',
        opacity: 0.9
      }
    };
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: format(date, 'MMM dd, yyyy'),
      time: format(date, 'HH:mm')
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              view === 'calendar'
                ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Grid3x3 size={16} />
            Calendar View
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              view === 'list'
                ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <List size={16} />
            List View
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Click and drag on the calendar to create interview slots. Your slots will be visible to candidates for booking.
            </p>
          </div>
          
          <div className="calendar-container" style={{ height: '600px' }}>
            {/* @ts-ignore - react-big-calendar has React 18 type incompatibility */}
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={(event: any) => {
                if (event.slot) {
                  if (event.slot.current_bookings > 0) {
                    setAlertModal({
                      show: true,
                      title: 'Cannot Delete Slot',
                      message: `Cannot delete this slot - it has ${event.slot.current_bookings} booking(s).`,
                      type: 'warning'
                    });
                  } else {
                    handleDeleteSlot(event.slot.id);
                  }
                }
              }}
              eventPropGetter={eventStyleGetter}
              step={15}
              timeslots={4}
              defaultView={Views.WEEK}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              components={{
                toolbar: CustomToolbar
              }}
              style={{ height: '100%' }}
            />
          </div>        </div>
      ) : (
        <div className="space-y-4">
          {existingSlots.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No interview slots yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Switch to calendar view and drag to create your first slot
              </p>
            </div>
          ) : (
            existingSlots.map(slot => (
              <div
                key={slot.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transition-all"
              >
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
                        <CalendarIcon size={14} />
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
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title={slot.current_bookings > 0 ? 'Cannot delete slot with bookings' : 'Delete slot'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showSlotModal && pendingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Confirm Interview Slot
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Date & Time:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {format(pendingSlot.start, 'MMM dd, yyyy')}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  {format(pendingSlot.start, 'HH:mm')} - {format(pendingSlot.end, 'HH:mm')}
                </p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {Math.round((pendingSlot.end.getTime() - pendingSlot.start.getTime()) / (1000 * 60))} minutes
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interview Type
              </label>
              <div className="flex gap-2">
                {(['phone', 'video', 'onsite'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setInterviewType(type)}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                      interviewType === type
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-500'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {interviewType === 'video' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video Link
                </label>
                <input
                  type="url"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}

            {interviewType === 'onsite' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter office address"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowSlotModal(false);
                  setPendingSlot(null);
                  setVideoLink('');
                  setLocation('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSlot}
                disabled={loading || (interviewType === 'video' && !videoLink) || (interviewType === 'onsite' && !location)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:from-purple-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Creating...' : 'Create Slot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {alertModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setAlertModal({ ...alertModal, show: false })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-2 rounded-full ${
                alertModal.type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                alertModal.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <AlertCircle className={`${
                  alertModal.type === 'error' ? 'text-red-600 dark:text-red-400' :
                  alertModal.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-blue-600 dark:text-blue-400'
                }`} size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {alertModal.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {alertModal.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setAlertModal({ ...alertModal, show: false })}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {confirmModal.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {confirmModal.message}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
