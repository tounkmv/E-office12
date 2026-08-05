// Helper module for instant WhatsApp notifications for Room Booking System

import { RoomBooking } from "../types";

export interface SocialNotifyConfig {
  whatsappEnabled: boolean;
  whatsappAdminPhone: string; // e.g. "02058590404" or "8562058590404"
  autoTriggerOnBooking: boolean; // Auto open/send WhatsApp alert on new booking creation
}

const DEFAULT_CONFIG: SocialNotifyConfig = {
  whatsappEnabled: true,
  whatsappAdminPhone: "02058590404", // Default Admin Phone in system
  autoTriggerOnBooking: true
};

export function getSocialNotifyConfig(): SocialNotifyConfig {
  try {
    const stored = localStorage.getItem("eoffice_social_notify_config");
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old default test numbers to admin phone 02058590404
      if (!parsed.whatsappAdminPhone || parsed.whatsappAdminPhone === "8562055555555" || parsed.whatsappAdminPhone === "856205555555") {
        parsed.whatsappAdminPhone = "02058590404";
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error("Failed loading social notify config:", e);
  }
  return DEFAULT_CONFIG;
}

export function saveSocialNotifyConfig(config: Partial<SocialNotifyConfig>) {
  try {
    const current = getSocialNotifyConfig();
    const updated = { ...current, ...config };
    localStorage.setItem("eoffice_social_notify_config", JSON.stringify(updated));
  } catch (e) {
    console.error("Failed saving social notify config:", e);
  }
}

/**
 * Format clean phone number for WhatsApp API (e.g. 020 5859 0404 -> 8562058590404)
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return "8562058590404";
  let cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.startsWith("020")) {
    cleaned = "85620" + cleaned.slice(3);
  } else if (cleaned.startsWith("20") && (cleaned.length === 10 || cleaned.length === 11)) {
    cleaned = "856" + cleaned;
  } else if (!cleaned.startsWith("856") && cleaned.length === 8) {
    cleaned = "85620" + cleaned;
  } else if (!cleaned.startsWith("856")) {
    cleaned = "856" + cleaned;
  }
  return cleaned || "8562058590404";
}

/**
 * Generates Lao formatted text message for WhatsApp
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
 * Open WhatsApp alert directly in a new tab/app window
 */
export function triggerWhatsAppAlert(booking: RoomBooking, customPhone?: string): boolean {
  const config = getSocialNotifyConfig();
  const phone = customPhone || config.whatsappAdminPhone || "02058590404";
  const message = formatBookingNotificationMessage(booking);
  const url = getWhatsAppShareUrl(phone, message);

  if (typeof window !== "undefined") {
    window.open(url, "_blank");
    return true;
  }
  return false;
}

