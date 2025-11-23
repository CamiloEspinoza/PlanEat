/**
 * Tool: generate_weekly_menu_image
 * Genera una imagen visual del menú semanal completo
 */

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { config } from "../../config/env";
import { composeWeeklyMenuImage } from "../clients/image-composer";
import { sendImageMessage } from "../whatsapp-client";

// Helper para guardar imagen y obtener URL pública
async function saveImageAndGetUrl(
  imageBuffer: Buffer,
  filename: string
): Promise<string> {
  const imagesDir = path.join(process.cwd(), "generated-images");
  const filepath = path.join(imagesDir, filename);

  await fs.writeFile(filepath, imageBuffer);
  console.log(`💾 Image saved: ${filepath}`);

  const publicUrl = `${config.publicUrl}/images/${filename}`;
  console.log(`🔗 Public URL: ${publicUrl}`);
  return publicUrl;
}

/**
 * Tool MCP para generar y enviar imagen de menú semanal
 */
export const generateWeeklyMenuImageTool = tool(
  "generate_weekly_menu_image",
  "Genera una imagen visual del menú semanal completo y la envía automáticamente por WhatsApp. " +
    "IMPORTANTE: Usa esta herramienta ANTES de enviar el menú como texto. " +
    "La imagen muestra los 7 días de la semana con sus platos de forma atractiva.",
  {
    phone_number: z
      .string()
      .describe("Número de teléfono del usuario (formato: +56912345678)"),
    menu_data: z
      .object({
        lunes: z.object({
          nombre: z.string(),
          descripcion: z.string().optional(),
        }),
        martes: z.object({
          nombre: z.string(),
          descripcion: z.string().optional(),
        }),
        miercoles: z.object({
          nombre: z.string(),
          descripcion: z.string().optional(),
        }),
        jueves: z.object({
          nombre: z.string(),
          descripcion: z.string().optional(),
        }),
        viernes: z.object({
          nombre: z.string(),
          descripcion: z.string().optional(),
        }),
        sabado: z.object({
          nombre: z.string(),
          descripcion: z.string().optional(),
        }),
        domingo: z.object({
          nombre: z.string(),
          descripcion: z.string().optional(),
        }),
      })
      .describe(
        "Menú semanal con estructura: {lunes: {nombre, descripcion}, martes: {...}, ...}"
      ),
    household_size: z
      .number()
      .optional()
      .describe("Cantidad de personas (opcional, para mostrar en la imagen)"),
  },
  async ({ phone_number, menu_data, household_size }) => {
    console.log("🔧 TOOL CALLED: generate_weekly_menu_image");
    console.log(`   For: ${phone_number}`);
    console.log(`   Household size: ${household_size || "not specified"}`);

    try {
      // Paso 1: Generar la imagen del menú
      console.log("🖼️ Step 1/3: Generating weekly menu image...");
      const menuImageBuffer = await composeWeeklyMenuImage(
        menu_data,
        household_size
      );

      // Paso 2: Guardar imagen y obtener URL
      console.log("💾 Step 2/3: Saving image to disk...");
      const timestamp = Date.now();
      const filename = `${timestamp}-menu-semanal.png`;
      const imageUrl = await saveImageAndGetUrl(menuImageBuffer, filename);

      // Paso 3: Enviar por WhatsApp
      console.log("📤 Step 3/3: Sending image via WhatsApp...");
      await sendImageMessage(
        phone_number,
        imageUrl,
        "🗓️ Tu Menú Semanal Personalizado"
      );

      console.log(`✅ Weekly menu image sent successfully to ${phone_number}`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              message: "Imagen del menú semanal enviada exitosamente",
              image_url: imageUrl,
            }),
          },
        ],
      };
    } catch (error: any) {
      console.error("❌ Error generating weekly menu image:", error);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: `No se pudo generar la imagen del menú. Error: ${error.message}`,
            }),
          },
        ],
      };
    }
  }
);

/**
 * Handler para uso directo (sin MCP)
 */
export async function generateWeeklyMenuImage(
  phoneNumber: string,
  menuData: any,
  householdSize?: number
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🎨 Generating weekly menu image for ${phoneNumber}`);

    const menuImageBuffer = await composeWeeklyMenuImage(
      menuData,
      householdSize
    );

    const timestamp = Date.now();
    const filename = `${timestamp}-menu-semanal.png`;
    const imageUrl = await saveImageAndGetUrl(menuImageBuffer, filename);

    await sendImageMessage(
      phoneNumber,
      imageUrl,
      "🗓️ Tu Menú Semanal Personalizado"
    );

    console.log(`✅ Weekly menu image sent successfully to ${phoneNumber}`);

    return {
      success: true,
      message: "Imagen del menú semanal enviada exitosamente",
    };
  } catch (error: any) {
    console.error("❌ Error generating weekly menu image:", error);

    return {
      success: false,
      message: `No se pudo generar la imagen del menú. Error: ${error.message}`,
    };
  }
}

