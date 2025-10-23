export interface EmailTemplateVars {
  companyName: string;
  recipientName: string;
  actionUrl?: string;
  extraNote?: string;
}

export function agentWelcomeTemplate(vars: EmailTemplateVars) {
  const { companyName, recipientName, actionUrl } = vars;
  return `
    <div style="font-family:Arial,sans-serif;color:#333">
      <h2>Welcome to ${companyName}</h2>
      <p>Hi ${recipientName},</p>
      <p>Your agent account has been created. You can log in and start managing queries and bookings.</p>
      ${actionUrl ? `<p><a href="${actionUrl}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Go to Portal</a></p>` : ''}
      <p>Regards,<br/>${companyName} Team</p>
    </div>
  `;
}

export function clientBookingConfirmationTemplate(vars: EmailTemplateVars & { bookingRef?: string; tripSummary?: string; }) {
  const { companyName, recipientName, bookingRef, tripSummary, actionUrl, extraNote } = vars;
  return `
    <div style="font-family:Arial,sans-serif;color:#333">
      <h2>Booking Confirmed - ${companyName}</h2>
      <p>Dear ${recipientName},</p>
      <p>Your booking has been confirmed${bookingRef ? ` (Ref: ${bookingRef})` : ''}.</p>
      ${tripSummary ? `<p><strong>Trip Summary:</strong> ${tripSummary}</p>` : ''}
      ${actionUrl ? `<p><a href="${actionUrl}" style="background:#22c55e;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">View Itinerary</a></p>` : ''}
      ${extraNote ? `<p>${extraNote}</p>` : ''}
      <p>We wish you a wonderful journey!<br/>${companyName} Team</p>
    </div>
  `;
}