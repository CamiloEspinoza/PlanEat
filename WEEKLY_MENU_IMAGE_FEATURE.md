# Generación de Imágenes para Menús Semanales

**Fecha**: 23 de Noviembre, 2025  
**Feature**: Imagen visual del menú semanal completo

---

## 🎨 ¿Qué se implementó?

### Antes:
Usuario: "Hazme un menú semanal"  
Bot: [Envía solo texto plano con el menú]

### Ahora:
Usuario: "Hazme un menú semanal"  
Bot: **[Envía primero una imagen visual hermosa del menú]**  
Bot: [Después envía el texto del menú]

---

## 🖼️ Diseño de la Imagen (Formato TABLA)

La imagen del menú semanal usa un formato de **tabla horizontal**:

✅ **Header principal** con degradado morado/azul horizontal  
✅ **Título grande**: "🗓️ Menú Semanal"  
✅ **Subtítulo** con cantidad de personas  
✅ **Tabla con 7 columnas** (días de la semana):
   - **Header de tabla**: Emoji + nombre corto del día (LUN, MAR, MIÉ...)
   - **Fila de platos**: Nombre del plato wrapeado (máx 4 líneas)
   - Bordes y separadores entre columnas
   - Fondo con color temático de cada día (15% opacidad)
✅ **Footer** con "Generado con ❤️ por PlanEat"

### Dimensiones:
- **1080px** de ancho × **~430px** de alto
- Mucho más compacto que el diseño anterior
- Perfecto para WhatsApp y visualización móvil

### Colores por Día:
- 🌟 Lunes: Azul (`#3498db`)
- 🔥 Martes: Rojo (`#e74c3c`)
- 🌮 Miércoles: Naranja (`#f39c12`)
- 🐟 Jueves: Turquesa (`#1abc9c`)
- 🍕 Viernes: Morado (`#9b59b6`)
- 🥩 Sábado: Naranja oscuro (`#e67e22`)
- 🍗 Domingo: Verde (`#2ecc71`)

---

## 📝 Archivos Creados/Modificados

### Nuevos Archivos:
1. **`whatsapp/tools/generate-weekly-menu-image.ts`**
   - Nueva herramienta MCP para generar imagen del menú
   - Usa Google AI para generar imágenes de comida (futuro)
   - Composición con Sharp
   - Envío automático por WhatsApp

### Archivos Modificados:
1. **`whatsapp/clients/image-composer.ts`**
   - Agregada función `composeWeeklyMenuImage()`
   - Genera SVG del menú completo
   - Renderiza a PNG de 1080px de ancho

2. **`whatsapp/tools/index.ts`**
   - Exporta `generateWeeklyMenuImageTool`

3. **`whatsapp/agents/menu-planner.ts`**
   - Agregada herramienta `generate_weekly_menu_image`
   - Actualizado el prompt con instrucciones críticas:
     - **PRIMERO** generar imagen
     - **DESPUÉS** enviar texto

---

## 🔄 Flujo de Funcionamiento

### 1. Usuario Pide Menú:
```
Usuario: "Hazme un menú semanal para 4 personas"
```

### 2. Bot Genera Datos del Menú:
El agente `menu-planner` crea el menú con esta estructura:
```typescript
{
  lunes: {
    nombre: "Fideos con salsa boloñesa",
    descripcion: "Fideos con carne molida y salsa de tomate"
  },
  martes: {
    nombre: "Pollo al horno con papas",
    descripcion: "Pollo asado con papas y zanahoria"
  },
  // ... resto de días
}
```

### 3. Bot Genera Imagen (PRIMERO):
```typescript
generate_weekly_menu_image({
  phone_number: "56995545216",
  menu_data: menuData,
  household_size: 4
})
```

**Proceso interno**:
1. `composeWeeklyMenuImage()` genera SVG del menú
2. Sharp renderiza el SVG a PNG de 1080x~1400px
3. Se guarda en `generated-images/[timestamp]-menu-semanal.png`
4. Se obtiene URL pública: `https://planeat.life/images/[timestamp]-menu-semanal.png`
5. `sendImageMessage()` envía la imagen por WhatsApp

### 4. Bot Envía Texto (DESPUÉS):
```typescript
send_whatsapp_message({
  phone_number: "56995545216",
  message: "🗓️ **MENÚ SEMANAL**\n\n**LUNES**\n🍝 Fideos con salsa boloñesa\n..."
})
```

---

## 🛠️ Estructura Técnica

### Input Schema:
```typescript
{
  phone_number: string,        // "56995545216"
  menu_data: {
    lunes: {
      nombre: string,           // "Fideos con salsa boloñesa"
      descripcion?: string      // Opcional
    },
    martes: { ... },
    miercoles: { ... },
    jueves: { ... },
    viernes: { ... },
    sabado: { ... },
    domingo: { ... }
  },
  household_size?: number       // 4 (opcional)
}
```

