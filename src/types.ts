export type WhatsAppOtpSenderOptions = {
  /**
   * Optional: separate sessions if you run multiple instances.
   * If omitted, whatsapp-web.js will store auth under a default folder name.
   */
  clientId?: string;

  /**
   * Where to store WhatsApp session data (LocalAuth).
   * Default: "./.wwebjs_auth/"
   */
  authDataPath?: string;

  /**
   * Puppeteer options (useful for Linux servers).
   */
  puppeteer?: {
    headless?: boolean;
    executablePath?: string;
    args?: string[];
  };

  /**
   * Queue concurrency for sendMessage.
   * Default: 4
   */
  sendConcurrency?: number;

  /**
   * Timeout waiting for client "ready" state (ms). Default: 30_000
   */
  readyTimeoutMs?: number;

  /**
   * Message template. Use "{otp}" placeholder.
   * Default: "Your verification code is: {otp}"
   */
  template?: string;

  /**
   * Allowed OTP length
   */
  allowOtpLength?: number;
};
