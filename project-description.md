# PlanEat - Asistente de Planificación de Comidas con WhatsApp

## 🎯 Descripción General

PlanEat es un asistente conversacional inteligente basado en WhatsApp que ayuda a las familias a planificar sus comidas semanales, generar listas de compras optimizadas y realizar pedidos automáticos en el e-commerce Frest (como piloto). Utiliza Claude AI (Anthropic) para proporcionar una experiencia natural y personalizada.

## 🚀 Problema que Resuelve

Las familias enfrentan desafíos diarios en la planificación de comidas:

- **Falta de tiempo** para planificar menús semanales balanceados
- **Desperdicio de alimentos** por compras desorganizadas
- **Indecisión** sobre qué cocinar cada día
- **Proceso tedioso** de hacer listas de compras y pedidos online

PlanEat automatiza y simplifica todo este proceso en una conversación de WhatsApp.

## ✨ Características Principales

### 1. **Planificación de Menús Semanales**

- Genera menús personalizados para 7 días basados en:
  - Tamaño del hogar (adultos y niños)
  - Restricciones dietéticas (vegetariano, celíaco, etc.)
  - Preferencias culinarias (cocina chilena, internacional, saludable, etc.)
- **Genera imágenes visuales** del menú en formato tabla horizontal
- Considera balance nutricional y variedad
- Guarda el menú en la base de datos para contexto futuro

### 2. **Listas de Compras Inteligentes**

- Genera automáticamente listas de compras basadas en el menú semanal
- Calcula cantidades precisas según el número de personas
- Organiza productos por categorías (carnes, verduras, despensa, etc.)
- **Persiste las cantidades** para evitar repetir preguntas
- Mapea productos a catálogo de Frest con IDs reales

### 3. **Pedidos Automáticos en Frest**

- Busca o registra usuarios automáticamente
- Consulta productos disponibles con precios y stock en tiempo real
- Ofrece alternativas para productos sin stock
- **Crea pedidos automáticamente** desde listas guardadas (sin re-preguntar cantidades)
- Genera link de pago (Webpay o Oneclick)
- Seguimiento de estado del pedido

### 4. **Recetas Detalladas con Imágenes**

- Genera recetas completas con ingredientes e instrucciones
- Crea imágenes atractivas combinando:
  - Foto generada con Google AI del plato
  - Texto formateado de la receta
- Envía automáticamente por WhatsApp

### 5. **Gestión de Contexto Persistente**

- Guarda información del hogar (tamaño, preferencias)
- Almacena menús semanales generados
- Persiste listas de compras con cantidades
- Registra órdenes en Frest para seguimiento
- Permite flujos continuos sin perder información

## 🛠️ Stack Tecnológico

### Backend

- **Node.js 20.x** con TypeScript
- **PostgreSQL** - Base de datos principal
- **Express.js** - API REST

### AI & Agents

- **Claude 3.5 Sonnet** (Anthropic) - Modelo de lenguaje
- **Claude Agent SDK** - Framework multi-agente
- **MCP (Model Context Protocol)** - Herramientas personalizadas

### Integraciones

- **WhatsApp Business API** (vía Kapso.io)
- **Frest API** - E-commerce de alimentos
- **Google Generative AI** - Generación de imágenes de comida

### Procesamiento de Imágenes

- **Sharp** - Composición y manipulación de imágenes
- **SVG** - Renderizado de texto y diseños

## 🏗️ Arquitectura

### Multi-Agent System

PlanEat utiliza una arquitectura de agentes especializados:

```
┌─────────────────────────────────────────┐
│        Router Agent (Orquestador)       │
│  Analiza intención y deriva a agente    │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
    ┌───▼────┐       ┌─────▼──────┐
    │Onboarding│      │Menu Planner│
    │  Agent  │      │   Agent    │
    └────┬────┘      └─────┬──────┘
         │                 │
    ┌────▼─────┐    ┌─────▼──────┐
    │Shopping  │    │ E-commerce │
    │List Agent│    │   Agent    │
    └──────────┘    └────────────┘
```

**Agentes:**

1. **Router**: Analiza mensajes y deriva al agente correcto
2. **Onboarding**: Captura información del hogar y preferencias
3. **Menu Planner**: Genera menús semanales e imágenes
4. **Shopping List**: Crea listas de compras optimizadas
5. **E-commerce**: Gestiona pedidos en Frest

