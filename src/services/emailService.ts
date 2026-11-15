export interface SendEmailOptions {
  to: string;
  recipientName: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  category: 'medication_reminder' | 'overdue_alert' | 'appointment_reminder';
}

export interface SendEmailResult {
  success: boolean;
  status: 'sent' | 'simulated_no_provider' | 'failed';
  messageId?: string;
  error?: string;
}

/**
 * Clean Email Provider Abstraction.
 * In production, integrates with SendGrid, Resend, or Google Cloud Functions / Cloud Tasks.
 * Requires environment configuration:
 * - VITE_SENDGRID_API_KEY or VITE_EMAIL_API_URL
 * When unconfigured, safely records status 'simulated_no_provider' with full diagnostic trace
 * rather than falsely claiming live SMTP delivery.
 */
export async function sendTransactionalEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const apiKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SENDGRID_API_KEY || '';
  const apiUrl = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_EMAIL_API_URL || '';

  // If a live webhook or email provider endpoint is configured:
  if (apiUrl) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Email provider HTTP error:', response.status, errorText);
        return {
          success: false,
          status: 'failed',
          error: `Provider HTTP ${response.status}: ${errorText}`,
        };
      }

      const resData = await response.json().catch(() => ({}));
      return {
        success: true,
        status: 'sent',
        messageId: resData.id || `msg_${Date.now()}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Email delivery network failure:', msg);
      return {
        success: false,
        status: 'failed',
        error: msg,
      };
    }
  }

  // If no external provider API is configured:
  // Observable simulation without faking: logs clearly to console and returns 'simulated_no_provider'
  console.info(
    `[Sahaara Email Service] Provider not configured. Simulated dispatch to: ${options.to} (${options.subject})`
  );

  return {
    success: true,
    status: 'simulated_no_provider',
    messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
}
