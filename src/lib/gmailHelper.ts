// Gmail API Helper module for sending real emails via Google Workspace Gmail API

let cachedAccessToken: string | null = null;

// Try to restore token from sessionStorage if present
try {
  const stored = sessionStorage.getItem("eoffice_google_access_token");
  if (stored) {
    cachedAccessToken = stored;
  }
} catch (e) {
  // Ignore SSR or storage error
}

export function setGoogleAccessToken(token: string | null) {
  cachedAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem("eoffice_google_access_token", token);
    } else {
      sessionStorage.removeItem("eoffice_google_access_token");
    }
  } catch (e) {
    // Ignore storage error
  }
}

export function getGoogleAccessToken(): string | null {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    return sessionStorage.getItem("eoffice_google_access_token");
  } catch (e) {
    return null;
  }
}

/**
 * Creates a base64url encoded RFC 2822 / 822 formatted message string with UTF-8 support
 */
function makeRawEmail(to: string, subject: string, messageHtml: string): string {
  // Encode subject properly in UTF-8 base64 mime header
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  
  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    messageHtml
  ];

  const fullEmail = emailLines.join("\r\n");

  // Convert to Base64Url
  return btoa(unescape(encodeURIComponent(fullEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends a real email using the Google Gmail API REST Endpoint
 */
export async function sendRealGmailMessage(
  to: string, 
  subject: string, 
  bodyHtml: string, 
  tokenOverride?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = tokenOverride || getGoogleAccessToken();

  if (!token) {
    console.warn("Gmail API: No access token available. Please sign in with Google.");
    return { success: false, error: "No Google Access Token available. Please connect Google Account." };
  }

  try {
    const raw = makeRawEmail(to, subject, bodyHtml);

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `Gmail API error HTTP ${response.status}`;
      console.error("Gmail API Send Failed:", errMsg);
      return { success: false, error: errMsg };
    }

    const data = await response.json();
    console.log("Real Gmail message sent successfully! Message ID:", data.id);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error("Error executing Gmail API fetch:", err);
    return { success: false, error: err.message || "Failed to send email via Gmail API" };
  }
}
