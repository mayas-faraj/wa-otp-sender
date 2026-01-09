import qrcode from "qrcode-terminal";
import { createRequire } from "node:module";
import type { Client as WWebClient } from "whatsapp-web.js";
import type { WhatsAppOtpSenderOptions } from "./types.js";

// ESM-safe way to load a CommonJS package:
const require = createRequire(import.meta.url);
const wwebjs = require("whatsapp-web.js") as typeof import("whatsapp-web.js");
const { Client, LocalAuth } = wwebjs;

/**
 * Creates a WhatsApp client with LocalAuth persistence.
 * Uses console.log for simplicity.
 */
export function createWhatsAppClient(opts: WhatsAppOtpSenderOptions): {
  client: WWebClient;
} {
  // IMPORTANT: With "exactOptionalPropertyTypes: true", do NOT pass `clientId: undefined`.
  // Omit it entirely when not provided.
  const authOptions: { clientId?: string; dataPath?: string } = {};

  if (opts.clientId) authOptions.clientId = opts.clientId;
  authOptions.dataPath = opts.authDataPath ?? "./.wwebjs_auth/";

  const client = new Client({
    authStrategy: new LocalAuth(authOptions),
    puppeteer: {
      headless: opts.puppeteer?.headless ?? true,
      executablePath: opts.puppeteer?.executablePath,
      args: opts.puppeteer?.args ?? [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    },
  }) as WWebClient;

  client.on("qr", (qr: string) => {
    console.log("[wa-otp] QR received. Scan it with WhatsApp on your phone.");
    qrcode.generate(qr, { small: true });
  });

  client.on("authenticated", () => console.log("[wa-otp] authenticated"));
  client.on("ready", () => console.log("[wa-otp] ready"));
  client.on("auth_failure", (msg: string) =>
    console.log("[wa-otp] auth_failure:", msg)
  );
  client.on("disconnected", (reason: string) =>
    console.log("[wa-otp] disconnected:", reason)
  );

  return { client };
}
