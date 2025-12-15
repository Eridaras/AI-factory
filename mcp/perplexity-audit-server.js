#!/usr/bin/env node

/**
 * MCP Server para Auditoría de Código usando Perplexity
 * 
 * Este servidor expone herramientas de research técnico para el ecosistema de auditoría.
 * Usa la Search/Sonar API de Perplexity para obtener información actualizada sobre:
 * - Estado de tecnologías y versiones
 * - Mejores prácticas actuales (2025)
 * - Recomendaciones de seguridad y rendimiento
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Configuración de Perplexity
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

// Configuración de logging
const LOG_FILE = path.join(__dirname, "perplexity-audit.log");

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
    console.error("Logging failed:", err.message);
  }
}

if (!PERPLEXITY_API_KEY) {
  log("ERROR: PERPLEXITY_API_KEY no está configurada en las variables de entorno");
  console.error("Error: PERPLEXITY_API_KEY no está configurada en las variables de entorno");
  process.exit(1);
}

log("MCP Perplexity Audit Server iniciando...");

/**
 * Realiza una consulta a Perplexity API
 */
async function queryPerplexity(prompt, systemPrompt = null) {
  const messages = [];
  
  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt
    });
  }
  
  messages.push({
    role: "user",
    content: prompt
  });

  log(`Llamando a Perplexity API (prompt length: ${prompt.length} chars)`);

  const response = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-large-128k-online",
      messages: messages,
      temperature: 0.2,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    log(`ERROR: Perplexity API falló con status ${response.status}: ${errorText}`);
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const tokensUsed = data.usage?.total_tokens ?? "unknown";
  log(`Perplexity API OK - Tokens usados: ${tokensUsed}`);
  
  return data.choices[0].message.content;
}

/**
 * Herramienta: stack_status
 * Evalúa el estado de soporte, riesgos y versiones recomendadas de un stack tecnológico
 */
async function stackStatus(components, appType = "general") {
  log(`stack_status llamada con input: ${JSON.stringify({ components: components?.length, appType })}`);
  
  // Validación de entrada
  if (!components || !Array.isArray(components)) {
    const error = "Invalid input: 'components' array is required";
    log(`ERROR en stack_status: ${error}`);
    throw new Error(error);
  }
  
  if (components.length === 0) {
    const error = "Invalid input: 'components' array cannot be empty";
    log(`ERROR en stack_status: ${error}`);
    throw new Error(error);
  }
  
  const componentsList = components.map(c => 
    `- ${c.name} ${c.version || '(versión no especificada)'}`
  ).join('\n');

  const prompt = `
Analiza el siguiente stack tecnológico para una aplicación tipo "${appType}":

${componentsList}

Para cada componente, proporciona:
1. Estado actual de soporte: "current" (soportado activamente), "nearing_eol" (próximo a fin de vida), o "eol" (fin de vida)
2. Versión recomendada más actual
3. Notas sobre riesgos de seguridad, rendimiento o compatibilidad

Luego evalúa el riesgo general del stack: "low", "medium", o "high"

Responde ÚNICAMENTE en formato JSON con esta estructura exacta:
{
  "components": [
    {
      "name": "nombre_componente",
      "version": "versión_actual",
      "status": "current|nearing_eol|eol",
      "recommended_version": "X.Y",
      "notes": "Explicación detallada del estado y recomendaciones"
    }
  ],
  "overall_risk": "low|medium|high",
  "summary": "Resumen ejecutivo del estado general del stack"
}
`;

  const systemPrompt = `Eres un experto en arquitectura de software y seguridad. 
Analiza stacks tecnológicos con información actualizada a diciembre 2025.
Responde SOLO con JSON válido, sin texto adicional antes o después.`;

  try {
    const response = await queryPerplexity(prompt, systemPrompt);
    
    // Intentar extraer JSON de la respuesta (por si viene con markdown)
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Validar estructura de salida
    if (!parsed || !Array.isArray(parsed.components)) {
      throw new Error("Parsed stack_status output is invalid or missing 'components' array");
    }
    
    if (!parsed.overall_risk || !parsed.summary) {
      throw new Error("Parsed stack_status output is missing 'overall_risk' or 'summary'");
    }
    
    log(`stack_status completada exitosamente - ${parsed.components.length} componentes, riesgo: ${parsed.overall_risk}`);
    return parsed;
  } catch (error) {
    log(`ERROR en stack_status: ${error.message}`);
    console.error("Error parsing stack_status response:", error);
    throw error; // Relanzar para que Claude vea que la tool falló
  }
}

/**
 * Herramienta: best_practices
 * Obtiene mejores prácticas actuales (2025) para un stack específico
 */
