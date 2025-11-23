/**
 * Tool: create_frest_order_from_list
 * Crea un pedido en Frest basándose en la lista de compras guardada
 */

import { frestClient } from "../clients/frest-client";
import {
  getLatestShoppingList,
  updateShoppingListItems,
  updateShoppingListStatus,
  saveFrestOrder,
  ShoppingListItem,
} from "../db-menu";
import { FrestApiException } from "../clients/frest-types";

export const createFrestOrderFromListTool = {
  name: "create_frest_order_from_list",
  description: `Crea un pedido completo en Frest usando la lista de compras guardada.
Esta herramienta:
1. Recupera la lista de compras guardada con las cantidades
2. Busca cada producto en Frest con la cantidad ya definida
3. Crea el pedido automáticamente con los productos disponibles
4. Guarda el pedido en la base de datos

IMPORTANTE: No necesitas preguntar cantidades al usuario, ya están guardadas en la lista.`,
  input_schema: {
    type: "object" as const,
    properties: {
      phone_number: {
        type: "string",
        description: "Número de teléfono del usuario",
      },
      user_id: {
        type: "number",
        description: "ID del usuario en Frest",
      },
      direccion_id: {
        type: "number",
        description: "ID de la dirección de despacho en Frest",
      },
      ventana_id: {
        type: "number",
        description: "ID de la ventana de despacho en Frest",
      },
      bodega_id: {
        type: "number",
        description: "ID de la bodega (default: 1)",
      },
      tipo_pedido_id: {
        type: "number",
        description: "1=Despacho domicilio, 2=Retiro tienda, 3=Retiro express",
      },
      forma_pago: {
        type: "string",
        enum: ["webpay", "oneclick"],
        description: "Método de pago: webpay (tarjeta crédito/débito) o oneclick (tarjeta guardada). NO se acepta efectivo en pedidos online.",
      },
    },
    required: [
      "phone_number",
      "user_id",
      "direccion_id",
      "ventana_id",
      "bodega_id",
      "tipo_pedido_id",
      "forma_pago",
    ],
  },
};

