# Implementación de Persistencia de Contexto en PlanEat

**Fecha**: 23 de Noviembre, 2025  
**Problema Resuelto**: El bot perdía el contexto de menús y cantidades entre conversaciones

---

## 🎯 Problema Identificado

### Situación Anterior:
1. Usuario: "Hazme un menú semanal, lista de compras y haz el pedido en Frest"
2. Bot genera menú semanal ✅
3. Bot genera lista con cantidades específicas ✅
4. **Bot pregunta cantidades de nuevo** ❌ (perdió el contexto)

### Causa Raíz:
- El contexto conversacional de Claude se pierde entre mensajes
- Las cantidades definidas en la lista de compras no se guardaban
- No había forma de recuperar información de conversaciones anteriores

---

## 💡 Solución Implementada

### Arquitectura de Persistencia

```
Usuario → Genera Menú → save_weekly_menu() → PostgreSQL
              ↓
         Lista Compras → save_shopping_list() → PostgreSQL
              ↓
      Consulta Frest → get_shopping_list_context() → Recupera cantidades
              ↓
       Crear Pedido → create_frest_order_from_list() → Pedido automático
```

---

## 📊 Nuevas Tablas de Base de Datos

### 1. `weekly_menus`
Almacena menús semanales generados por el bot.

```sql
id, household_id, phone_number, week_start_date,
menu_data (JSONB), household_size, dietary_restrictions,
preferences, created_at, updated_at
```

**Estructura de `menu_data`:**
```json
{
  "lunes": {
    "nombre": "Fideos con salsa boloñesa",
    "ingredientes": ["fideos 500g", "carne molida 1kg", "salsa tomate 2 latas"]
  },
  "martes": { ... },
  ...
}
```

### 2. `shopping_lists`
Almacena listas de compras con cantidades específicas.

```sql
id, weekly_menu_id, phone_number, items (JSONB),
total_estimated, status (pending/ordered/completed/cancelled),
created_at, updated_at
```

**Estructura de `items`:**
```json
[
  {
    "nombre": "Tomate",
    "cantidad": "1.5",
    "unidad": "kg",
    "categoria": "Verduras",
    "producto_id": 48,      // Después de consultar Frest
    "precio": 2190,          // Después de consultar Frest
    "disponible": true       // Después de consultar Frest
  },
  ...
]
```

### 3. `frest_orders`
Registra todos los pedidos creados en Frest desde el bot.

```sql
id, shopping_list_id, phone_number, frest_pedido_id,
frest_codigo_pedido, frest_user_id, frest_direccion_id,
items (JSONB), subtotal, despacho, descuento, total,
forma_pago, payment_link, estado, estado_pago,
expires_at, created_at, updated_at
```

---

## 🛠️ Nuevas Herramientas (Tools) para Claude

### 1. `save_weekly_menu`
**Propósito**: Guardar menús semanales inmediatamente después de generarlos.

**Cuándo usar**: Agente `menu-planner` después de crear un menú.

**Parámetros**:
```typescript
{
  phone_number: string,
  week_start_date: string, // "2025-11-23"
  menu_data: {lunes: {...}, martes: {...}, ...},
  household_size: number,
  dietary_restrictions?: string,
  preferences?: string
}
```

### 2. `save_shopping_list`
**Propósito**: Guardar listas de compras con cantidades específicas.

**Cuándo usar**: Agente `shopping-list` después de generar la lista.

**Parámetros**:
```typescript
{
  phone_number: string,
  items: Array<{
    nombre: string,
    cantidad: string,
    unidad?: string,
    categoria?: string
  }>
}
```

### 3. `get_shopping_list_context`
**Propósito**: Recuperar la última lista de compras del usuario.

**Cuándo usar**: Agente `ecommerce` ANTES de consultar productos en Frest.

**Parámetros**:
```typescript
{
  phone_number: string
}
```

**Retorna**:
```json
{
  "success": true,
  "shopping_list": {
    "id": 123,
    "items": [...],
    "status": "pending"
  }
}
```

### 4. `create_frest_order_from_list`
**Propósito**: Crear pedido en Frest usando la lista guardada (¡automático!).

**Cuándo usar**: Agente `ecommerce` cuando el usuario confirma el pedido.

**Parámetros**:
```typescript
{
  phone_number: string,
  user_id: number,         // ID en Frest
  direccion_id: number,    // ID dirección en Frest
  ventana_id: number,      // ID ventana de despacho
  bodega_id: number,       // Default: 1
  tipo_pedido_id: number,  // 1=Despacho
  forma_pago: string       // "webpay" | "fpay"
}
```

**Flujo interno**:
1. Recupera lista de compras con cantidades ✅
2. Busca cada producto en Frest ✅
3. Mapea productos encontrados con cantidades originales ✅
4. Crea pedido automáticamente ✅
5. Guarda pedido en BD ✅
6. Marca lista como "ordered" ✅

---

## 🔄 Flujo Completo Mejorado

### Conversación Ideal:

**Usuario**: "Hazme un menú semanal, lista de compras y haz el pedido en frest"

**Bot** (Menu Planner Agent):
1. Genera menú semanal ✅
2. `save_weekly_menu()` ← **GUARDA CONTEXTO** 🔑
3. Envía menú al usuario

