/**
 * Tool: save_shopping_list
 * Guarda una lista de compras con cantidades específicas
 */

import {
  saveShoppingList,
  getLatestWeeklyMenu,
  ShoppingList,
  ShoppingListItem,
} from "../db-menu";

export const saveShoppingListTool = {
  name: "save_shopping_list",
  description: `Guarda una lista de compras con cantidades específicas en la base de datos.
IMPORTANTE: Usa esta herramienta INMEDIATAMENTE después de generar una lista de compras.
Esto permite que el bot recuerde las cantidades al buscar productos en Frest.`,
  input_schema: {
    type: "object" as const,
    properties: {
      phone_number: {
        type: "string",
        description: "Número de teléfono del usuario",
      },
      items: {
        type: "array",
        description:
          "Lista de productos con cantidades. Ejemplo: [{nombre: 'Tomate', cantidad: '1.5', unidad: 'kg', categoria: 'Verduras'}]",
        items: {
          type: "object",
          properties: {
            nombre: {
              type: "string",
              description: "Nombre del producto",
            },
            cantidad: {
              type: "string",
              description: "Cantidad (puede ser decimal, ej: '1.5')",
            },
            unidad: {
              type: "string",
              description: "Unidad de medida (kg, unidades, litros, etc.)",
            },
            categoria: {
              type: "string",
              description:
                "Categoría del producto (Carnes, Verduras, Despensa, etc.)",
            },
          },
          required: ["nombre", "cantidad"],
        },
      },
    },
    required: ["phone_number", "items"],
  },
};

export async function executeSaveShoppingList(input: {
  phone_number: string;
  items: ShoppingListItem[];
}): Promise<string> {
  try {
    console.log(
      `🛒 [Shopping] Guardando lista de compras para ${input.phone_number}`
    );
    console.log(`   Items: ${input.items.length}`);

    // Obtener el último menú para asociarlo
    const latestMenu = await getLatestWeeklyMenu(input.phone_number);

    const list: ShoppingList = {
      weekly_menu_id: latestMenu?.id,
      phone_number: input.phone_number,
      items: input.items,
      status: "pending",
    };

    const listId = await saveShoppingList(list);

    console.log(`✅ [Shopping] Lista guardada con ID: ${listId}`);

    return JSON.stringify({
      success: true,
      shopping_list_id: listId,
      items_count: input.items.length,
      message: "Lista de compras guardada exitosamente",
    });
  } catch (error: any) {
    console.error(`❌ [Shopping] Error guardando lista:`, error);
    return JSON.stringify({
      success: false,
      error: error.message || "Error al guardar la lista de compras",
    });
  }
}

