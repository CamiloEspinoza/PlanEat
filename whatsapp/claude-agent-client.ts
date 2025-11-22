// Cliente usando Claude Agent SDK oficial
import { query, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { ANTHROPIC_API_KEY } from "./secrets";
import { db } from "./db";
import {
  sendWhatsAppMessageTool,
  getUserContextTool,
  createHouseholdTool,
  addHouseholdMembersTool,
  saveConversationStateTool,
  sendReactionTool,
} from "./tools";
import { PLANEAT_AGENTS, routerPrompt } from "./agents";

// Asegurar que el PATH incluya node para que el Agent SDK funcione
if (!process.env.PATH?.includes("/usr/local/bin")) {
  process.env.PATH = `${process.env.PATH}:/usr/local/bin:/usr/bin:/bin`;
}

// System prompt - Router Agent (imported from agents/router.ts)
const SYSTEM_PROMPT = routerPrompt;

// Crear el servidor MCP con las tools
const planeatServer = createSdkMcpServer({
  name: "planeat",
  version: "1.0.0",
  tools: [
    sendWhatsAppMessageTool,
    getUserContextTool,
    createHouseholdTool,
    addHouseholdMembersTool,
    saveConversationStateTool,
    sendReactionTool,
  ],
});

// Obtener o crear sesión para el usuario
async function getOrCreateSession(
  phoneNumber: string
): Promise<{ sessionId: string | undefined; isNew: boolean }> {
  try {
    // PRIMERO: Verificar si el usuario existe en la base de datos
    const userExists = await db.queryRow`
      SELECT phone_number FROM users WHERE phone_number = ${phoneNumber}
    `;

    // Si el usuario NO existe, SIEMPRE iniciar nueva sesión (no reanudar cache anterior)
    if (!userExists) {
      console.log("🆕 User doesn't exist - Starting fresh session (no resume)");
      return { sessionId: undefined, isNew: true };
    }

    // Si el usuario existe, buscar sesión activa reciente (últimas 2 horas)
    const conversation = await db.queryRow`
      SELECT session_id, last_message_at
      FROM conversations
      WHERE phone_number = ${phoneNumber}
        AND last_message_at > NOW() - INTERVAL '2 hours'
      ORDER BY last_message_at DESC
      LIMIT 1
    `;

    if (conversation?.session_id) {
      console.log(`📝 Resuming existing session: ${conversation.session_id}`);
      return { sessionId: conversation.session_id, isNew: false };
    }

    console.log("🆕 Starting new session for existing user");
    return { sessionId: undefined, isNew: true };
  } catch (error) {
    console.error("❌ Error getting session:", error);
    console.log("🆕 Falling back to new session");
    return { sessionId: undefined, isNew: true };
  }
}

// Guardar session_id en la base de datos
async function saveSession(
  phoneNumber: string,
  sessionId: string
): Promise<void> {
  try {
    // Asegurar que el usuario existe primero
    await db.exec`
      INSERT INTO users (phone_number)
      VALUES (${phoneNumber})
      ON CONFLICT (phone_number) DO NOTHING
    `;

    // Guardar la sesión
    await db.exec`
      INSERT INTO conversations (phone_number, session_id, last_message_at)
      VALUES (${phoneNumber}, ${sessionId}, NOW())
      ON CONFLICT (phone_number) DO UPDATE SET
        session_id = ${sessionId},
        last_message_at = NOW()
    `;
    console.log(`💾 Session saved: ${sessionId}`);
  } catch (error) {
    console.error("❌ Error saving session:", error);
  }
}

// Procesar mensaje con Claude Agent SDK
export async function processWithAgentSDK(
  userMessage: string,
  phoneNumber: string,
  messageId?: string
): Promise<void> {
  console.log("🤖 Using Claude Agent SDK");

  // Obtener sesión previa si existe
  const { sessionId: existingSessionId, isNew } = await getOrCreateSession(
    phoneNumber
  );

  const prompt = `Usuario: ${phoneNumber}
Mensaje: "${userMessage}"
${messageId ? `Message ID: ${messageId}` : ""}

Analiza el mensaje y delega al agente especializado apropiado.
Recuerda: SIEMPRE responde al usuario usando send_whatsapp_message("${phoneNumber}", "...")
${
  messageId
    ? `OPCIONAL: Puedes reaccionar al mensaje usando send_reaction("${phoneNumber}", "${messageId}", emoji) solo si es muy apropiado`
    : ""
}`;

  try {
    // Configurar API key en el entorno antes de llamar al SDK
    process.env.ANTHROPIC_API_KEY = ANTHROPIC_API_KEY();

    console.log("🎯 Starting Agent SDK query with config:");
    console.log(`   Model: claude-sonnet-4-5-20250929`);
    console.log(`   Permission Mode: bypassPermissions`);
    console.log(`   Max Turns: 15`);
    console.log(
      `   Agents: ${Object.keys(PLANEAT_AGENTS).length} subagents available`
    );
    console.log(`   Phone: ${phoneNumber}`);
    console.log(
      `   Session: ${existingSessionId ? `Resume ${existingSessionId}` : "New"}`
    );

    // Configuración del SDK
    const queryOptions: any = {
      systemPrompt: SYSTEM_PROMPT,
      model: "claude-sonnet-4-5-20250929",
      permissionMode: "bypassPermissions",
      maxTurns: 15,
      // Configurar subagentes especializados
      agents: PLANEAT_AGENTS,
      // SOLO permitir nuestras herramientas custom (no las de Claude Code)
      allowedTools: [
        "get_user_context",
        "send_whatsapp_message",
        "create_household",
        "add_household_members",
        "save_conversation_state",
        "send_reaction",
      ],
      mcpServers: {
        planeat: planeatServer,
      },
    };

    // Si existe sesión previa, reanudar en lugar de crear nueva
    if (existingSessionId) {
      queryOptions.resume = existingSessionId;
    }

    let currentSessionId: string | undefined = existingSessionId;

    // Usar Agent SDK con configuración
    for await (const message of query({
      prompt,
      options: queryOptions,
    })) {
      // Log detallado de TODOS los mensajes para debugging
      console.log("📨 SDK Message:", {
        type: message.type,
        timestamp: new Date().toISOString(),
      });

      // Capturar session_id de los mensajes
      if ("session_id" in message && message.session_id) {
        currentSessionId = message.session_id;
      }

      if (message.type === "assistant") {
        console.log("🤖 Agent response:", JSON.stringify(message, null, 2));
      } else if (message.type === "tool_progress") {
        console.log("🔧 Tool in progress:", message.tool_name);
        console.log("   Full message:", JSON.stringify(message, null, 2));
      } else if (message.type === "result") {
        console.log("✅ Query completed successfully");
        console.log(
          `   Duration: ${message.duration_ms}ms | Turns: ${message.num_turns} | Cost: $${message.total_cost_usd}`
        );
        console.log("   Full result:", JSON.stringify(message, null, 2));
      } else if (message.type === "user") {
        console.log("👤 User message processed");
      } else if (message.type === "stream_event") {
        console.log("📡 Stream event:", JSON.stringify(message, null, 2));
      } else if (message.type === "system") {
        console.log("⚙️ System message:", JSON.stringify(message, null, 2));
      } else if (message.type === "auth_status") {
        console.log("🔐 Auth status:", JSON.stringify(message, null, 2));
      } else {
        console.log(
          "❓ Unknown message type:",
          JSON.stringify(message, null, 2)
        );
      }
    }

    // Guardar session_id al final
    if (currentSessionId && currentSessionId !== existingSessionId) {
      await saveSession(phoneNumber, currentSessionId);
    }

    console.log("✅ Agent SDK processing complete");
  } catch (error: any) {
    console.error("❌ Agent SDK error:", error);
    throw error;
  }
}
