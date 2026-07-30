// Helper module for instant WhatsApp and LINE notifications for Room Booking System

import { RoomBooking } from "../types";

export interface SocialNotifyConfig {
  whatsappEnabled: boolean;
  whatsappAdminPhone: string; // e.g. "8562055555555" or "+856 20 5555 5555"
  lineEnabled: boolean;
  lineNotifyToken: string; // LINE Notify access token
  autoTriggerOnBooking: boolean; // Auto open/send on new booking creation
}

const DEFAULT_CONFIG: SocialNotifyConfig = {
  whatsappEnabled: true,
  whatsappAdminPhone: "8562055555555", // Admin Phone
  lineEnabled: true,
  lineNotifyToken: "",
  autoTriggerOnBooking: true
};

export function getSocialNotifyConfig(): SocialNotifyConfig {
  try {
    const stored = localStorage.getItem("eoffice_social_notify_config");
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed loading social notify config:", e);
  }
  return DEFAULT_CONFIG;
}

export function saveSocialNotifyConfig(config: SocialNotifyConfig) {
  try {
    localStorage.setItem("eoffice_social_notify_config", JSON.stringify(config));
  } catch (e) {
    console.error("Failed saving social notify config:", e);
  }
}

/**
 * Format clean phone number for WhatsApp API (e.g. 020 5555 5555 -> 8562055555555)
 */
export function formatWhatsAppPhone(phone: string): string {
  let cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.startsWith("020")) {
    cleaned = "85620" + cleaned.slice(3);
  } else if (cleaned.startsWith("20") && cleaned.length === 10) {
    cleaned = "856" + cleaned;
  } else if (!cleaned.startsWith("856") && cleaned.length === 8) {
    cleaned = "85620" + cleaned;
  }
  return cleaned;
}

/**
 * Generates Lao formatted text message for WhatsApp and LINE
 */
export function formatBookingNotificationMessage(booking: RoomBooking): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://eoffice.gov.la";
  const endDateStr = booking.endDate && booking.endDate !== booking.date ? ` ຫາ ${booking.endDate}` : '';
  
  return [
    `🏛️ *[E-Office ຫ້ອງວ່າການແຂວງຫົວພັນ]*`,
    `📌 *ແຈ້ງເຕືອນ: ມີຄຳຮ້ອງຂໍຈອງຫ້ອງປະຊຸມໃໝ່!*`,
    ``,
    `🏢 *ຫ້ອງປະຊຸມ:* ${booking.roomName}`,
    `📝 *ຫົວຂໍ້:* ${booking.title}`,
    `📅 *ວັນທີ:* ${booking.date}${endDateStr}`,
    `⏰ *ເວລາ:* ${booking.startTime} ຫາ ${booking.endTime}`,
    `👤 *ຜູ້ຍື່ນຈອງ:* ${booking.userName} (${booking.department || "ທົ່ວໄປ"})`,
    `📞 *ເບີໂທ:* ${booking.notes || "ບໍ່ມີ"}`,
    `👥 *ຈຳນວນ:* ${booking.attendeesCount} ທ່ານ`,
    booking.purpose ? `🎯 *ຈຸດປະສົງ:* ${booking.purpose}` : '',
    ``,
    `👉 *ເຂົ້າຕິດຕາມ & ອະນຸມັດການຈອງ:*`,
    `${origin}`
  ].filter(Boolean).join("\n");
}

/**
 * Generates WhatsApp click-to-chat URL
 */
export function getWhatsAppShareUrl(phone: string, text: string): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Generates LINE share message URL
 */
export function getLineShareUrl(text: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
}

/**
 * Open WhatsApp alert directly in a new tab/app window
 */
export function triggerWhatsAppAlert(booking: RoomBooking, customPhone?: string): boolean {
  const config = getSocialNotifyConfig();
  const phone = customPhone || config.whatsappAdminPhone || "8562055555555";
  const message = formatBookingNotificationMessage(booking);
  const url = getWhatsAppShareUrl(phone, message);

  if (typeof window !== "undefined") {
    window.open(url, "_blank");
    return true;
  }
  return false;
}

/**
 * Open LINE alert directly in a new tab/app window
 */
export function triggerLineAlert(booking: RoomBooking): boolean {
  const message = formatBookingNotificationMessage(booking);
  const url = getLineShareUrl(message);

  if (typeof window !== "undefined") {
    window.open(url, "_blank");
    return true;
  }
  return false;
}

/**
 * Sends LINE Notify message via HTTP POST (if LINE Notify token is configured)
 */
export async function sendLineNotifyApi(token: string, message: string): Promise<{ success: boolean; error?: string }> {
  if (!token) {
    return { success: false, error: "No LINE Notify token provided" };
  }

  try {
    // Note: LINE Notify API requires CORS proxy or direct server call.
    // We attempt fetch and fallback cleanly to LINE Share if CORS blocks.
    const response = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${token}`
      },
      body: new URLSearchParams({ message })
    });

    if (response.ok) {
      return { success: true };
    } else {
      const err = await response.text();
      return { success: false, error: err || `HTTP ${response.status}` };
    }
  } catch (e: any) {
    console.warn("LINE Notify API call failed (CORS or network):", e);
    return { success: false, error: e.message || "Network error" };
  }
}
