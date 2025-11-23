/**
 * Tool: get_shopping_list_context
 * Recupera la última lista de compras del usuario para mantener el contexto
 */

import { getLatestShoppingList } from "../db-menu";

export const getShoppingListContextTool = {
  name: "get_shopping_list_context",
  description: `Recupera la última lista de compras guardada del usuario.
IMPORTANTE: Usa esta herramienta cuando el usuario quiera crear un pedido en Frest
y necesites recuperar las cantidades que ya fueron definidas en la lista de compras.
Esto evita tener que preguntar las cantidades de nuevo.`,
  input_schema: {
    type: "object" as const,
    properties: {
      phone_number: {
        type: "string",
        description: "Número de teléfono del usuario",
      },
    },
    required: ["phone_number"],
  },
};

export async function executeGetShoppingListContext(input: {
  phone_number: string;
}): Promise<string> {
  try {
    console.log(
      `🔍 [Shopping] Recuperando lista de compras para ${input.phone_number}`
    );

    const list = await getLatestShoppingList(input.phone_number);

    if (!list) {
      return JSON.stringify({
        success: false,
        message: "No se encontró ninguna lista de compras guardada",
      });
    }

    console.log(
      `✅ [Shopping] Lista encontrada: ${list.items.length} items, estado: ${list.status}`
    );

    return JSON.stringify({
      success: true,
      shopping_list: {
        id: list.id,
        items: list.items,
        total_estimated: list.total_estimated,
        status: list.status,
        items_count: list.items.length,
      },
      message:
        "Lista de compras recuperada. Úsala para crear el pedido sin preguntar cantidades.",
    });
  } catch (error: any) {
    console.error(`❌ [Shopping] Error recuperando lista:`, error);
    return JSON.stringify({
      success: false,
      error: error.message || "Error al recuperar la lista de compras",
    });
  }
}

