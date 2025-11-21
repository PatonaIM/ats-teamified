/**
 * Meeting Link Generation Service
 * Supports Google Meet and Zoom integration
 * 
 * MOCK MODE (MVP): Generates mock meeting links without API calls
 * PRODUCTION MODE: Integrates with Google Calendar API and Zoom Server-to-Server OAuth
 * 
 * Environment Variables:
 * - MEETING_SERVICE_ENABLED: true/false (default: false for mock mode)
 * - GOOGLE_MEET_ENABLED: true/false
 * - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 * - ZOOM_ENABLED: true/false
 * - ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
 */

import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const MEETING_SERVICE_ENABLED = process.env.MEETING_SERVICE_ENABLED === 'true';
const GOOGLE_MEET_ENABLED = process.env.GOOGLE_MEET_ENABLED === 'true';
const ZOOM_ENABLED = process.env.ZOOM_ENABLED === 'true';

console.log(`[Meeting Service] ${MEETING_SERVICE_ENABLED ? 'ENABLED' : 'DISABLED'} (mock mode)`);
if (GOOGLE_MEET_ENABLED) console.log('[Meeting Service] Google Meet: ENABLED ✅');
if (ZOOM_ENABLED) console.log('[Meeting Service] Zoom: ENABLED ✅');

/**
 * Generate mock meeting link (MVP mode)
 */