async function bestPractices(language, framework, database, appType, focus = ["security", "performance", "maintainability"]) {
  log(`best_practices llamada con input: ${JSON.stringify({ language, framework, database, appType, focus })}`);
  
  // Validación de entrada
  if (!language || !framework) {
    const error = "Invalid input: 'language' and 'framework' are required";
    log(`ERROR en best_practices: ${error}`);
    throw new Error(error);
  }
  
  const focusAreas = focus.join(", ");
  
  const prompt = `
Para una aplicación "${appType}" con el siguiente stack tecnológico:
- Lenguaje: ${language}
- Framework: ${framework}
- Base de datos: ${database}

Proporciona las mejores prácticas actuales (diciembre 2025) enfocadas en: ${focusAreas}

Para cada área de enfoque, proporciona:
1. Un resumen ejecutivo (2-3 líneas)
2. Una lista de 3-5 recomendaciones específicas y accionables

Responde ÚNICAMENTE en formato JSON con esta estructura exacta:
{
  "security": {
    "summary": "Resumen de mejores prácticas de seguridad",
    "recommendations": [
      "Recomendación específica 1",
      "Recomendación específica 2",
      "..."
    ]
  },
  "performance": {
    "summary": "Resumen de mejores prácticas de rendimiento",
    "recommendations": [
      "Recomendación específica 1",
      "..."
    ]
  },
  "maintainability": {
    "summary": "Resumen de mejores prácticas de mantenibilidad",
    "recommendations": [
      "Recomendación específica 1",
      "..."
    ]
  }
}

Incluye solo las áreas solicitadas: ${focusAreas}
`;

  const systemPrompt = `Eres un experto en arquitectura de software, seguridad y mejores prácticas de desarrollo.
Proporciona recomendaciones actualizadas a diciembre 2025, basadas en estándares de la industria.
Responde SOLO con JSON válido, sin texto adicional antes o después.`;

  try {
    const response = await queryPerplexity(prompt, systemPrompt);
    
    // Intentar extraer JSON de la respuesta
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Validar estructura de salida
    if (!parsed || typeof parsed !== 'object') {
      throw new Error("Parsed best_practices output is empty or invalid");
    }
    
    // Validar que al menos una de las áreas solicitadas esté presente
    const hasValidArea = focus.some(area => 
      parsed[area] && 
      parsed[area].summary && 
      Array.isArray(parsed[area].recommendations)
    );
    
    if (!hasValidArea) {
      throw new Error("Parsed best_practices output is missing required focus areas or has invalid structure");
    }
    
    log(`best_practices completada exitosamente - Áreas: ${Object.keys(parsed).filter(k => k !== 'error').join(', ')}`);
    return parsed;
  } catch (error) {
    log(`ERROR en best_practices: ${error.message}`);
    console.error("Error parsing best_practices response:", error);
    throw error; // Relanzar para que Claude vea que la tool falló
  }
}

// Crear servidor MCP
const server = new Server(
  {
    name: "perplexity-audit",
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
  return {
    tools: [
      {
        name: "stack_status",
        description: `Evalúa el estado de soporte, riesgos y versiones recomendadas de un stack tecnológico.
Analiza cada componente para determinar si está soportado, próximo a EOL o en EOL,
y proporciona recomendaciones de versiones y riesgos de seguridad.`,
        inputSchema: {
          type: "object",
          properties: {
            components: {
              type: "array",
              description: "Lista de componentes tecnológicos a evaluar",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Nombre del componente (ej: python, django, postgresql)"
                  },
                  version: {
                    type: "string",
                    description: "Versión actual del componente (opcional)"
                  }
                },
                required: ["name"]
              }
            },
            app_type: {
              type: "string",
              description: "Tipo de aplicación (ej: saas-api, web-app, mobile-backend)",
              default: "general"
            }
          },
          required: ["components"]
        }
      },
      {
        name: "best_practices",
        description: `Obtiene las mejores prácticas actuales (2025) para un stack tecnológico específico.
Proporciona recomendaciones enfocadas en seguridad, rendimiento y mantenibilidad
basadas en estándares de la industria.`,
        inputSchema: {
          type: "object",
          properties: {
            language: {
              type: "string",
              description: "Lenguaje de programación principal (ej: python, javascript, java)"
            },
            framework: {
              type: "string",
              description: "Framework principal (ej: fastapi, django, express, spring-boot)"
            },
            database: {
              type: "string",
              description: "Base de datos utilizada (ej: postgresql, mongodb, mysql)"
            },
            app_type: {
              type: "string",
              description: "Tipo de aplicación (ej: saas-api, web-app, microservices)",
              default: "general"
            },
            focus: {
              type: "array",
              description: "Áreas de enfoque para las recomendaciones",
              items: {
                type: "string",
                enum: ["security", "performance", "maintainability", "scalability", "testing"]
              },
              default: ["security", "performance", "maintainability"]
            }
          },
          required: ["language", "framework"]
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
    if (name === "stack_status") {
      const result = await stackStatus(args.components, args.app_type);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }

    if (name === "best_practices") {
      const result = await bestPractices(
        args.language,
        args.framework,
        args.database,
        args.app_type,
        args.focus
      );
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
  log("MCP Perplexity Audit Server conectado y listo");
  console.error("MCP Perplexity Audit Server running on stdio");
}

main().catch((error) => {
  log(`ERROR FATAL al iniciar servidor: ${error.message}`);
  console.error("Server error:", error);
  process.exit(1);
});
