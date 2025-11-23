/**
 * Funciones de base de datos para menús semanales y listas de compras
 */

import { pool } from "../db/connection";

// ============================================================================
// TYPES
// ============================================================================

export interface WeeklyMenu {
  id?: number;
  household_id?: number;
  phone_number: string;
  week_start_date: string; // YYYY-MM-DD
  menu_data: {
    [day: string]: {
      nombre: string;
      ingredientes: string[];
    };
  };
  household_size: number;
  dietary_restrictions?: string;
  preferences?: string;
}

export interface ShoppingListItem {
  nombre: string;
  cantidad: string;
  unidad?: string;
  categoria?: string;
  producto_id?: number; // ID del producto en Frest (si se encontró)
  precio?: number; // Precio en Frest (si se encontró)
  disponible?: boolean; // Si está disponible en Frest
}

export interface ShoppingList {
  id?: number;
  weekly_menu_id?: number;
  phone_number: string;
  items: ShoppingListItem[];
  total_estimated?: number;
  status: "pending" | "ordered" | "completed" | "cancelled";
}

export interface FrestOrder {
  id?: number;
  shopping_list_id?: number;
  phone_number: string;
  frest_pedido_id: number;
  frest_codigo_pedido?: string;
  frest_user_id: number;
  frest_direccion_id: number;
  items: any[];
  subtotal?: number;
  despacho: number;
  descuento: number;
  total: number;
  forma_pago: string;
  payment_link?: string;
  estado: string;
  estado_pago?: string;
  expires_at?: string;
}

// ============================================================================
// WEEKLY MENUS
// ============================================================================

/**
 * Guarda un menú semanal en la base de datos
 */
export async function saveWeeklyMenu(menu: WeeklyMenu): Promise<number> {
  const query = `
    INSERT INTO weekly_menus (
      household_id,
      phone_number,
      week_start_date,
      menu_data,
      household_size,
      dietary_restrictions,
      preferences
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `;

  const values = [
    menu.household_id || null,
    menu.phone_number,
    menu.week_start_date,
    JSON.stringify(menu.menu_data),
    menu.household_size,
    menu.dietary_restrictions || null,
    menu.preferences || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0].id;
}

/**
 * Obtiene el último menú semanal de un usuario
 */
export async function getLatestWeeklyMenu(
  phoneNumber: string
): Promise<WeeklyMenu | null> {
  const query = `
    SELECT * FROM weekly_menus
    WHERE phone_number = $1
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [phoneNumber]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    household_id: row.household_id,
    phone_number: row.phone_number,
    week_start_date: row.week_start_date,
    menu_data: row.menu_data,
    household_size: row.household_size,
    dietary_restrictions: row.dietary_restrictions,
    preferences: row.preferences,
  };
}

// ============================================================================
// SHOPPING LISTS
// ============================================================================

/**
 * Guarda una lista de compras en la base de datos
 */
export async function saveShoppingList(
  list: ShoppingList
): Promise<number> {
  const query = `
    INSERT INTO shopping_lists (
      weekly_menu_id,
      phone_number,
      items,
      total_estimated,
      status
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;

  const values = [
    list.weekly_menu_id || null,
    list.phone_number,
    JSON.stringify(list.items),
    list.total_estimated || null,
    list.status,
  ];

  const result = await pool.query(query, values);
  return result.rows[0].id;
}

/**
 * Obtiene la última lista de compras de un usuario
 */
export async function getLatestShoppingList(
  phoneNumber: string
): Promise<ShoppingList | null> {
  const query = `
    SELECT * FROM shopping_lists
    WHERE phone_number = $1
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [phoneNumber]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    weekly_menu_id: row.weekly_menu_id,
    phone_number: row.phone_number,
    items: row.items,
    total_estimated: row.total_estimated,
    status: row.status,
  };
}

/**
 * Actualiza el estado de una lista de compras
 */
export async function updateShoppingListStatus(
  listId: number,
  status: string
): Promise<void> {
  const query = `
    UPDATE shopping_lists
    SET status = $1, updated_at = NOW()
    WHERE id = $2
  `;

  await pool.query(query, [status, listId]);
}

/**
 * Actualiza los items de una lista de compras (con precios de Frest)
 */
export async function updateShoppingListItems(
  listId: number,
  items: ShoppingListItem[],
  totalEstimated?: number
): Promise<void> {
  const query = `
    UPDATE shopping_lists
    SET items = $1, total_estimated = $2, updated_at = NOW()
    WHERE id = $3
  `;

  await pool.query(query, [
    JSON.stringify(items),
    totalEstimated || null,
    listId,
  ]);
}

// ============================================================================
// FREST ORDERS
// ============================================================================

/**
 * Guarda un pedido de Frest en la base de datos
 */
export async function saveFrestOrder(order: FrestOrder): Promise<number> {
  const query = `
    INSERT INTO frest_orders (
      shopping_list_id,
      phone_number,
      frest_pedido_id,
      frest_codigo_pedido,
      frest_user_id,
      frest_direccion_id,
      items,
      subtotal,
      despacho,
      descuento,
      total,
      forma_pago,
      payment_link,
      estado,
      estado_pago,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING id
  `;

  const values = [
    order.shopping_list_id || null,
    order.phone_number,
    order.frest_pedido_id,
    order.frest_codigo_pedido || null,
    order.frest_user_id,
    order.frest_direccion_id,
    JSON.stringify(order.items),
    order.subtotal || null,
    order.despacho,
    order.descuento,
    order.total,
    order.forma_pago,
    order.payment_link || null,
    order.estado,
    order.estado_pago || null,
    order.expires_at || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0].id;
}

/**
 * Obtiene los pedidos de Frest de un usuario
 */
export async function getFrestOrders(
  phoneNumber: string,
  limit: number = 10
): Promise<FrestOrder[]> {
  const query = `
    SELECT * FROM frest_orders
    WHERE phone_number = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [phoneNumber, limit]);

  return result.rows.map((row: any) => ({
    id: row.id,
    shopping_list_id: row.shopping_list_id,
    phone_number: row.phone_number,
    frest_pedido_id: row.frest_pedido_id,
    frest_codigo_pedido: row.frest_codigo_pedido,
    frest_user_id: row.frest_user_id,
    frest_direccion_id: row.frest_direccion_id,
    items: row.items,
    subtotal: row.subtotal,
    despacho: row.despacho,
    descuento: row.descuento,
    total: row.total,
    forma_pago: row.forma_pago,
    payment_link: row.payment_link,
    estado: row.estado,
    estado_pago: row.estado_pago,
    expires_at: row.expires_at,
  }));
}

