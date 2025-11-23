/**
 * Tool: save_weekly_menu
 * Guarda un menú semanal con sus ingredientes en la base de datos
 */

import { saveWeeklyMenu, WeeklyMenu } from "../db-menu";

export const saveWeeklyMenuTool = {
  name: "save_weekly_menu",
  description: `Guarda un menú semanal completo en la base de datos para mantener el contexto.
IMPORTANTE: Usa esta herramienta INMEDIATAMENTE después de generar un menú semanal para el usuario.
Esto permite que el bot recuerde el menú y las cantidades necesarias para la lista de compras.`,
  input_schema: {
    type: "object" as const,
    properties: {
      phone_number: {
        type: "string",
        description: "Número de teléfono del usuario (formato: 56912345678)",
      },
      week_start_date: {
        type: "string",
        description: "Fecha de inicio de la semana (formato: YYYY-MM-DD)",
      },
      menu_data: {
        type: "object",
        description:
          "Menú semanal con estructura: {lunes: {nombre, ingredientes}, martes: {...}, ...}",
        properties: {
          lunes: {
            type: "object",
            properties: {
              nombre: { type: "string" },
              ingredientes: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          martes: {
            type: "object",
            properties: {
              nombre: { type: "string" },
              ingredientes: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          miercoles: {
            type: "object",
            properties: {
              nombre: { type: "string" },
              ingredientes: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          jueves: {
            type: "object",
            properties: {
              nombre: { type: "string" },
              ingredientes: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          viernes: {
            type: "object",
            properties: {
              nombre: { type: "string" },
              ingredientes: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          sabado: {
            type: "object",
            properties: {
              nombre: { type: "string" },
              ingredientes: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          domingo: {
            type: "object",
            properties: {
              nombre: { type: "string" },
              ingredientes: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
      },
      household_size: {
        type: "number",
        description: "Cantidad de personas en el hogar",
      },
      dietary_restrictions: {
        type: "string",
        description: "Restricciones alimentarias (opcional)",
      },
      preferences: {
        type: "string",
        description: "Preferencias de comida (opcional)",
      },
    },
    required: ["phone_number", "week_start_date", "menu_data", "household_size"],
  },
};

export async function executeSaveWeeklyMenu(input: {
  phone_number: string;
  week_start_date: string;
  menu_data: any;
  household_size: number;
  dietary_restrictions?: string;
  preferences?: string;
}): Promise<string> {
  try {
    console.log(
      `💾 [Menu] Guardando menú semanal para ${input.phone_number}`
    );

    const menu: WeeklyMenu = {
      phone_number: input.phone_number,
      week_start_date: input.week_start_date,
      menu_data: input.menu_data,
      household_size: input.household_size,
      dietary_restrictions: input.dietary_restrictions,
      preferences: input.preferences,
    };

    const menuId = await saveWeeklyMenu(menu);

    console.log(`✅ [Menu] Menú guardado con ID: ${menuId}`);

    return JSON.stringify({
      success: true,
      menu_id: menuId,
      message: "Menú semanal guardado exitosamente",
    });
  } catch (error: any) {
    console.error(`❌ [Menu] Error guardando menú:`, error);
    return JSON.stringify({
      success: false,
      error: error.message || "Error al guardar el menú",
    });
  }
}

