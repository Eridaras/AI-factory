#!/usr/bin/env node

/**
 * MCP Server para Diseño y Generación de UI usando Gemini
 * 
 * Este servidor expone herramientas para generar componentes frontend
 * y analizar contexto visual para el ecosistema de diseño.
 * 
 * Usa la Gemini API (gemini-3-flash-preview) para:
 * - Generación de código React/Vue/Tailwind
 * - Análisis de imágenes para comprensión de UI
 * - Modelo más inteligente y rápido con capacidades superiores
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env manualmente sin usar dotenv (para evitar output a stdout/stderr)
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        process.env[key.trim()] = value;
      }
    }
  });
}

// Configuración de Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LOG_FILE = path.join(__dirname, "gemini-design.log");

/**
 * Logger para el servidor MCP
 * Escribe en archivo de log sin interferir con stdio (usado por MCP)
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  
  try {
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (err) {
    // En caso extremo, no romper el MCP por fallo al loguear
  }
}

if (!GEMINI_API_KEY) {
  log("ERROR: GEMINI_API_KEY no está configurada en las variables de entorno");
  process.exit(1);
}

log("MCP Gemini Design Server iniciando...");

// Inicializar cliente de Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

/**
 * Herramienta: generate_frontend_component
 * Genera código de componentes frontend y lo guarda en archivo
 */
async function generateFrontendComponent(spec, filename, targetPath) {
  log(`generate_frontend_component llamada con: ${filename} en ${targetPath}`);
  
  // Validación de entrada
  if (!spec || !filename || !targetPath) {
    const error = "Invalid input: 'spec', 'filename' and 'target_path' are required";
    log(`ERROR: ${error}`);
    throw new Error(error);
  }
  
  // Detectar tipo de archivo por extensión
  const ext = path.extname(filename).toLowerCase();
  let frameworkPrompt = "";
  
  if (ext === ".tsx" || ext === ".jsx") {
    frameworkPrompt = `
Genera un componente React moderno usando:
- TypeScript (si .tsx) o JavaScript (si .jsx)
- Tailwind CSS para estilos
- Hooks modernos (useState, useEffect si es necesario)
- Props tipadas con TypeScript interfaces
- Código limpio y bien comentado
`;
  } else if (ext === ".vue") {
    frameworkPrompt = `
Genera un componente Vue 3 usando:
- Composition API con <script setup>
- TypeScript
- Tailwind CSS para estilos
- Props tipadas
- Código limpio y bien comentado
`;
  } else if (ext === ".html") {
    frameworkPrompt = `
Genera HTML semántico moderno con:
- Tailwind CSS para estilos
- JavaScript vanilla si es necesario
- Accesibilidad (aria-labels, roles)
- Código limpio y bien comentado
`;
  } else {
    frameworkPrompt = `
Genera código frontend limpio y profesional.
`;
  }

  const prompt = `
${frameworkPrompt}

ESPECIFICACIÓN DEL COMPONENTE:
${spec}

NOMBRE DEL ARCHIVO: ${filename}

INSTRUCCIONES CRÍTICAS:
1. Devuelve SOLO el código del componente, sin explicaciones adicionales
2. NO uses markdown fences (\`\`\`), devuelve código puro
3. El código debe ser production-ready, sin TODOs ni placeholders
4. Incluye todos los imports necesarios
5. Usa Tailwind classes para estilos (no CSS inline ni <style>)
6. El código debe ser autocontenido y funcional

Genera el código ahora:
`;

  log(`Llamando a Gemini API para generar ${filename}`);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let code = response.text();
    
    log(`Gemini API respondió exitosamente (${code.length} chars)`);
    
    // Limpiar markdown fences si los hay (por si Gemini no sigue instrucciones)
    code = code.replace(/```[a-z]*\n?/g, "").replace(/```\n?$/g, "").trim();
    
    // Asegurar que el directorio existe
    const fullTargetPath = path.resolve(targetPath);
    if (!fs.existsSync(fullTargetPath)) {
      log(`Creando directorio: ${fullTargetPath}`);
      fs.mkdirSync(fullTargetPath, { recursive: true });
    }
    
    // Escribir archivo
    const filePath = path.join(fullTargetPath, filename);
    fs.writeFileSync(filePath, code, "utf8");
    
    log(`✅ Archivo guardado exitosamente: ${filePath}`);
    
    return {
      success: true,
      file_path: filePath,
      file_name: filename,
      message: `✅ Archivo guardado en ${filePath}. Revisa el código.`
    };
    
  } catch (error) {
    log(`ERROR en generate_frontend_component: ${error.message}`);
    throw error;
  }
}

