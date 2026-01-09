import PQueue from "p-queue";
import type { Client } from "whatsapp-web.js";
import type { WhatsAppOtpSenderOptions } from "./types.js";
import { createWhatsAppClient } from "./whatsappClient.js";
import { toWaId } from "./utils/toWaId.js";

function assertDigits(otp: string, allowedOtpLength: number) {
  if (!RegExp(`^\\d{${allowedOtpLength}}$`).test(otp)) {
    throw new Error(
      `OTP must be exactly ${allowedOtpLength} digits. Received: "${otp}"`
    );
  }
}

/**
 * High-performance WhatsApp OTP sender:
 * - One WhatsApp Web session reused across all requests
 * - Queue to control concurrency (avoid spikes / instability)
 * - Waits for "ready" before sending
 */
export class WhatsAppOtpSender {
  private readonly opts: Required<
    Pick<
      WhatsAppOtpSenderOptions,
      "readyTimeoutMs" | "sendConcurrency" | "template"
    >
  > &
    WhatsAppOtpSenderOptions;

  private readonly client: Client;
  private readonly sendQueue: PQueue;

  private initPromise: Promise<void> | null = null;
  private readyResolver: (() => void) | null = null;
  private readyPromise: Promise<void> = new Promise((resolve) => {
    this.readyResolver = resolve;
  });

  constructor(options: WhatsAppOtpSenderOptions) {
    this.opts = {
      ...options,
      sendConcurrency: options.sendConcurrency ?? 4,
      readyTimeoutMs: options.readyTimeoutMs ?? 30_000,
      template: options.template ?? "Your verification code is: {otp}",
    };

    const { client } = createWhatsAppClient(this.opts);
    this.client = client;

    this.sendQueue = new PQueue({ concurrency: this.opts.sendConcurrency });

    this.client.on("ready", () => {
      this.readyResolver?.();
      this.readyResolver = null;
    });

    // If disconnected, create a new "ready gate" so senders wait again
    this.client.on("disconnected", () => {
      this.readyPromise = new Promise((resolve) => {
        this.readyResolver = resolve;
      });
    });
  }

  /**
   * Call once at app startup (recommended).
   */
  public init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.client.initialize();
      await this.waitUntilReady(this.opts.readyTimeoutMs);
    })();

    return this.initPromise;
  }

  /**
   * Updated API: send OTP to a provided phone number (E.164 recommended).
   * Example: sendVerificationCode("1234", "+31612345678")
   */
  public async sendVerificationCode(
    otp: string,
    phoneE164: string
  ): Promise<void> {
    assertDigits(otp, this.opts.allowOtpLength ?? 4);
    const to = toWaId(phoneE164);

    await this.init();
    await this.waitUntilReady(this.opts.readyTimeoutMs);

    const message = this.opts.template.replaceAll("{otp}", otp);

    await this.sendQueue.add(async () => {
      console.log("[wa-otp] sending OTP to:", to);
      await this.client.sendMessage(to, message);
      console.log("[wa-otp] sent OTP to:", to);
    });
  }

  /**
   * Optional: graceful shutdown
   */
  public async destroy(): Promise<void> {
    await this.sendQueue.onIdle();
    await this.client.destroy();
  }

  private async waitUntilReady(timeoutMs: number): Promise<void> {
    const timeout = new Promise<never>((_, reject) => {
      const t = setTimeout(() => {
        clearTimeout(t);
        reject(new Error(`WhatsApp client not ready within ${timeoutMs}ms`));
      }, timeoutMs);
    });

    await Promise.race([this.readyPromise, timeout]);
  }
}
