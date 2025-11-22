import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { db } from "../db";

export const saveConversationStateTool = tool(
  "save_conversation_state",
  "Guarda el estado actual de la conversación con el usuario",
  {
    phone_number: z.string().describe("Número de WhatsApp del usuario"),
    current_intent: z
      .string()
      .optional()
      .describe("Intención actual de la conversación"),
    conversation_state: z
      .record(z.string(), z.any())
      .optional()
      .describe("Estado de la conversación"),
  },
  async (params) => {
    const { phone_number, current_intent, conversation_state } = params;

    await db.exec`
      INSERT INTO conversations (phone_number, current_intent, conversation_state, last_message_at)
      VALUES (
        ${phone_number},
        ${current_intent || null},
        ${JSON.stringify(conversation_state || {})},
        NOW()
      )
      ON CONFLICT (phone_number) DO UPDATE SET
        current_intent = ${current_intent || null},
        conversation_state = ${JSON.stringify(conversation_state || {})},
        last_message_at = NOW()
    `;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: "Estado de conversación guardado",
          }),
        },
      ],
    };
  }
);
