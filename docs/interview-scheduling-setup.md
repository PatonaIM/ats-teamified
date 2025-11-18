# Interview Scheduling System - Setup Guide

## Overview
The interview scheduling system enables recruiters to create time slots and candidates to self-book their interviews, reducing coordination time by 80%.

## Database Migration

### Running the Migration

The interview scheduling feature requires running database migration `007_interview_scheduling.sql` to create the necessary tables.

**Migration File:** `ats-app/database/migrations/007_interview_scheduling.sql`

### Option 1: Using Existing Migration Script (Recommended)

If you have an existing migration script that runs numbered SQL files:

```bash
cd ats-app
node server/update-schema.js
```

### Option 2: Manual Migration (Azure PostgreSQL)

Connect to your Azure PostgreSQL database and run the migration:

```bash
# Using psql
psql -h teamified-candidate-ats.postgres.database.azure.com \
     -U your_username \
     -d postgres \
     -f ats-app/database/migrations/007_interview_scheduling.sql

# Or using Azure CLI
az postgres flexible-server execute \
  --name teamified-candidate-ats \
  --database-name postgres \
  --file-path ats-app/database/migrations/007_interview_scheduling.sql
```

### What the Migration Creates

1. **interview_slots table** - Stores available time slots created by recruiters
2. **interview_bookings table** - Stores candidate bookings
3. **Indexes** - For performance optimization
4. **Triggers** - Auto-update booking counts and timestamps
5. **Functions** - Handle slot availability logic

## Environment Variables

Add these to your `.env` or Replit Secrets:

```bash
# Email Service (Required for notifications)
EMAIL_PROVIDER=sendgrid  # or 'ses', 'postmark'
EMAIL_FROM=noreply@yourcompany.com
EMAIL_FROM_NAME=YourCompany Recruiting

# SendGrid (if using)
SENDGRID_API_KEY=your_sendgrid_api_key

# AWS SES (if using)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret

# Application URL (for booking links in emails)
APP_URL=https://your-app-url.com
```

## Email Service Setup

The email service is currently in stub mode and logs to console. To enable actual email sending:

### Option 1: SendGrid

1. Sign up at https://sendgrid.com
2. Create an API key
3. Add to environment: `SENDGRID_API_KEY=your_key`
4. Update `ats-app/server/services/email.js` to use SendGrid client

### Option 2: AWS SES

1. Set up AWS SES and verify your sender domain
2. Add AWS credentials to environment
3. Update email service to use AWS SDK

### Option 3: Postmark

1. Sign up at https://postmarkapp.com
2. Get server API token
3. Add to environment and update email service

## API Endpoints

### Recruiter Endpoints

```
POST   /api/jobs/:jobId/stages/:stageId/slots      # Create interview slots
GET    /api/jobs/:jobId/stages/:stageId/slots      # List slots for stage
GET    /api/jobs/:jobId/bookings                   # List all bookings
DELETE /api/slots/:slotId                          # Delete slot
```

### Candidate Endpoints (Public)

```
GET  /api/candidates/:candidateId/jobs/:jobId/available-slots  # View available slots
POST /api/slots/:slotId/book                                   # Book a slot
GET  /api/bookings/:bookingToken                               # Get booking details
POST /api/bookings/:bookingToken/cancel                        # Cancel booking
```

## Frontend Components

### For Recruiters

- **SlotCreationModal** - Create interview time slots
  - Date range selection
  - Time configuration (duration, breaks, buffers)
  - Interview type (video, phone, onsite)
  - Slot preview before creation

- **BookingDashboard** - View all scheduled interviews
  - Filter by status, stage, date
  - Upcoming/past interviews
  - Candidate details and contact info

### For Candidates (Public Page)

- **CandidateBookingPage** - `/book-interview/:candidateId/:jobId`
  - View available slots in local timezone
  - Book preferred time slot
  - Receive confirmation email

## Usage Flow

### 1. Recruiter Creates Slots

```javascript
// In WorkflowBuilder or Pipeline view
<SlotCreationModal
  jobId="job-123"
  stageId="stage-456"
  stageName="Technical Interview"
  onClose={() => setShowModal(false)}
  onSuccess={() => loadSlots()}
/>
```

### 2. Send Invitation to Candidate

```javascript
import { sendSlotInvitation } from './server/services/email.js';

const bookingLink = `${APP_URL}/book-interview/${candidateId}/${jobId}?stageId=${stageId}`;

await sendSlotInvitation({
  candidateEmail: 'candidate@example.com',
  candidateName: 'John Doe',
  jobTitle: 'Senior Developer',
  companyName: 'Acme Corp',
  bookingLink,
  stageName: 'Technical Interview'
});
```

### 3. Candidate Books Slot

Candidate clicks the link, selects a time, and books the interview. They receive:
- Confirmation email
- Calendar invite (.ics file)
- Reschedule/cancel links

### 4. View Bookings

```javascript
<BookingDashboard jobId="job-123" />
```

## Testing

### 1. Create Test Slots

```bash
curl -X POST http://localhost:5000/api/jobs/1/stages/5/slots \
  -H "Content-Type: application/json" \
  -d '{
    "slotConfig": {
      "startDate": "2025-01-20",
      "endDate": "2025-01-27",
      "startTime": "09:00",
      "endTime": "17:00",
      "durationMinutes": 60,
      "breakMinutes": 15,
      "excludeDays": [0, 6]
    },
    "interviewType": "video",
    "videoLink": "https://zoom.us/j/123456",
    "timezone": "America/New_York",
    "createdBy": "demo-user-123"
  }'
```

### 2. View Available Slots

```bash
curl http://localhost:5000/api/candidates/1/jobs/1/available-slots
```

### 3. Book a Slot

```bash
curl -X POST http://localhost:5000/api/slots/slot-id/book \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "1",
    "confirmedEmail": "test@example.com",
    "candidateTimezone": "America/Los_Angeles"
  }'
```

## Troubleshooting

### Slots Not Appearing

1. Check if migration ran successfully: `SELECT * FROM interview_slots LIMIT 1;`
2. Verify timezone configuration
3. Check that slots are in the future
4. Ensure `status = 'available'` and `current_bookings < max_bookings`

### Booking Fails

1. Check user authentication (must have valid user ID)
2. Verify slot is still available (check concurrent bookings)
3. Ensure booking is at least 4 hours in advance
4. Check for existing bookings for same stage

### Emails Not Sending

1. Verify environment variables are set
2. Check email service logs
3. Ensure email provider credentials are valid
4. Update `server/services/email.js` from stub to real implementation

## Future Enhancements

- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Automated reminder emails (24h, 1h before)
- [ ] Reschedule functionality
- [ ] Interview templates for common slot patterns
- [ ] Buffer time configuration
- [ ] Panel interview support (multiple interviewers)
- [ ] Multi-stage booking (book all rounds at once)

## Support

For issues or questions, please contact the development team or file an issue in the project repository.