### Output:
```json
{
  "success": true,
  "message": "Imagen del menú semanal enviada exitosamente",
  "image_url": "https://planeat.life/images/1732394562-menu-semanal.png"
}
```

---

## 🎯 Especificaciones de Diseño

### Dimensiones:
- **Ancho**: 1080px (WhatsApp optimal)
- **Alto**: ~430px (¡mucho más compacto!)
- **Formato**: Tabla con 7 columnas (días)

### Tipografía:
- **Título**: 48px, bold, blanco
- **Subtítulo**: 24px, blanco, 90% opacidad
- **Día (corto)**: 20px, bold, gris oscuro
- **Emoji día**: 28px
- **Plato**: 18px, regular, gris medio

### Componentes:
- **Header principal**: 140px, degradado horizontal morado-azul
- **Header tabla**: 80px con emoji + nombre corto del día
- **Fondo columnas**: Color temático con 15% opacidad
- **Celdas**: 120px de alto, borde gris claro
- **Footer**: 60px, fondo gris claro

---

## 🧪 Testing

### Prueba Manual:

1. **Reiniciar el bot**:
```bash
cd /Users/camiloespinoza/PlatanusHack/planeat/planeat
npm run dev
```

2. **Enviar mensaje por WhatsApp**:
```
"Hazme un menú semanal para 4 personas"
```

3. **Verificar**:
   - ✅ Primero llega la imagen del menú (hermosa y visual)
   - ✅ Después llega el texto del menú
   - ✅ La imagen se guarda en `generated-images/`
   - ✅ El menú se guarda en la BD (tabla `weekly_menus`)

### Verificar en BD:
```sql
-- Ver último menú generado
SELECT * FROM weekly_menus ORDER BY created_at DESC LIMIT 1;

-- Ver imagen generada
ls -lh generated-images/ | tail -1
```

---

## 🚀 Mejoras Futuras

### 1. **Imágenes de Comida Reales**
Actualmente la imagen solo tiene el diseño del menú. Se puede mejorar agregando fotos de cada plato usando Google AI:

```typescript
// Para cada día, generar imagen de la comida
const foodImage = await generateFoodImage(plato.nombre);
// Incorporar en el card
```

### 2. **Personalización de Colores**
Permitir que el usuario elija su tema de colores favorito:
- Clásico (actual)
- Pastel
- Oscuro
- Minimalista

### 3. **Export a PDF**
Opción para descargar el menú como PDF imprimible:
```
"¿Quieres descargar el menú en PDF?"
→ Genera PDF con Sharp
→ Envía por WhatsApp
```

### 4. **Recetas Expandidas**
Al hacer clic en un día (futuro con interactividad), mostrar la receta completa con ingredientes e instrucciones.

### 5. **Vista Calendario**
Mostrar el menú en formato calendario con fechas reales:
```
📅 Semana del 25 Nov - 1 Dic
```

---

## 📊 Métricas de Éxito

### KPIs a Monitorear:

1. **Engagement**:
   - % de usuarios que piden el menú semanal
   - % que generan lista de compras después del menú
   - % que hacen pedido en Frest después de la lista

2. **Calidad**:
   - Tiempo de generación de imagen (<5s ideal)
   - Tamaño de imagen (<500KB ideal)
   - Tasa de error en generación

3. **Satisfacción**:
   - Reacciones positivas en WhatsApp
   - Usuarios que repiten la solicitud semanalmente
   - Feedback cualitativo

### Query para Analytics:
```sql
-- Menús generados por día
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as menus_generados,
  COUNT(DISTINCT phone_number) as usuarios_unicos
FROM weekly_menus
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

---

## 🐛 Troubleshooting

### Problema: Imagen no se genera
**Síntomas**: Error en consola, imagen no llega por WhatsApp

**Soluciones**:
1. Verificar que Sharp esté instalado: `npm list sharp`
2. Verificar permisos en `generated-images/`: `ls -ld generated-images/`
3. Verificar logs: ver `console.error` en la terminal del bot

### Problema: Imagen llega vacía o corrupta
**Síntomas**: WhatsApp muestra icono de imagen rota

**Soluciones**:
1. Verificar que el SVG se generó correctamente (agregar log)
2. Verificar que Sharp pudo renderizar el PNG
3. Verificar que la URL pública es accesible

### Problema: Bot envía texto antes que imagen
**Síntomas**: Orden incorrecto de mensajes

**Soluciones**:
1. Verificar que el prompt del agente está actualizado
2. Verificar que Claude está usando `await` en la imagen
3. Revisar logs para ver orden de ejecución

---

## 📚 Referencias

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [SVG Specification](https://www.w3.org/TR/SVG2/)
- [WhatsApp Business API - Images](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media)
- [Image Composer Code](./whatsapp/clients/image-composer.ts)

---

**Implementado por**: Claude Sonnet 4.5  
**Revisado por**: Camilo Espinoza  
**Estado**: ✅ Listo para Probar  
**Compilación**: ✅ Exitosa