/**
 * Herramienta: analyze_image_context
 * Analiza una imagen de UI y describe su contenido para comprensión
 */
async function analyzeImageContext(imagePath) {
  log(`analyze_image_context llamada con: ${imagePath}`);
  
  // Validación de entrada
  if (!imagePath) {
    const error = "Invalid input: 'image_path' is required";
    log(`ERROR: ${error}`);
    throw new Error(error);
  }
  
  // Verificar que el archivo existe
  const fullImagePath = path.resolve(imagePath);
  if (!fs.existsSync(fullImagePath)) {
    const error = `Image file not found: ${fullImagePath}`;
    log(`ERROR: ${error}`);
    throw new Error(error);
  }
  
  try {
    // Leer imagen y convertir a base64
    const imageBuffer = fs.readFileSync(fullImagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Detectar tipo MIME por extensión
    const ext = path.extname(fullImagePath).toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".gif") mimeType = "image/gif";
    else if (ext === ".webp") mimeType = "image/webp";
    
    log(`Analizando imagen (${imageBuffer.length} bytes, ${mimeType})`);
    
    const prompt = `
Analiza esta imagen de interfaz de usuario y describe:

1. **Estructura visual:** Layout general, secciones principales
2. **Componentes detectados:** Botones, formularios, cards, navegación, etc.
3. **Esquema de colores:** Paleta dominante
4. **Tipografía:** Estilos de texto aparentes
5. **Interacciones:** Elementos clickeables, inputs, etc.
6. **Propósito:** ¿Qué tipo de UI es? (dashboard, landing, form, etc.)

Sé detallado pero conciso. Esta descripción será usada por una IA para replicar la UI.
`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    };
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const analysis = response.text();
    
    log(`✅ Imagen analizada exitosamente (${analysis.length} chars)`);
    
    return {
      success: true,
      image_path: fullImagePath,
      analysis: analysis
    };
    
  } catch (error) {
    log(`ERROR en analyze_image_context: ${error.message}`);
    throw error;
  }
}

// Crear servidor MCP
const server = new Server(
  {
    name: "gemini-design",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Registrar herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  log("ListTools request received");
  
  return {
    tools: [
      {
        name: "generate_frontend_component",
        description: `Genera código de componentes frontend (React/Vue/HTML) y lo guarda directamente en un archivo.
NO devuelve el código al chat, escribe el archivo en disco.
Usa Gemini 3 Flash Preview - el modelo más inteligente y rápido de Gemini para generación de código UI de alta calidad.`,
        inputSchema: {
          type: "object",
          properties: {
            spec: {
              type: "string",
              description: "Descripción detallada del componente a generar (funcionalidad, estilo, comportamiento)"
            },
            filename: {
              type: "string",
              description: "Nombre del archivo a crear (ej: Navbar.tsx, Button.vue, Hero.html)"
            },
            target_path: {
              type: "string",
              description: "Ruta del directorio donde guardar el archivo (ej: src/components, app/ui)"
            }
          },
          required: ["spec", "filename", "target_path"]
        }
      },
      {
        name: "analyze_image_context",
        description: `Analiza una imagen de interfaz de usuario y describe sus elementos, estructura y diseño.
Útil para comprender mockups, screenshots o referencias de diseño antes de replicarlos.`,
        inputSchema: {
          type: "object",
          properties: {
            image_path: {
              type: "string",
              description: "Ruta local a la imagen a analizar (jpg, png, gif, webp)"
            }
          },
          required: ["image_path"]
        }
      }
    ]
  };
});

// Manejar llamadas a herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  log(`Herramienta invocada: ${name}`);

  try {
    if (name === "generate_frontend_component") {
      const result = await generateFrontendComponent(
        args.spec,
        args.filename,
        args.target_path
      );
      
      return {
        content: [
          {
            type: "text",
            text: result.message
          }
        ]
      };
    }

    if (name === "analyze_image_context") {
      const result = await analyzeImageContext(args.image_path);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }

    log(`ERROR: Herramienta desconocida: ${name}`);
    throw new Error(`Herramienta desconocida: ${name}`);
  } catch (error) {
    log(`ERROR en herramienta ${name}: ${error.message}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: true,
            message: error.message
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("MCP Gemini Design Server conectado y listo");
}

main().catch((error) => {
  log(`ERROR FATAL al iniciar servidor: ${error.message}`);
  process.exit(1);
});
