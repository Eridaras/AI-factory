#!/usr/bin/env node

/**
 * MCP Server: Feature Replicator
 * 
 * Escanea repositorios legacy y extrae especificaciones detalladas de funcionalidades
 * para poder replicarlas en nuevos proyectos.
 * 
 * Capacidades:
 * - Listar todas las funcionalidades detectadas en un repo
 * - Analizar a fondo cada feature (BD, tablas, columnas, rutas, APIs, reglas)
 * - Generar especificaciones en JSON y Markdown
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

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de logging
const LOG_FILE = path.join(__dirname, "feature-replicator.log");

/**
 * Logger para el servidor MCP
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  
  try {
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (err) {
    // Silenciar errores de logging para no romper MCP
  }
}

log("MCP Feature Replicator Server iniciando...");

/**
 * Helper: Cargar tech stack desde auditoría previa
 */
function loadTechStack(repoPath) {
  const statusPath = path.join(repoPath, "docs", "TECH_STACK_STATUS.json");
  
  if (!fs.existsSync(statusPath)) {
    log(`Tech stack file not found: ${statusPath}`);
    return {};
  }
  
  try {
    const content = fs.readFileSync(statusPath, "utf8");
    const stack = JSON.parse(content);
    log(`Tech stack loaded: ${stack.language}/${stack.framework}`);
    return stack;
  } catch (error) {
    log(`Error loading tech stack: ${error.message}`);
    return {};
  }
}

/**
 * Helper: Validar entrada
 */
function validateInput(inputName, value, type, options = {}) {
  if (value === undefined || value === null) {
    if (options.required !== false) {
      throw new Error(`Missing required input: ${inputName}`);
    }
    return options.default;
  }
  
  // Validación de tipos
  if (type === "string" && typeof value !== "string") {
    throw new Error(`Invalid input type for ${inputName}: expected string, got ${typeof value}`);
  }
  
  if (type === "number" && typeof value !== "number") {
    throw new Error(`Invalid input type for ${inputName}: expected number, got ${typeof value}`);
  }
  
  if (type === "array" && !Array.isArray(value)) {
    throw new Error(`Invalid input type for ${inputName}: expected array, got ${typeof value}`);
  }
  
  // Validaciones de rango para números
  if (type === "number") {
    if (options.min !== undefined && value < options.min) {
      throw new Error(`${inputName} must be >= ${options.min}`);
    }
    if (options.max !== undefined && value > options.max) {
      throw new Error(`${inputName} must be <= ${options.max}`);
    }
  }
  
  return value;
}

/**
 * Tool: list_features
 * Escanea el repositorio y devuelve una lista de funcionalidades detectadas
 */
async function listFeatures(args) {
  const repoPath = validateInput("path", args.path, "string", { default: "." });
  const tech_stack = args.tech_stack || loadTechStack(repoPath);
  const max_files = validateInput("max_files", args.max_files, "number", { 
    default: 300, 
    min: 1, 
    max: 5000 
  });
  
  log(`list_features called: path=${repoPath}, max_files=${max_files}, stack=${JSON.stringify(tech_stack)}`);
  
  try {
    // Verificar que el path existe
    if (!fs.existsSync(repoPath)) {
      throw new Error(`Repository path does not exist: ${repoPath}`);
    }
    
    // TODO: Implementar lógica real de escaneo
    // Por ahora, retornar estructura de ejemplo
    const features = [
      {
        id: "LEGACY-F-001",
        name: "Funcionalidad de ejemplo 1",
        summary: "Esta es una funcionalidad de ejemplo detectada en el repositorio",
        main_files: ["src/controllers/ExampleController.cs", "src/services/ExampleService.cs"]
      },
      {
        id: "LEGACY-F-002", 
        name: "Funcionalidad de ejemplo 2",
        summary: "Otra funcionalidad de ejemplo",
        main_files: ["src/controllers/AnotherController.cs"]
      }
    ];
    
    log(`list_features completed: ${features.length} features found`);
    
    return {
      features,
      tech_stack,
      scanned_path: repoPath,
      total_files_scanned: max_files
    };
    
  } catch (error) {
    log(`ERROR en list_features: ${error.message}`);
    throw error;
  }
}

/**
 * Tool: scan_feature
 * Analiza a fondo una funcionalidad y extrae especificación completa
 */
