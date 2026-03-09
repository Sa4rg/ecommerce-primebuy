// Use empty string for same-origin requests (production/tunnel)
// Set VITE_API_BASE_URL env var for development with different origin
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// WhatsApp support number (international format without + or spaces)
export const WHATSAPP_SUPPORT = import.meta.env.VITE_WHATSAPP_SUPPORT || "584126216402";
