import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { db } from "../db";

export const getUserContextTool = tool(
  "get_user_context",
  "Obtiene el contexto completo de un usuario (perfil + household + miembros)",
  {
    phone_number: z.string().describe("Número de WhatsApp del usuario"),
  },
  async ({ phone_number }) => {
    console.log("🔧 TOOL CALLED: get_user_context");
    console.log(`   Phone: ${phone_number}`);

    const user = await db.queryRow`
      SELECT phone_number, display_name, created_at
      FROM users WHERE phone_number = ${phone_number}
    `;

    if (!user) {
      console.log("   Result: User does not exist");
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ exists: false }),
          },
        ],
      };
    }

    console.log("   User found:", user.phone_number);

    const household = await db.queryRow`
      SELECT h.*, hm.role
      FROM households h
      JOIN household_members hm ON h.id = hm.household_id
      WHERE hm.phone_number = ${phone_number}
    `;

    // Obtener todos los miembros del hogar si existe
    let members = [];
    if (household) {
      const membersQuery = await db.query`
        SELECT name, phone_number, age, relationship, role
        FROM household_members
        WHERE household_id = ${household.id}
        ORDER BY 
          CASE role 
            WHEN 'admin' THEN 1 
            ELSE 2 
          END,
          created_at
      `;

      for await (const member of membersQuery) {
        members.push(member);
      }
    }

    const result = {
      exists: true,
      user,
      household: household || null,
      members,
    };

    console.log("   Result:", JSON.stringify(result, null, 2));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result),
        },
      ],
    };
  }
);

