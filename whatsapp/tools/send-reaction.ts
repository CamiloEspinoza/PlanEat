import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { sendReaction } from "../whatsapp-client";

export const sendReactionTool = tool(
  "send_reaction",
  "OPCIONAL: Envía una reacción emoji a un mensaje del usuario solo cuando sea especialmente apropiado. Úsala para momentos emotivos, celebraciones o feedback muy positivo. NO uses en cada mensaje.",
  {
    to: z.string().describe("Número de WhatsApp del destinatario"),
    message_id: z.string().describe("ID del mensaje al que reaccionar (del último mensaje recibido)"),
    emoji: z.enum(["👍", "❤️", "😊", "🎉", "👏", "🙌", "💪", "😋", "🤗", "✨"]).describe(
      "Emoji para reaccionar: 👍 (aprobación), ❤️ (amor/apoyo), 😊 (alegría), 🎉 (celebración), 👏 (aplauso), 🙌 (emoción), 💪 (motivación), 😋 (comida deliciosa), 🤗 (abrazo), ✨ (especial)"
    ),
  },
  async ({ to, message_id, emoji }) => {
    console.log("🎭 TOOL CALLED: send_reaction");
    console.log(`   To: ${to}`);
    console.log(`   Message ID: ${message_id}`);
    console.log(`   Emoji: ${emoji}`);

    try {
      await sendReaction(to, message_id, emoji);
      console.log(`✅ Reaction ${emoji} sent successfully`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              message: `Reacción ${emoji} enviada a ${to}`,
            }),
          },
        ],
      };
    } catch (error: any) {
      console.error("❌ Error sending reaction:", error);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: false, error: error.message }),
          },
        ],
      };
    }
  }
);

