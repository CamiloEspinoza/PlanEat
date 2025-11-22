// Procesador principal de mensajes de WhatsApp
import { KapsoWebhookPayload } from "./types";
import { processWithClaude } from "./claude-client";

export async function processMessage(webhookData: KapsoWebhookPayload) {
  console.log("🔄 MESSAGE PROCESSOR STARTED");
  
  const { message, conversation } = webhookData;

  // Extraer datos del mensaje
  const from = conversation.phone_number;
  const messageText = message.text?.body || "";
  const messageType = message.type;

  console.log(`📱 Processing message from ${from}`);
  console.log(`📝 Message text: ${messageText}`);
  console.log(`📋 Message type: ${messageType}`);

  // Solo procesar mensajes de texto por ahora
  if (messageType !== "text") {
    console.log(`⏭️  Skipping non-text message of type: ${messageType}`);
    return;
  }

  try {
    console.log("🤖 Calling Claude...");
    // Procesar con Claude
    await processWithClaude(messageText, from);
    console.log(`✅ Message processed successfully for ${from}`);
  } catch (error) {
    console.error("❌ Error processing message:", error);
    // No enviamos mensaje de error para evitar loops
    // En producción, loguear a servicio de monitoreo
  }
}
