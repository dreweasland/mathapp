export interface Email {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type Mailer = (email: Email) => Promise<void>;

/** Sends through Resend (https://resend.com). `from` must be on a domain verified there. */
export function resendMailer(apiKey: string, from: string, send: typeof fetch = fetch): Mailer {
  return async ({ to, subject, text, html }) => {
    const response = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
    });
    if (!response.ok) {
      throw new Error(`Resend refused the email: ${response.status} ${await response.text()}`);
    }
  };
}

/** For `wrangler dev`: prints the email instead of sending it. */
export const logMailer: Mailer = async (email) => {
  console.log(`[mail to ${email.to}] ${email.subject}\n${email.text}`);
};
