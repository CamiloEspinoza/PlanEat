// Endpoints de WhatsApp para PlanEat
import { api } from "encore.dev/api";
import { processMessage } from "./message-processor";
import { json } from "node:stream/consumers";
import { KapsoWebhookPayload } from "./types";
import { KAPSO_PHONE_NUMBER_ID } from "./secrets";

// Endpoint raw para recibir webhooks de Kapso
// https://docs.kapso.ai/docs/platform/webhooks/event-types
export const kapsoWebhook = api.raw(
  { expose: true, path: "/webhooks/whatsapp", method: "POST" },
  async (req, resp) => {
    try {
      const body = (await json(req)) as any;

      // DEBUG: Log del webhook completo
      console.log("=== WEBHOOK RECIBIDO ===");
      console.log("Type:", body.type);
      console.log("Is batch?:", body.batch);
      console.log("Data length:", body.data?.length);

      // Kapso envía los webhooks en formato batch
      if (body.batch && body.data && Array.isArray(body.data)) {
        console.log(`📦 Processing ${body.data.length} messages in batch`);

        for (const item of body.data) {
          const webhookData = item as KapsoWebhookPayload;
          console.log("Message type:", webhookData.message?.type);
          console.log("Direction:", webhookData.message?.kapso?.direction);
          console.log("From:", webhookData.conversation?.phone_number);

          // Solo procesar mensajes entrantes (inbound)
          if (webhookData.message?.kapso?.direction === "inbound") {
            console.log("✅ Procesando mensaje inbound");
            // Procesar de forma asíncrona y responder inmediatamente
            processMessage(webhookData).catch((err) =>
              console.error("Error processing message:", err)
            );
          } else {
            console.log("⏭️  Mensaje no es inbound, ignorando");
          }
        }
      } else {
        // Formato no-batch (por si acaso)
        const webhookData = body as KapsoWebhookPayload;
        if (webhookData.message?.kapso?.direction === "inbound") {
          console.log("✅ Procesando mensaje inbound (no-batch)");
          processMessage(webhookData).catch((err) =>
            console.error("Error processing message:", err)
          );
        }
      }

      console.log("========================");

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
        phone_number_id: KAPSO_PHONE_NUMBER_ID(),
      },
      is_new_conversation: false,
      phone_number_id: KAPSO_PHONE_NUMBER_ID(),
    };

    await processMessage(mockWebhook);
    return { success: true, message: "Webhook procesado" };
  }
);