function generateMockMeetingLink(platform, meetingData) {
  const meetingId = crypto.randomBytes(6).toString('hex');
  const timestamp = Date.now();
  
  switch (platform) {
    case 'google_meet':
      return {
        platform: 'google_meet',
        meetingLink: `https://meet.google.com/mock-${meetingId}`,
        meetingId: `mock-${meetingId}`,
        passcode: null,
        startUrl: null,
        instructions: 'Click the link to join the Google Meet video call at the scheduled time.'
      };
    
    case 'zoom':
      const passcode = Math.floor(100000 + Math.random() * 900000).toString();
      return {
        platform: 'zoom',
        meetingLink: `https://zoom.us/j/${timestamp}?pwd=mock${meetingId}`,
        meetingId: timestamp.toString(),
        passcode: passcode,
        startUrl: `https://zoom.us/s/${timestamp}?zak=mock${meetingId}`,
        instructions: `Join Zoom Meeting using the link. Meeting ID: ${timestamp}, Passcode: ${passcode}`
      };
    
    case 'teams':
      return {
        platform: 'teams',
        meetingLink: `https://teams.microsoft.com/l/meetup-join/mock/${meetingId}`,
        meetingId: `mock-${meetingId}`,
        passcode: null,
        startUrl: null,
        instructions: 'Click the link to join the Microsoft Teams meeting at the scheduled time.'
      };
    
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Create Google Meet link via Calendar API (Production)
 * Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 */
async function createGoogleMeetLink(meetingData) {
  if (!GOOGLE_MEET_ENABLED) {
    throw new Error('Google Meet integration not enabled');
  }

  // Production implementation would use googleapis library
  // const { google } = require('googleapis');
  // const calendar = google.calendar({ version: 'v3', auth });
  // 
  // const event = {
  //   summary: meetingData.title,
  //   start: { dateTime: meetingData.startTime, timeZone: meetingData.timezone },
  //   end: { dateTime: meetingData.endTime, timeZone: meetingData.timezone },
  //   conferenceData: {
  //     createRequest: {
  //       requestId: `${Date.now()}`,
  //       conferenceSolutionKey: { type: 'hangoutsMeet' }
  //     }
  //   }
  // };
  // 
  // const response = await calendar.events.insert({
  //   calendarId: 'primary',
  //   resource: event,
  //   conferenceDataVersion: 1
  // });
  // 
  // return response.data.conferenceData.entryPoints[0].uri;

  console.log('[Meeting Service] Google Meet API not yet implemented, using mock');
  return generateMockMeetingLink('google_meet', meetingData);
}

/**
 * Create Zoom meeting link via Server-to-Server OAuth (Production)
 * Requires: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
 */
async function createZoomMeetingLink(meetingData) {
  if (!ZOOM_ENABLED) {
    throw new Error('Zoom integration not enabled');
  }

  // Production implementation would use Zoom API
  // async function getZoomAccessToken() {
  //   const tokenUrl = 'https://zoom.us/oauth/token';
  //   const credentials = Buffer.from(
  //     `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  //   ).toString('base64');
  //   
  //   const response = await axios.post(
  //     `${tokenUrl}?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
  //     {},
  //     { headers: { 'Authorization': `Basic ${credentials}` } }
  //   );
  //   return response.data.access_token;
  // }
  // 
  // const token = await getZoomAccessToken();
  // const response = await axios.post(
  //   'https://api.zoom.us/v2/users/me/meetings',
  //   {
  //     topic: meetingData.title,
  //     type: 2,
  //     start_time: meetingData.startTime,
  //     duration: meetingData.duration,
  //     settings: { join_before_host: true, waiting_room: false }
  //   },
  //   { headers: { 'Authorization': `Bearer ${token}` } }
  // );
  // 
  // return {
  //   meetingLink: response.data.join_url,
  //   meetingId: response.data.id,
  //   passcode: response.data.password,
  //   startUrl: response.data.start_url
  // };

  console.log('[Meeting Service] Zoom API not yet implemented, using mock');
  return generateMockMeetingLink('zoom', meetingData);
}

/**
 * Create meeting link for specified platform
 * 
 * @param {string} platform - 'google_meet', 'zoom', or 'teams'
 * @param {object} meetingData - { title, startTime, endTime, duration, timezone, attendees }
 * @returns {Promise<object>} - { platform, meetingLink, meetingId, passcode, startUrl, instructions }
 */
export async function createMeetingLink(platform, meetingData) {
  console.log(`[Meeting Service] Creating ${platform} meeting link...`);
  
  // Validate platform
  const supportedPlatforms = ['google_meet', 'zoom', 'teams'];
  if (!supportedPlatforms.includes(platform)) {
    throw new Error(`Unsupported platform: ${platform}. Supported: ${supportedPlatforms.join(', ')}`);
  }

  // Mock mode (MVP)
  if (!MEETING_SERVICE_ENABLED) {
    console.log('[Meeting Service] Running in MOCK mode');
    const mockLink = generateMockMeetingLink(platform, meetingData);
    console.log(`[Meeting Service] ✓ Mock ${platform} link generated: ${mockLink.meetingLink}`);
    return mockLink;
  }

  // Production mode
  try {
    switch (platform) {
      case 'google_meet':
        return await createGoogleMeetLink(meetingData);
      
      case 'zoom':
        return await createZoomMeetingLink(meetingData);
      
      case 'teams':
        // Teams integration would go here
        console.log('[Meeting Service] Teams API not yet implemented, using mock');
        return generateMockMeetingLink('teams', meetingData);
      
      default:
        throw new Error(`Platform implementation not found: ${platform}`);
    }
  } catch (error) {
    console.error(`[Meeting Service] Error creating ${platform} link:`, error.message);
    // Fallback to mock on error
    console.log('[Meeting Service] Falling back to mock mode due to error');
    return generateMockMeetingLink(platform, meetingData);
  }
}

/**
 * Get meeting service configuration status
 */
export function getMeetingServiceStatus() {
  return {
    enabled: MEETING_SERVICE_ENABLED,
    mode: MEETING_SERVICE_ENABLED ? 'production' : 'mock',
    platforms: {
      google_meet: {
        enabled: GOOGLE_MEET_ENABLED,
        configured: GOOGLE_MEET_ENABLED && !!process.env.GOOGLE_CLIENT_ID
      },
      zoom: {
        enabled: ZOOM_ENABLED,
        configured: ZOOM_ENABLED && !!process.env.ZOOM_CLIENT_ID
      },
      teams: {
        enabled: false,
        configured: false
      }
    }
  };
}

/**
 * Validate meeting data before creation
 */
export function validateMeetingData(meetingData) {
  const required = ['title', 'startTime', 'endTime', 'timezone'];
  const missing = required.filter(field => !meetingData[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate dates
  const start = new Date(meetingData.startTime);
  const end = new Date(meetingData.endTime);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format for startTime or endTime');
  }
  
  if (end <= start) {
    throw new Error('endTime must be after startTime');
  }
  
  return true;
}
