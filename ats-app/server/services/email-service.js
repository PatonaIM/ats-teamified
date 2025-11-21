/**
 * Email Service - SendGrid Integration
 * Handles sending transactional emails for interview scheduling
 * 
 * MOCK MODE: Set SENDGRID_ENABLED=false to log emails instead of sending
 * PRODUCTION: Set SENDGRID_ENABLED=true and provide SENDGRID_API_KEY
 */

import dotenv from 'dotenv';
dotenv.config();

const SENDGRID_ENABLED = process.env.SENDGRID_ENABLED === 'true';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ats-system.com';
const FROM_NAME = process.env.FROM_NAME || 'ATS Interview Scheduler';

// Initialize SendGrid client (only in production mode)
let sgMail = null;
if (SENDGRID_ENABLED) {
  try {
    const sendgridModule = await import('@sendgrid/mail');
    sgMail = sendgridModule.default;
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('[Email Service] SendGrid ENABLED ✅');
  } catch (error) {
    console.error('[Email Service] Failed to load SendGrid:', error.message);
    console.log('[Email Service] Falling back to MOCK mode');
  }
} else {
  console.log('[Email Service] SendGrid DISABLED (mock mode)');
}

/**
 * Generate slot selection email HTML template
 */
function generateSlotSelectionEmail(candidateName, interviewerName, jobTitle, selectionUrl, availableSlots) {
  const slotsListHTML = availableSlots.map(slot => `
    <li style="margin-bottom: 10px;">
      <strong>${new Date(slot.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong><br>
      ${new Date(slot.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: slot.timezone })} - 
      ${new Date(slot.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: slot.timezone })} 
      (${slot.timezone})
    </li>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Scheduling - Select Your Time Slot</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #A16AE8 0%, #8096FD 100%);">
  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #A16AE8; margin: 0; font-size: 28px; font-weight: 700;">Interview Scheduling</h1>
      <p style="color: #666; margin-top: 10px; font-size: 14px;">Select your preferred interview time</p>
    </div>

    <div style="background: linear-gradient(135deg, #f8f5ff 0%, #f0f4ff 100%); border-left: 4px solid #A16AE8; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0 0 10px 0; color: #333;">Hi <strong>${candidateName}</strong>,</p>
      <p style="margin: 0; color: #555;">
        Congratulations on progressing to the next stage! <strong>${interviewerName}</strong> would like to schedule an interview with you for the <strong>${jobTitle}</strong> position.
      </p>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Available Time Slots:</h3>
      <ul style="list-style: none; padding: 0; color: #555;">
        ${slotsListHTML}
      </ul>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${selectionUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #A16AE8 0%, #8096FD 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(161, 106, 232, 0.3);">
        Select Your Interview Slot
      </a>
    </div>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <p style="color: #888; font-size: 13px; margin: 5px 0;">
        <strong>Important:</strong> Please select your preferred time slot within 48 hours. If you have any questions or need to reschedule, please contact us directly.
      </p>
      <p style="color: #888; font-size: 12px; margin-top: 15px;">
        This is an automated message from the ATS Interview Scheduling System. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate interview scheduled notification email for client
 */
function generateInterviewScheduledNotification(clientName, candidateName, jobTitle, slotTime, interviewerName, meetingLink) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Scheduled Notification</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #A16AE8; margin-bottom: 20px;">Interview Scheduled</h2>
    
    <p>Hi <strong>${clientName}</strong>,</p>
    
    <p>An interview has been scheduled for the <strong>${jobTitle}</strong> position:</p>
    
    <div style="background: #f9fafb; border-left: 4px solid #8096FD; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 5px 0;"><strong>Candidate:</strong> ${candidateName}</p>
      <p style="margin: 5px 0;"><strong>Interviewer:</strong> ${interviewerName}</p>
      <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${slotTime}</p>
      ${meetingLink ? `<p style="margin: 5px 0;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #8096FD;">${meetingLink}</a></p>` : ''}
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      You can view more details in your ATS dashboard.
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Send slot selection email to candidate
 */
export async function sendSlotSelectionEmail({ to, candidateName, interviewerName, jobTitle, selectionUrl, availableSlots }) {
  const emailData = {
    to,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject: `Interview Scheduling: ${jobTitle} - Select Your Time Slot`,
    html: generateSlotSelectionEmail(candidateName, interviewerName, jobTitle, selectionUrl, availableSlots)
  };

  if (SENDGRID_ENABLED && sgMail) {
    try {
      await sgMail.send(emailData);
      console.log(`[Email Service] ✉️  Slot selection email sent to ${to}`);
      return { success: true, mode: 'production' };
    } catch (error) {
      console.error('[Email Service] SendGrid error:', error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  } else {
    // Mock mode - log email instead of sending
    console.log('\n========== MOCK EMAIL ==========');
    console.log(`To: ${to}`);
    console.log(`From: ${FROM_NAME} <${FROM_EMAIL}>`);
    console.log(`Subject: ${emailData.subject}`);
    console.log(`Selection URL: ${selectionUrl}`);
    console.log(`Available Slots: ${availableSlots.length}`);
    availableSlots.forEach((slot, index) => {
      console.log(`  ${index + 1}. ${new Date(slot.start_time).toLocaleString()} - ${new Date(slot.end_time).toLocaleTimeString()}`);
    });
    console.log('================================\n');
    
    // AUDIT TRAIL: Log mock email for compliance/debugging even when SendGrid disabled
    const auditLog = {
      timestamp: new Date().toISOString(),
      type: 'slot_selection_email',
      recipient: to,
      subject: emailData.subject,
      selectionUrl: selectionUrl,
      slotsCount: availableSlots.length,
      mode: 'mock'
    };
    console.log('[Email Service] AUDIT LOG:', JSON.stringify(auditLog));
    
    return { success: true, mode: 'mock', auditLog };
  }
}

/**
 * Send interview scheduled notification to client
 */
export async function sendInterviewScheduledNotification({ to, clientName, candidateName, jobTitle, slotTime, interviewerName, meetingLink }) {
  const emailData = {
    to,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject: `Interview Scheduled: ${candidateName} - ${jobTitle}`,
    html: generateInterviewScheduledNotification(clientName, candidateName, jobTitle, slotTime, interviewerName, meetingLink)
  };

  if (SENDGRID_ENABLED && sgMail) {
    try {
      await sgMail.send(emailData);
      console.log(`[Email Service] ✉️  Interview notification sent to ${to}`);
      return { success: true, mode: 'production' };
    } catch (error) {
      console.error('[Email Service] SendGrid error:', error.message);
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  } else {
    // Mock mode
    console.log('\n========== MOCK NOTIFICATION EMAIL ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log(`Candidate: ${candidateName}`);
    console.log(`Interviewer: ${interviewerName}`);
    console.log(`Time: ${slotTime}`);
    console.log(`Meeting Link: ${meetingLink || 'Not provided'}`);
    console.log('=============================================\n');
    
    // AUDIT TRAIL: Log mock notification for compliance/debugging
    const auditLog = {
      timestamp: new Date().toISOString(),
      type: 'interview_scheduled_notification',
      recipient: to,
      candidate: candidateName,
      interviewer: interviewerName,
      slotTime: slotTime,
      mode: 'mock'
    };
    console.log('[Email Service] AUDIT LOG:', JSON.stringify(auditLog));
    
    return { success: true, mode: 'mock', auditLog };
  }
}

/**
 * Get email service status
 */
export function getEmailServiceStatus() {
  return {
    enabled: SENDGRID_ENABLED,
    mode: SENDGRID_ENABLED ? 'production' : 'mock',
    configured: SENDGRID_ENABLED && !!SENDGRID_API_KEY
  };
}