### Base de Datos

```sql
-- Estructura principal
households (hogares)
├── weekly_menus (menús generados)
├── shopping_lists (listas de compras)
└── frest_orders (pedidos en Frest)

conversations (conversaciones WhatsApp)
└── messages (historial de mensajes)
```

## 🔄 Flujo de Usuario Típico

### Escenario Completo

1. **Usuario**: "Necesito un menú semanal para 4 personas"
   - **Bot**: Captura contexto (preferencias, restricciones)
2. **Bot genera menú**:

   - Crea menú personalizado para 7 días
   - **Genera imagen visual** del menú (formato tabla)
   - Envía imagen primero, luego texto
   - Guarda menú en BD

3. **Usuario**: "Dame la lista de compras"

   - **Bot**: Genera lista con cantidades precisas
   - Organiza por categorías
   - **Guarda lista con cantidades en BD**

4. **Usuario**: "Haz el pedido en Frest"

   - **Bot**: Busca/registra usuario automáticamente
   - Consulta productos en catálogo
   - Muestra disponibles y alternativas
   - Usuario confirma

5. **Bot crea pedido**:

   - **Recupera cantidades de la lista guardada** (no re-pregunta)
   - Pregunta forma de pago (Webpay/Oneclick)
   - Crea pedido automáticamente
   - Envía link de pago

6. **Usuario paga y listo** ✅

## 🔧 Herramientas MCP Personalizadas

PlanEat implementa 15+ herramientas MCP:

### Contexto de Usuario

- `get_user_context` - Obtener información del hogar
- `save_household_info` - Guardar preferencias

### Menús y Listas

- `save_weekly_menu` - Persistir menú generado
- `save_shopping_list` - Guardar lista con cantidades
- `get_shopping_list_context` - Recuperar lista para pedidos

### Frest API

- `frest_buscar_usuario` - Buscar usuario por teléfono
- `frest_registrar_usuario` - Crear nuevo usuario
- `frest_crear_direccion` - Agregar dirección de despacho
- `frest_consultar_productos` - Buscar productos en catálogo
- `frest_crear_pedido` - Crear orden de compra
- `frest_consultar_estado_pedido` - Seguimiento
- `create_frest_order_from_list` - Pedido automático desde lista guardada

### Generación de Contenido

- `generate_recipe_image` - Crear imagen de receta
- `generate_weekly_menu_image` - Crear imagen de menú semanal

### WhatsApp

- `send_whatsapp_message` - Enviar mensajes
- `send_reaction` - Enviar reacciones emoji

## 📊 Métricas y Objetivos

### KPIs

- **Engagement**: % usuarios que generan menú → lista → pedido
- **Retención**: Usuarios que usan el bot semanalmente
- **Conversión**: % de listas que resultan en pedidos
- **Ahorro de tiempo**: Reducción en tiempo de planificación (objetivo: 80%)

### Objetivos de Negocio

- Aumentar ventas en Frest mediante automatización
- Reducir fricción en el proceso de compra
- Fidelizar clientes con planificación continua
- Recopilar datos de preferencias para personalización

## 🚧 Estado Actual y Roadmap

### ✅ Implementado

- Sistema multi-agente con Claude
- Generación de menús personalizados
- Imágenes visuales de menús (formato tabla)
- Persistencia de contexto (menús, listas, pedidos)
- Integración completa con Frest API
- Pedidos automáticos desde listas guardadas
- Generación de imágenes de recetas

### 🔜 Próximas Mejoras

1. **Análisis nutricional** con macros y calorías
2. **Filtros de precio** en listas de compras
3. **Recetas expandidas** con videos paso a paso
4. **Notificaciones proactivas** de descuentos
5. **Historial de pedidos** y re-orden rápido
6. **Integración con otros e-commerce** (Jumbo, Líder)
7. **Export a PDF** de menús y listas
8. **Dashboard web** para visualización de datos

## 📝 Licencia y Autor

**Proyecto**: PlanEat  
**Autor**: Camilo Espinoza  
**Contexto**: Platanus Hack 2025  
**Repositorio**: [GitHub - PlanEat](https://github.com/CamiloEspinoza/PlanEat)

---

**Última actualización**: Noviembre 23, 2025
