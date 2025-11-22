<div align="center">
  <img src="project-logo.png" alt="PlanEat Logo" width="500"/>
</div>

# 🍽️ PlanEat - Tu Asistente Inteligente de Planificación de Comidas

**PlanEat** es un asistente conversacional por WhatsApp que ayuda a familias chilenas a planificar sus comidas semanales, gestionar preferencias alimentarias y generar listas de compras inteligentes.

## 🌟 ¿Qué hace PlanEat?

PlanEat simplifica la vida familiar al ayudarte con:

- **🏠 Gestión del Hogar**: Crea tu perfil familiar con todos los miembros, sus edades y preferencias
- **🍜 Planificación de Menús**: Obtén sugerencias de comidas basadas en tus gustos (peruana, italiana, mexicana, etc.)
- **🛒 Listas de Compras**: Genera automáticamente listas de ingredientes necesarios
- **👨‍👩‍👧‍👦 Preferencias Personalizadas**: Guarda restricciones dietéticas, alergias y objetivos de cada familia
- **💬 Conversacional**: Interactúa naturalmente por WhatsApp como si hablaras con un asistente personal

## 🤖 Tecnología

PlanEat está construido con tecnología de punta:

- **Claude Agent SDK**: Inteligencia artificial conversacional avanzada de Anthropic
- **Encore.ts**: Framework backend moderno para TypeScript con infraestructura automática
- **PostgreSQL**: Base de datos robusta para gestionar hogares y conversaciones
- **Kapso WhatsApp API**: Integración nativa con WhatsApp para comunicación fluida
- **Persistencia de Sesión**: El asistente recuerda tus conversaciones durante 2 horas

## 🏗️ Arquitectura

```
Usuario (WhatsApp) → Kapso API → Webhook Encore
                                      ↓
                              Message Processor
                                      ↓
                    Claude Agent SDK (Sonnet 4.5)
                          ↓           ↓
                    Database    WhatsApp Response
                   (PostgreSQL)
```

### Servicios

- **`whatsapp/`**: Servicio principal con webhooks, procesamiento de mensajes y tools del agente
- **Base de datos**: Gestión de usuarios, hogares, miembros y estado de conversaciones

## 🚀 Características Principales

### Gestión Familiar Inteligente

El bot identifica automáticamente a los miembros de tu familia cuando los mencionas:

```
Usuario: "Soy Camilo, vivo con mi esposa Catalina y mis hijos Benjamín (14) y Emilia (7)"
PlanEat: "¡Perfecto! He creado tu hogar con 4 miembros. ¿Tienen alguna restricción alimentaria?"
```

### Continuidad de Conversación

PlanEat recuerda tus conversaciones anteriores durante 2 horas, permitiendo diálogos naturales:

```
Mensaje 1: "Hola, soy nuevo"
Mensaje 2: "Me gusta la comida peruana"
Mensaje 3: "Y también italiana"
→ PlanEat recordará toda la conversación
```

### Tools Disponibles

El agente tiene acceso a 5 herramientas especializadas:

1. **`get_user_context`**: Obtiene información del usuario y su hogar
2. **`create_household`**: Crea un nuevo hogar con información básica
3. **`add_household_members`**: Agrega miembros al hogar (con o sin WhatsApp)
4. **`send_whatsapp_message`**: Envía respuestas al usuario
5. **`save_conversation_state`**: Guarda el progreso de la conversación

## 📊 Base de Datos

### Tablas

- **`users`**: Usuarios identificados por número de WhatsApp
- **`households`**: Hogares/familias con preferencias y restricciones
- **`household_members`**: Miembros de cada hogar (admin, member)
- **`conversations`**: Estado de conversaciones con persistencia de sesión

## 🛠️ Desarrollo Local

### Requisitos

- Node.js 20+
- Encore CLI
- PostgreSQL (gestionado automáticamente por Encore)
- Claude API Key
- Kapso WhatsApp API credentials

### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd planeat

# Instalar dependencias
npm install

# Configurar secrets
encore secret set --type local ANTHROPIC_API_KEY
encore secret set --type local KAPSO_API_KEY
encore secret set --type local KAPSO_PHONE_NUMBER_ID

# Correr en desarrollo
encore run
```

### Webhook Local con ngrok

```bash
# Terminal 1: Correr Encore
encore run

# Terminal 2: Exponer puerto con ngrok
ngrok http 4000

# Configurar webhook en Kapso Dashboard
URL: https://tu-url.ngrok.io/webhooks/whatsapp
Eventos: whatsapp.message.received
```

## 🔒 Variables de Entorno

El proyecto usa el sistema de secrets de Encore:

- `ANTHROPIC_API_KEY`: API key de Claude
- `KAPSO_API_KEY`: API key de Kapso
- `KAPSO_PHONE_NUMBER_ID`: ID del número de WhatsApp

## 📝 Logs y Debugging

PlanEat incluye logging detallado para debugging:

```
🤖 Using Claude Agent SDK
📝 Resuming existing session: abc123...
🎯 Starting Agent SDK query with config:
   Model: claude-sonnet-4-5-20250929
   Permission Mode: bypassPermissions
   Max Turns: 15
   Phone: 56995545216
   Session: Resume abc123...

🔧 TOOL CALLED: get_user_context
   Phone: 56995545216
   Result: User does not exist

🔧 TOOL CALLED: create_household
   Admin: 56995545216
   Name: Camilo
   Size: 4
✅ Household created successfully! ID: 1

💾 Session saved: abc123...
✅ Message processed successfully
```

## 🤝 Contribuir

¿Quieres mejorar PlanEat? Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto fue creado durante el Platanus Hack 2025.

## 🙏 Agradecimientos

- **Anthropic** por Claude Agent SDK
- **Encore** por el framework backend increíble
- **Kapso** por la integración con WhatsApp
- **Platanus** por organizar el hackathon

---

**Desarrollado con ❤️ para familias chilenas que quieren comer mejor y planificar más fácil**