async function scanFeature(args) {
  const feature_id = validateInput("feature_id", args.feature_id, "string");
  const entry_files = validateInput("entry_files", args.entry_files, "array");
  const repoPath = validateInput("path", args.path, "string", { default: "." });
  const tech_stack = args.tech_stack || loadTechStack(repoPath);
  const max_depth = validateInput("max_depth", args.max_depth, "number", {
    default: 4,
    min: 1,
    max: 10
  });
  
  log(`scan_feature called: feature_id=${feature_id}, entry_files=${entry_files.length}, max_depth=${max_depth}`);
  
  try {
    // Validar que los archivos existen
    for (const file of entry_files) {
      const fullPath = path.join(repoPath, file);
      if (!fs.existsSync(fullPath)) {
        log(`WARNING: Entry file not found: ${fullPath}`);
      }
    }
    
    // TODO: Implementar lógica real de análisis profundo
    // - Leer entry_files
    // - Seguir referencias a otros archivos (hasta max_depth)
    // - Extraer queries SQL, rutas de archivos, APIs, etc.
    // - Construir prompt para modelo que genere la estructura completa
    
    const spec = {
      feature_id,
      name: "Nombre de la funcionalidad extraída",
      domain_purpose: "Descripción del propósito de negocio de esta funcionalidad",
      inputs: [
        {
          name: "parametro1",
          type: "string",
          description: "Descripción del parámetro"
        }
      ],
      outputs: [
        {
          type: "json",
          description: "Objeto con la respuesta"
        }
      ],
      data_sources: [
        {
          kind: "database",
          engine: tech_stack.databases?.[0]?.engine || "sql_server",
          database: tech_stack.databases?.[0]?.name || "DATABASE_NAME",
          schema: "dbo",
          table: "TableName",
          columns: ["Column1", "Column2", "Column3"],
          filters: "WHERE Column1 = @param1",
          joins: "LEFT JOIN OtherTable ON ...",
          source_code_snippet: "SELECT Column1, Column2 FROM TableName WHERE Column1 = @param1"
        }
      ],
      file_system: [
        {
          kind: "network_share",
          path_pattern: "\\\\SERVER\\Share\\Reports\\report_{date}.xlsx",
          operation: "read"
        }
      ],
      external_services: [
        {
          kind: "api_call",
          url_or_host: "https://api.example.com/endpoint",
          method: "POST",
          payload_example: '{"field": "value"}'
        }
      ],
      business_rules: [
        "Validar que el usuario tenga permisos",
        "Solo mostrar registros activos",
        "Aplicar filtro por fecha"
      ],
      files_involved: entry_files,
      tech_stack
    };
    
    log(`scan_feature completed: ${spec.files_involved.length} files analyzed`);
    
    return spec;
    
  } catch (error) {
    log(`ERROR en scan_feature: ${error.message}`);
    throw error;
  }
}

/**
 * Tool: export_feature_markdown
 * Genera un archivo Markdown con la especificación detallada
 */
async function exportFeatureMarkdown(args) {
  const feature_spec = validateInput("feature_spec", args.feature_spec, "object");
  const output_path = validateInput("output_path", args.output_path, "string");
  
  log(`export_feature_markdown called: output_path=${output_path}`);
  
  try {
    // Crear directorio si no existe
    if (!fs.existsSync(output_path)) {
      fs.mkdirSync(output_path, { recursive: true });
      log(`Created output directory: ${output_path}`);
    }
    
    // Generar nombre de archivo
    const fileName = `${feature_spec.feature_id || "feature"}_${(feature_spec.name || "spec")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")}.md`;
    
    const filePath = path.join(output_path, fileName);
    
    // Generar contenido Markdown
    const md = `# ${feature_spec.name || "Funcionalidad"}

**ID:** ${feature_spec.feature_id || "N/A"}

---

## 📋 Propósito de negocio

${feature_spec.domain_purpose || "Sin descripción disponible"}

---

## 📥 Entradas

${feature_spec.inputs && feature_spec.inputs.length > 0 
  ? feature_spec.inputs.map(inp => `- **${inp.name}** (${inp.type}): ${inp.description || "Sin descripción"}`).join("\n")
  : "Sin entradas definidas"}

---

## 📤 Salidas

${feature_spec.outputs && feature_spec.outputs.length > 0
  ? feature_spec.outputs.map(out => `- **Tipo:** ${out.type}\n  - ${out.description || "Sin descripción"}`).join("\n\n")
  : "Sin salidas definidas"}

---

## 🗄️ Fuentes de datos

${feature_spec.data_sources && feature_spec.data_sources.length > 0
  ? feature_spec.data_sources.map(ds => `
### ${ds.engine} - ${ds.database || "N/A"}.${ds.schema || "N/A"}.${ds.table}

**Columnas:** ${ds.columns ? ds.columns.join(", ") : "N/A"}

${ds.filters ? `**Filtros:** \`${ds.filters}\`` : ""}
${ds.joins ? `**Joins:** \`${ds.joins}\`` : ""}

${ds.source_code_snippet ? `**Query:**\n\`\`\`sql\n${ds.source_code_snippet}\n\`\`\`` : ""}
  `).join("\n---\n")
  : "Sin fuentes de datos definidas"}

---

## 📁 Sistema de archivos

${feature_spec.file_system && feature_spec.file_system.length > 0
  ? feature_spec.file_system.map(fs => `
- **Tipo:** ${fs.kind}
- **Patrón:** \`${fs.path_pattern}\`
- **Operación:** ${fs.operation}
  `).join("\n")
  : "Sin operaciones de sistema de archivos"}

---

## 🌐 Servicios externos

