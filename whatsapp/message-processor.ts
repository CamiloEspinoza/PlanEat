// Procesador principal de mensajes de WhatsApp
import { query } from '@anthropic-ai/claude-agent-sdk';
import { KapsoWebhookPayload } from './types';
import { sendTextMessage } from './whatsapp-client';
import { planeatMcpServer, SYSTEM_PROMPT } from './agent';

export async function processMessage(webhookData: KapsoWebhookPayload) {
  const { message, conversation } = webhookData;
  
  // Extraer datos del mensaje
  const from = conversation.phone_number;
  const messageText = message.text?.body || '';
  const messageType = message.type;
  
  console.log(`Processing message from ${from}: ${messageText}`);
  
  // Solo procesar mensajes de texto por ahora
  if (messageType !== 'text') {
    console.log(`Skipping non-text message of type: ${messageType}`);
    return;
  }
  
  try {
    // Construir prompt con contexto
    const prompt = `Usuario: ${from}
Nueva conversación: ${webhookData.is_new_conversation ? 'Sí' : 'No'}
Mensaje: ${messageText}

Analiza el mensaje, obtén el contexto del usuario si es necesario, y responde usando send_whatsapp_message.`;
    
    // Procesar mensaje con Claude (streaming)
    // Claude automáticamente ejecutará los tools disponibles en el servidor MCP
    const queryInstance = query({
      prompt,
      options: {
        systemPrompt: SYSTEM_PROMPT,
        model: 'claude-sonnet-3-5-20250219',
        mcpServers: {
          planeat: planeatMcpServer
        }
      }
    });
    
    // Consumir el stream de mensajes
    for await (const sdkMessage of queryInstance) {
      // Los mensajes pueden ser de tipo: text, tool_use, tool_result
      if (sdkMessage.type === 'text') {
        console.log('Claude thinking:', sdkMessage.content);
      }
      // Los tool_use y tool_result se manejan automáticamente por el SDK
    }
    
    console.log(`Message processed successfully for ${from}`);
  } catch (error) {
    console.error('Error processing message:', error);
    // En caso de error crítico, enviar mensaje de fallback
    try {
      await sendTextMessage(from, 'Lo siento, tuve un problema procesando tu mensaje. Por favor intenta nuevamente.');
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

/**
 * NOTA DE PERFORMANCE:
 * Según issue #34 del repo de Claude Agent SDK TypeScript, query() tiene
 * un overhead de ~12 segundos por llamada debido a la inicialización.
 * Para producción, considerar:
 * - Mantener instancia del agente viva (singleton)
 * - Usar un pool de agentes pre-inicializados
 * - Cachear resultados de tools cuando sea posible
 */
