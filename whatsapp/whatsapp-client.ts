// Cliente de WhatsApp usando SDK oficial de Kapso
// https://docs.kapso.ai/docs/whatsapp/typescript-sdk/introduction

import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';
import { KAPSO_API_KEY, KAPSO_PHONE_NUMBER_ID } from './secrets';

let whatsappClient: WhatsAppClient | null = null;

export function getWhatsAppClient(): WhatsAppClient {
  if (!whatsappClient) {
    whatsappClient = new WhatsAppClient({ 
      baseUrl: 'https://app.kapso.ai/api/meta/',
      kapsoApiKey: KAPSO_API_KEY()
    });
  }
  return whatsappClient;
}

// Helper para enviar mensajes de texto
export async function sendTextMessage(to: string, body: string) {
  const client = getWhatsAppClient();
  return await client.messages.sendText({ 
    phoneNumberId: KAPSO_PHONE_NUMBER_ID(),
    to, 
    body 
  });
}

// Helper para mensajes interactivos con botones
export async function sendInteractiveMessage(
  to: string, 
  bodyText: string, 
  buttons: Array<{id: string, title: string}>
) {
  const client = getWhatsAppClient();
  return await client.messages.sendInteractive({ 
    phoneNumberId: KAPSO_PHONE_NUMBER_ID(),
    to,
    type: 'button',
    body: { text: bodyText },
    action: {
      buttons: buttons.map(btn => ({
        type: 'reply',
        reply: { id: btn.id, title: btn.title }
      }))
    }
  });
}

