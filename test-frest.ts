#!/usr/bin/env tsx
/**
 * Script de prueba para verificar la integración con Frest API
 */

import "./config/env";
import { frestClient } from "./whatsapp/clients/frest-client";

async function testFrestIntegration() {
  console.log("🧪 Iniciando pruebas de Frest API...\n");
  
  // Test 1: Verificar conexión
  console.log("📡 Test 1: Verificar conexión con Frest API");
  console.log(`   URL: ${process.env.FREST_API_URL}`);
  console.log(`   API Key configurada: ${process.env.FREST_API_KEY ? "✅ Sí" : "❌ No"}\n`);
  
  if (!process.env.FREST_API_KEY) {
    console.error("❌ FREST_API_KEY no está configurada en .env");
    console.log("\n💡 Agrega estas variables a tu .env:");
    console.log("   FREST_API_URL=http://localhost:8001");
    console.log("   FREST_API_KEY=tu_api_key_aqui\n");
    process.exit(1);
  }
  
  try {
    // Test 2: Buscar usuario de prueba
    console.log("🔍 Test 2: Buscar usuario de prueba");
    const telefono = "56995545216"; // Número de prueba
    console.log(`   Buscando teléfono: ${telefono}`);
    
    const busquedaResult = await frestClient.buscarUsuarioPorTelefono(telefono);
    
    if (busquedaResult.encontrado && busquedaResult.data) {
      const usuario = busquedaResult.data;
      console.log("   ✅ Usuario encontrado:");
      console.log(`      - ID: ${usuario.user_id}`);
      console.log(`      - Nombre: ${usuario.nombre_completo}`);
      console.log(`      - Email: ${usuario.email}`);
      console.log(`      - Direcciones: ${usuario.direcciones?.length || 0}`);
    } else {
      console.log("   ℹ️  Usuario no encontrado (esto es normal si es la primera vez)");
    }
    
    // Test 3: Consultar productos
    console.log("\n🛒 Test 3: Consultar productos");
    const productosTest = ["Tomate", "Lechuga", "Palta"];
    console.log(`   Buscando: ${productosTest.join(", ")}`);
    
    const productosResult = await frestClient.consultarProductos(productosTest);
    
    console.log(`   ✅ Productos encontrados: ${productosResult.productos.length}/${productosResult.resumen.total_buscados}`);
    
    for (const producto of productosResult.productos.slice(0, 3)) {
      console.log(`      - ${producto.nombre}: $${producto.precio} (stock: ${producto.stock_disponible} ${producto.unidad})`);
    }
    
    if (productosResult.no_encontrados.length > 0) {
      console.log(`   ⚠️  No encontrados: ${productosResult.no_encontrados.length} productos`);
      for (const noEncontrado of productosResult.no_encontrados.slice(0, 2)) {
        console.log(`      - ${noEncontrado.buscado}`);
        if (noEncontrado.alternativas.length > 0) {
          console.log(`        💡 Alternativa: ${noEncontrado.alternativas[0].nombre}`);
        }
      }
    }
    
    console.log("\n✅ ¡Todas las pruebas pasaron exitosamente!");
    console.log("\n📝 Próximos pasos:");
    console.log("   1. Envía un mensaje por WhatsApp: 'quiero comprar tomates'");
    console.log("   2. El bot detectará la intención y usará el agente de ecommerce");
    console.log("   3. El flujo completo incluirá:");
    console.log("      - Buscar/registrar usuario");
    console.log("      - Consultar productos");
    console.log("      - Crear pedido");
    console.log("      - Generar link de pago");
    
  } catch (error: any) {
    console.error("\n❌ Error durante las pruebas:");
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes("ECONNREFUSED")) {
      console.log("💡 Solución: Asegúrate de que Frest API esté corriendo:");
      console.log("   cd /ruta/a/LaVegaAdmin");
      console.log("   php artisan serve --port=8001\n");
    } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      console.log("💡 Solución: Verifica que FREST_API_KEY sea correcta\n");
    } else if (error.message.includes("404")) {
      console.log("💡 Solución: Verifica que FREST_API_URL apunte al servidor correcto\n");
    }
    
    process.exit(1);
  }
}

// Ejecutar tests
testFrestIntegration().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});

