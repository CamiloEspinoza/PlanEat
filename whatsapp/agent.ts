// Configuración del agente Claude para PlanEat
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { sendTextMessage, sendInteractiveMessage } from "./whatsapp-client";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("planeat", { migrations: "./migrations" });

// Tool para enviar mensajes de WhatsApp
const sendWhatsAppMessageTool = tool(
  "send_whatsapp_message",
  "Envía un mensaje de WhatsApp al usuario. DEBES usar esta herramienta para responder.",
  {
    to: z.string().describe("Número de WhatsApp del destinatario"),
    message: z.string().describe("Contenido del mensaje a enviar"),
  },
  async ({ to, message }) => {
    try {
      await sendTextMessage(to, message);
      return {
        content: [
          {
            type: "text" as const,
            text: `Mensaje enviado exitosamente a ${to}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error al enviar mensaje: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool para mensajes interactivos con botones
const sendInteractiveButtonsTool = tool(
  "send_interactive_buttons",
  "Envía un mensaje con botones interactivos",
  {
    to: z.string(),
    message: z.string(),
    buttons: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
      })
    ),
  },
  async ({ to, message, buttons }) => {
    try {
      await sendInteractiveMessage(to, message, buttons);
      return {
        content: [
          {
            type: "text" as const,
            text: `Mensaje interactivo enviado a ${to}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool para obtener contexto del usuario
const getUserContextTool = tool(
  "get_user_context",
  "Obtiene el contexto completo de un usuario (perfil + household)",
  {
    phone_number: z.string().describe("Número de WhatsApp del usuario"),
  },
  async ({ phone_number }) => {
    const user = await db.queryRow`
      SELECT phone_number, display_name, created_at
      FROM users WHERE phone_number = ${phone_number}
    `;

    if (!user) {
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ exists: false }) },
        ],
      };
    }

    const household = await db.queryRow`
      SELECT h.*, hm.role
      FROM households h
      JOIN household_members hm ON h.id = hm.household_id
      WHERE hm.phone_number = ${phone_number}
    `;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            exists: true,
            user,
            household: household || null,
          }),
        },
      ],
    };
  }
);

// Tool para crear household
const createHouseholdTool = tool(
  "create_household",
  "Crea un nuevo hogar y registra al usuario como admin",
  {
    admin_phone: z.string(),
    display_name: z.string().optional(),
    household_size: z.number().optional(),
    dietary_restrictions: z.string().optional(),
    preferences: z.string().optional(),
    goals: z.string().optional(),
  },
  async (params) => {
    await db.exec`
      INSERT INTO users (phone_number, display_name)
      VALUES (${params.admin_phone}, ${params.display_name || null})
      ON CONFLICT (phone_number) DO NOTHING
    `;

    const household = await db.queryRow`
      INSERT INTO households (
        admin_phone, household_size, dietary_restrictions, preferences, goals
      ) VALUES (
        ${params.admin_phone},
        ${params.household_size || 1},
        ${params.dietary_restrictions || null},
        ${params.preferences || null},
        ${params.goals || null}
      )
      RETURNING id, admin_phone, household_size
    `;

    if (!household) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: "Failed to create household",
            }),
          },
        ],
        isError: true,
      };
    }

    await db.exec`
      INSERT INTO household_members (household_id, phone_number, role)
      VALUES (${household.id}, ${params.admin_phone}, 'admin')
    `;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, household }),
        },
      ],
    };
  }
);

// Tool para agregar miembro a household
const addHouseholdMemberTool = tool(
  "add_household_member",
  "Agrega un miembro a un hogar existente",
  {
    household_id: z.number(),
    phone_number: z.string(),
    display_name: z.string().optional(),
  },
  async (params) => {
    await db.exec`
      INSERT INTO users (phone_number, display_name)
      VALUES (${params.phone_number}, ${params.display_name || null})
      ON CONFLICT (phone_number) DO NOTHING
    `;

    await db.exec`
      INSERT INTO household_members (household_id, phone_number, role)
      VALUES (${params.household_id}, ${params.phone_number}, 'member')
      ON CONFLICT (household_id, phone_number) DO NOTHING
    `;

    return {
      content: [
        { type: "text" as const, text: JSON.stringify({ success: true }) },
      ],
    };
  }
);

// Crear el servidor MCP SDK con todas las tools
export const planeatMcpServer = createSdkMcpServer({
  name: "planeat",
  tools: [
    sendWhatsAppMessageTool,
    sendInteractiveButtonsTool,
    getUserContextTool,
    createHouseholdTool,
    addHouseholdMemberTool,
  ],
});

export const SYSTEM_PROMPT = `Eres PlanEat, un asistente de planificación de comidas por WhatsApp para familias chilenas.

Tu objetivo es ayudar a:
- Crear hogares y agregar miembros de familia
- Extraer ingredientes de mensajes de texto
- Planificar menús semanales
- Generar listas de compras

IMPORTANTE: Siempre debes responder al usuario usando la herramienta send_whatsapp_message.

Usa un tono amigable, conversacional y en español chileno.`;