export async function executeCreateFrestOrderFromList(input: {
  phone_number: string;
  user_id: number;
  direccion_id: number;
  ventana_id: number;
  bodega_id: number;
  tipo_pedido_id: number;
  forma_pago: string;
}): Promise<string> {
  try {
    console.log(
      `🛍️  [Frest Order] Creando pedido desde lista para ${input.phone_number}`
    );

    // 1. Recuperar la lista de compras guardada
    const shoppingList = await getLatestShoppingList(input.phone_number);

    if (!shoppingList) {
      return JSON.stringify({
        success: false,
        error:
          "No se encontró una lista de compras guardada. El usuario debe crear una lista primero.",
      });
    }

    if (shoppingList.status === "ordered" || shoppingList.status === "completed") {
      return JSON.stringify({
        success: false,
        error:
          "Esta lista ya fue ordenada. El usuario debe crear una nueva lista.",
      });
    }

    console.log(
      `   Lista encontrada: ${shoppingList.items.length} items (ID: ${shoppingList.id})`
    );

    // 2. Buscar productos en Frest usando los nombres de la lista
    const nombresProductos = shoppingList.items.map((item) => item.nombre);
    console.log(`   Buscando ${nombresProductos.length} productos en Frest...`);

    const productosResult = await frestClient.consultarProductos(
      nombresProductos,
      input.bodega_id
    );

    // 3. Mapear productos encontrados con las cantidades de la lista original
    const itemsParaPedido: Array<{
      producto_id: number;
      cantidad: number;
    }> = [];

    const productosConPrecios: ShoppingListItem[] = [];
    const productosNoDisponibles: string[] = [];

    for (const item of shoppingList.items) {
      const productoFrest = productosResult.productos.find(
        (p) => p.nombre.toLowerCase().includes(item.nombre.toLowerCase()) ||
              item.nombre.toLowerCase().includes(p.nombre.toLowerCase())
      );

      if (productoFrest && productoFrest.disponible) {
        // Convertir cantidad a número
        const cantidad = parseFloat(item.cantidad) || 1;

        itemsParaPedido.push({
          producto_id: productoFrest.producto_id,
          cantidad: cantidad,
        });

        // Actualizar item con info de Frest
        productosConPrecios.push({
          ...item,
          producto_id: productoFrest.producto_id,
          precio: productoFrest.precio,
          disponible: true,
        });
      } else {
        productosNoDisponibles.push(item.nombre);
        productosConPrecios.push({
          ...item,
          disponible: false,
        });
      }
    }

    if (itemsParaPedido.length === 0) {
      return JSON.stringify({
        success: false,
        error: "Ningún producto de la lista está disponible en Frest actualmente.",
        productos_no_disponibles: productosNoDisponibles,
      });
    }

    // 4. Actualizar la lista con los precios de Frest
    const totalEstimado = productosConPrecios
      .filter((p) => p.disponible && p.precio)
      .reduce(
        (sum, p) => sum + p.precio! * parseFloat(p.cantidad),
        0
      );

    await updateShoppingListItems(
      shoppingList.id!,
      productosConPrecios,
      totalEstimado
    );

    console.log(
      `   ${itemsParaPedido.length} productos disponibles de ${shoppingList.items.length}`
    );

    // 5. Crear el pedido en Frest
    console.log(`   Creando pedido en Frest...`);

    const pedidoResult = await frestClient.crearPedido({
      user_id: input.user_id,
      direccion_id: input.direccion_id,
      ventana_id: input.ventana_id,
      bodega_id: input.bodega_id,
      tipo_pedido_id: input.tipo_pedido_id as any,
      forma_pago: input.forma_pago as any,
      items: itemsParaPedido,
      observaciones: `Pedido desde PlanEat - Lista ${shoppingList.id}`,
    });

    // 6. Guardar el pedido en la base de datos
    const frestOrderId = await saveFrestOrder({
      shopping_list_id: shoppingList.id,
      phone_number: input.phone_number,
      frest_pedido_id: pedidoResult.pedido_id,
      frest_codigo_pedido: pedidoResult.codigo_pedido || undefined,
      frest_user_id: input.user_id,
      frest_direccion_id: input.direccion_id,
      items: itemsParaPedido,
      subtotal: pedidoResult.subtotal || undefined,
      despacho: pedidoResult.despacho,
      descuento: pedidoResult.descuento,
      total: pedidoResult.total,
      forma_pago: pedidoResult.forma_pago,
      payment_link: pedidoResult.payment_link || undefined,
      estado: pedidoResult.estado,
      estado_pago: pedidoResult.estado_pago || undefined,
      expires_at: pedidoResult.expires_at || undefined,
    });

    // 7. Marcar la lista como ordenada
    await updateShoppingListStatus(shoppingList.id!, "ordered");

    console.log(`✅ [Frest Order] Pedido creado exitosamente: ${pedidoResult.pedido_id}`);

    return JSON.stringify({
      success: true,
      pedido_id: pedidoResult.pedido_id,
      codigo_pedido: pedidoResult.codigo_pedido,
      total: pedidoResult.total,
      despacho: pedidoResult.despacho,
      payment_link: pedidoResult.payment_link,
      estado: pedidoResult.estado,
      items_ordenados: itemsParaPedido.length,
      items_totales: shoppingList.items.length,
      productos_no_disponibles:
        productosNoDisponibles.length > 0 ? productosNoDisponibles : undefined,
      message: `Pedido creado con ${itemsParaPedido.length} de ${shoppingList.items.length} productos. Total: $${pedidoResult.total}`,
    });
  } catch (error: any) {
    console.error(`❌ [Frest Order] Error:`, error);

    if (error instanceof FrestApiException) {
      return JSON.stringify({
        success: false,
        error: error.errores.join(", "),
      });
    }

    return JSON.stringify({
      success: false,
      error: error.message || "Error al crear el pedido en Frest",
    });
  }
}

