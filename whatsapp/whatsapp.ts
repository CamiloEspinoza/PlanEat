// Endpoints de WhatsApp para PlanEat
import { api } from "encore.dev/api";
import { processMessage } from "./message-processor";
import { json } from "node:stream/consumers";
import { KapsoWebhookPayload } from "./types";

// Endpoint raw para recibir webhooks de Kapso
// https://docs.kapso.ai/docs/platform/webhooks/event-types
export const kapsoWebhook = api.raw(
  { expose: true, path: "/webhooks/whatsapp", method: "POST" },
  async (req, resp) => {
    try {
      const body = await json(req);

      // Solo procesar mensajes entrantes (inbound)
      if (body.message?.kapso?.direction === "inbound") {
        // Procesar de forma asíncrona y responder inmediatamente
        processMessage(body).catch((err) =>
          console.error("Error processing message:", err)
        );
      }

      // Responder rápido a Kapso para no bloquear webhook
      resp.writeHead(200);
      resp.end(JSON.stringify({ success: true }));
    } catch (error: any) {
      console.error("Webhook error:", error);
      resp.writeHead(500);
      resp.end(JSON.stringify({ error: error.message }));
    }
  }
);

// Endpoint de testing para simular webhooks
interface TestWebhookParams {
  message: string;
  from: string;
}

export const testWebhook = api(
  { expose: true, method: "POST", path: "/test/webhook" },
  async (params: TestWebhookParams) => {
    const mockWebhook: KapsoWebhookPayload = {
      message: {
        id: "test-" + Date.now(),
        timestamp: String(Math.floor(Date.now() / 1000)),
        type: "text",
        text: { body: params.message },
        kapso: {
          direction: "inbound",
          status: "received",
          processing_status: "pending",
          origin: "cloud_api",
          has_media: false,
        },
      },
      conversation: {
        id: "test-conv",
        phone_number: params.from,
        status: "active",
        phone_number_id: process.env.KAPSO_PHONE_NUMBER_ID!,
      },
      is_new_conversation: false,
      phone_number_id: process.env.KAPSO_PHONE_NUMBER_ID!,
    };

    await processMessage(mockWebhook);
    return { success: true, message: "Webhook procesado" };
  }
);
