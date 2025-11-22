// Basado en documentación de webhooks de Kapso
// https://docs.kapso.ai/docs/platform/webhooks/event-types

export interface KapsoWebhookPayload {
  message: {
    id: string;
    timestamp: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contacts' | 'interactive';
    text?: {
      body: string;
    };
    image?: {
      caption?: string;
      id: string;
    };
    kapso: {
      direction: 'inbound' | 'outbound';
      status: string;
      processing_status: string;
      origin: string;
      has_media: boolean;
    };
  };
  conversation: {
    id: string;
    phone_number: string;
    status: string;
    phone_number_id: string;
    kapso?: {
      contact_name?: string;
      messages_count: number;
    };
  };
  is_new_conversation: boolean;
  phone_number_id: string;
}

export interface UserContext {
  exists: boolean;
  user?: {
    phone_number: string;
    display_name?: string;
  };
  household?: {
    id: number;
    role: string;
    household_size: number;
  };
}