${feature_spec.external_services && feature_spec.external_services.length > 0
  ? feature_spec.external_services.map(svc => `
### ${svc.kind}

- **URL/Host:** \`${svc.url_or_host}\`
- **Método:** ${svc.method}

${svc.payload_example ? `**Payload de ejemplo:**\n\`\`\`json\n${svc.payload_example}\n\`\`\`` : ""}
  `).join("\n---\n")
  : "Sin servicios externos"}

---

## ⚖️ Reglas de negocio

${feature_spec.business_rules && feature_spec.business_rules.length > 0
  ? feature_spec.business_rules.map(rule => `- ${rule}`).join("\n")
  : "Sin reglas de negocio documentadas"}

---

## 📄 Archivos involucrados

${feature_spec.files_involved && feature_spec.files_involved.length > 0
  ? feature_spec.files_involved.map(file => `- \`${file}\``).join("\n")
  : "Sin archivos documentados"}

---

## 🔧 Stack técnico

${feature_spec.tech_stack ? `
- **Lenguaje:** ${feature_spec.tech_stack.language || "N/A"}
- **Framework:** ${feature_spec.tech_stack.framework || "N/A"}
- **Bases de datos:** ${feature_spec.tech_stack.databases ? feature_spec.tech_stack.databases.map(db => `${db.engine} (${db.name})`).join(", ") : "N/A"}
` : "Sin información de stack técnico"}

---

*Documento generado automáticamente por feature-replicator MCP*
`;
    
    // Escribir archivo
    fs.writeFileSync(filePath, md, "utf8");
    
    log(`Markdown exported successfully: ${filePath}`);
    
    return {
      file_path: filePath,
      file_name: fileName,
      success: true
    };
    
  } catch (error) {
    log(`ERROR en export_feature_markdown: ${error.message}`);
    throw error;
  }
}

// Crear servidor MCP
const server = new Server(
  {
    name: "feature-replicator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Registrar handler para listar tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  log("ListTools request received");
  
  return {
    tools: [
      {
        name: "list_features",
        description: "Escanea el repositorio legacy y devuelve una lista de funcionalidades detectadas (endpoints, casos de uso, jobs, etc.) basándose en el tech stack.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Ruta raíz del repositorio a escanear",
              default: "."
            },
            tech_stack: {
              type: "object",
              description: "Información del stack tecnológico (opcional, se lee de TECH_STACK_STATUS.json si no se proporciona)",
              properties: {
                language: {
                  type: "string",
                  description: "Lenguaje principal (csharp, java, node, python, etc.)"
                },
                framework: {
                  type: "string",
                  description: "Framework usado (aspnet-mvc, spring, express, django, etc.)"
                },
                databases: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista de motores de BD (sap_hana, sql_server, postgresql, etc.)"
                }
              }
            },
            max_files: {
              type: "number",
              description: "Límite de archivos a escanear (1-5000)",
              default: 300,
              minimum: 1,
              maximum: 5000
            }
          },
          required: ["path"]
        }
      },
      {
        name: "scan_feature",
        description: "Analiza a fondo una funcionalidad específica y extrae TODA la información necesaria para replicarla: BD, tablas, columnas, queries, rutas de archivos, APIs externas, reglas de negocio, etc.",
        inputSchema: {
          type: "object",
          properties: {
            feature_id: {
              type: "string",
              description: "ID único de la funcionalidad (ej: LEGACY-F-001)"
            },
            entry_files: {
              type: "array",
              items: { type: "string" },
              description: "Archivos principales que implementan esta funcionalidad"
            },
            path: {
              type: "string",
              description: "Ruta raíz del repositorio",
              default: "."
            },
            tech_stack: {
              type: "object",
              description: "Stack tecnológico (opcional)",
              properties: {
                language: { type: "string" },
                framework: { type: "string" },
                databases: { 
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            max_depth: {
              type: "number",
              description: "Profundidad máxima de seguimiento de llamadas (1-10)",
              default: 4,
              minimum: 1,
              maximum: 10
            }
          },
          required: ["feature_id", "entry_files"]
        }
      },
      {
        name: "export_feature_markdown",
        description: "Genera un archivo Markdown con la especificación completa y legible de una funcionalidad, listo para que humanos e IAs lo usen como contrato de implementación.",
        inputSchema: {
          type: "object",
          properties: {
            feature_spec: {
              type: "object",
              description: "Objeto de especificación devuelto por scan_feature"
            },
            output_path: {
              type: "string",
              description: "Directorio donde guardar el archivo .md (ej: docs/FEATURES_SPEC)"
            }
          },
          required: ["feature_spec", "output_path"]
        }
      }
    ]
  };
});

// Registrar handler para llamadas a tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  log(`Tool invoked: ${name}`);
  log(`Arguments: ${JSON.stringify(args)}`);
  
  try {
    let result;
    
    switch (name) {
      case "list_features":
        result = await listFeatures(args);
        break;
        
      case "scan_feature":
        result = await scanFeature(args);
        break;
        
      case "export_feature_markdown":
        result = await exportFeatureMarkdown(args);
        break;
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    log(`Tool ${name} completed successfully`);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
    
  } catch (error) {
    log(`ERROR en tool ${name}: ${error.message}`);
    throw error;
  }
});

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("MCP Feature Replicator Server conectado y listo");
}

main().catch((error) => {
  log(`ERROR FATAL: ${error.message}`);
  process.exit(1);
});