**Bot** (Shopping List Agent):
1. Genera lista de compras basada en menú
2. `save_shopping_list()` ← **GUARDA CANTIDADES** 🔑
3. Envía lista al usuario

**Bot** (Ecommerce Agent):
1. `get_shopping_list_context()` ← **RECUPERA CANTIDADES** 🔑
2. Busca usuario en Frest
3. `frest_consultar_productos()` con nombres de la lista
4. Presenta productos disponibles CON las cantidades guardadas
5. Usuario confirma
6. `create_frest_order_from_list()` ← **PEDIDO AUTOMÁTICO** 🔑
7. **¡NO pregunta cantidades!** ✅

---

## 📝 Archivos Modificados/Creados

### Nuevos Archivos:

**Migraciones**:
- `whatsapp/migrations/6_add_menu_and_shopping_lists.up.sql`
- `whatsapp/migrations/6_add_menu_and_shopping_lists.down.sql`

**Módulo de BD**:
- `whatsapp/db-menu.ts` - Funciones CRUD para menús/listas

**Tools**:
- `whatsapp/tools/save-weekly-menu.ts`
- `whatsapp/tools/save-shopping-list.ts`
- `whatsapp/tools/get-shopping-list-context.ts`
- `whatsapp/tools/create-frest-order-from-list.ts`

### Archivos Modificados:

**Agentes**:
- `whatsapp/agents/menu-planner.ts` - Ahora guarda menús automáticamente
- `whatsapp/agents/shopping-list.ts` - Ahora guarda listas automáticamente
- `whatsapp/agents/ecommerce.ts` - Ahora recupera contexto y crea pedidos automáticos

**Índices**:
- `whatsapp/tools/index.ts` - Exporta nuevas herramientas

---

## ✅ Beneficios

### 1. **Experiencia de Usuario Mejorada**
- ❌ Antes: "¿Cuánto quieres de cada producto?"
- ✅ Ahora: "Encontré tus productos con las cantidades de tu lista: Tomate 1.5kg, Lechuga 2un"

### 2. **Persistencia Real**
- El contexto se guarda en PostgreSQL, no solo en memoria
- Funciona incluso si el bot se reinicia
- Permite auditoría de qué se generó y cuándo

### 3. **Automatización Completa**
- Flujo de menú → lista → pedido sin intervención manual
- Reduce de 10+ pasos a 3 confirmaciones del usuario

### 4. **Trazabilidad**
- Cada pedido queda registrado con su lista de compras original
- Puedes saber qué menú generó qué pedido
- Análisis de productos más pedidos

### 5. **Escalabilidad**
- Soporta múltiples usuarios concurrentes
- Cada usuario tiene su propio historial
- No hay conflictos de contexto

---

## 🚀 Próximos Pasos (Mejoras Futuras)

### 1. **Sugerencias Inteligentes**
```sql
-- Analizar qué compra frecuentemente el usuario
SELECT nombre, COUNT(*) as frecuencia
FROM shopping_lists sl
JOIN json_array_elements(sl.items) item
WHERE phone_number = '56995545216'
GROUP BY nombre
ORDER BY frecuencia DESC;
```

### 2. **Optimización de Precios**
- Guardar histórico de precios
- Alertar cuando un producto sube/baja de precio
- Sugerir alternativas más baratas

### 3. **Recetas Personalizadas**
- Guardar recetas favoritas del usuario
- Sugerir menús basados en historial
- "Te gustó esto la semana pasada, ¿lo repetimos?"

### 4. **Integración con Calendario**
- Sincronizar menús con Google Calendar
- Recordatorios de días de compra
- Sugerencias basadas en eventos (asados, cumpleaños)

---

## 🧪 Testing

### Prueba Manual Completa:

```bash
# 1. Usuario: "hazme un menú semanal"
# → Bot genera menú
# → Bot llama save_weekly_menu()
# → Verificar en BD: SELECT * FROM weekly_menus ORDER BY id DESC LIMIT 1;

# 2. Usuario: "arma la lista de compras"
# → Bot genera lista con cantidades
# → Bot llama save_shopping_list()
# → Verificar en BD: SELECT * FROM shopping_lists ORDER BY id DESC LIMIT 1;

# 3. Usuario: "haz el pedido en frest"
# → Bot llama get_shopping_list_context()
# → Bot recupera cantidades guardadas
# → Bot presenta productos CON cantidades
# → Usuario confirma
# → Bot llama create_frest_order_from_list()
# → Verificar pedido creado en Frest
# → Verificar en BD: SELECT * FROM frest_orders ORDER BY id DESC LIMIT 1;
```

---

## 📚 Referencias

- [Frest API Documentation](../../Frest/LaVegaAdmin/BOT_API_DOCUMENTATION.md)
- [Frest Integration](./FREST_INTEGRATION.md)
- [Bot Integration Fixes](../../Frest/LaVegaAdmin/BOT_INTEGRATION_FIXES.md)

---

**Implementado por**: Claude Sonnet 4.5  
**Revisado por**: Camilo Espinoza  
**Estado**: ✅ Producción Ready

