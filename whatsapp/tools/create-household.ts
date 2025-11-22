import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { db } from "../db";

export const createHouseholdTool = tool(
  "create_household",
  "Crea un nuevo hogar y registra al usuario como admin",
  {
    admin_phone: z.string().describe("Número de WhatsApp del administrador"),
    display_name: z.string().describe("Nombre del administrador"),
    household_size: z.number().describe("Tamaño del hogar"),
    dietary_restrictions: z
      .string()
      .optional()
      .describe("Restricciones dietéticas"),
    preferences: z.string().optional().describe("Preferencias alimentarias"),
    goals: z.string().optional().describe("Objetivos del hogar"),
  },
  async (params) => {
    console.log("🔧 TOOL CALLED: create_household");
    console.log(`   Admin: ${params.admin_phone}`);
    console.log(`   Name: ${params.display_name}`);
    console.log(`   Size: ${params.household_size}`);
    console.log(`   Preferences: ${params.preferences || "none"}`);

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
      };
    }

    await db.exec`
      INSERT INTO household_members (household_id, phone_number, name, role)
      VALUES (${household.id}, ${params.admin_phone}, ${
      params.display_name || null
    }, 'admin')
    `;

    console.log(`✅ Household created successfully! ID: ${household.id}`);

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

