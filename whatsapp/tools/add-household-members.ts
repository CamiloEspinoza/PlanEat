import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { db } from "../db";

export const addHouseholdMembersTool = tool(
  "add_household_members",
  "Agrega miembros al hogar. Pueden tener o no número de WhatsApp. Los niños pequeños NO tienen WhatsApp.",
  {
    household_id: z.number().describe("ID del hogar"),
    members: z
      .array(
        z.object({
          name: z.string().describe("Nombre del miembro"),
          phone_number: z
            .string()
            .optional()
            .describe("Número de WhatsApp (opcional)"),
          age: z.number().optional().describe("Edad del miembro"),
          relationship: z.string().optional().describe("Relación con el admin"),
          role: z.string().optional().describe("Rol en el hogar"),
        })
      )
      .describe("Lista de miembros a agregar"),
  },
  async (params) => {
    console.log("🔧 TOOL CALLED: add_household_members");
    console.log(`   Household ID: ${params.household_id}`);
    console.log(`   Members count: ${params.members.length}`);

    const { household_id, members } = params;

    for (const member of members) {
      // Si el miembro tiene phone_number, crear usuario primero
      if (member.phone_number) {
        await db.exec`
          INSERT INTO users (phone_number, display_name)
          VALUES (${member.phone_number}, ${member.name})
          ON CONFLICT (phone_number) DO UPDATE SET display_name = ${member.name}
        `;
      }

      // Agregar miembro al hogar
      await db.exec`
        INSERT INTO household_members (
          household_id, 
          phone_number, 
          name, 
          age, 
          relationship, 
          role
        )
        VALUES (
          ${household_id},
          ${member.phone_number || null},
          ${member.name},
          ${member.age || null},
          ${member.relationship || null},
          ${member.role || "member"}
        )
      `;
    }

    console.log(`✅ Added ${members.length} members to household ${household_id}`);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: `Se agregaron ${members.length} miembros al hogar`,
          }),
        },
      ],
    };
  }
);

