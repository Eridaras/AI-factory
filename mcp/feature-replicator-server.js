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
 * Helper: Cargar configuración de tecnologías soportadas
 */
function loadTechConfig() {
  const configPath = path.join(__dirname, "tech-stack-config.json");
  
  try {
    const content = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(content);
    log(`Tech config loaded: ${Object.keys(config.supported_languages).length} languages`);
    return config;
  } catch (error) {
    log(`Warning: Could not load tech-stack-config.json: ${error.message}`);
    return { supported_languages: {}, supported_databases: {} };
  }
}

const TECH_CONFIG = loadTechConfig();

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
 * Helper: Buscar archivos recursivamente con filtro de extensiones
 */
function findFiles(dirPath, extensions, maxFiles = 1000) {
  const results = [];
  
  function scanDir(currentPath, depth = 0) {
    if (results.length >= maxFiles || depth > 10) return;
    
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (results.length >= maxFiles) break;
        
        const fullPath = path.join(currentPath, entry.name);
        
        // Ignorar directorios comunes
        if (entry.isDirectory()) {
          const ignoreDirs = ['node_modules', 'bin', 'obj', '.git', '.vs', 'packages', 'vendor', '__pycache__'];
          if (!ignoreDirs.includes(entry.name)) {
            scanDir(fullPath, depth + 1);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      log(`Error scanning directory ${currentPath}: ${error.message}`);
    }
  }
  
  scanDir(dirPath);
  return results;
}

/**
 * Helper: Detectar features en un repo C#
 */
function detectCSharpFeatures(repoPath, files) {
  const features = [];
  const controllerFiles = files.filter(f => f.includes('Controller') && f.endsWith('.cs'));
  
  let featureIndex = 1;
  
  for (const controllerFile of controllerFiles) {
    try {
      const content = fs.readFileSync(controllerFile, 'utf8');
      const relativePath = path.relative(repoPath, controllerFile);
      
      // Extraer nombre del controller
      const controllerMatch = content.match(/class\s+(\w+Controller)/);
      const controllerName = controllerMatch ? controllerMatch[1] : path.basename(controllerFile, '.cs');
      
      // Detectar actions (métodos públicos con [HttpGet], [HttpPost], etc. o que retornan ActionResult)
      const actionMatches = content.matchAll(/public\s+(?:async\s+)?(?:Task<)?(?:ActionResult|IActionResult|JsonResult|ViewResult)[^{]+\s+(\w+)\s*\(/g);
      const actions = [...actionMatches].map(m => m[1]);
      
      // Buscar archivos relacionados (services, repositories)
      const baseName = controllerName.replace('Controller', '');
      const relatedFiles = [relativePath];
      
      // Buscar service
      const serviceFile = files.find(f => f.includes(`${baseName}Service`) && f.endsWith('.cs'));
      if (serviceFile) {
        relatedFiles.push(path.relative(repoPath, serviceFile));
      }
      
      // Buscar repository
      const repoFile = files.find(f => f.includes(`${baseName}Repository`) && f.endsWith('.cs'));
      if (repoFile) {
        relatedFiles.push(path.relative(repoPath, repoFile));
      }
      
      const featureId = `LEGACY-F-${String(featureIndex).padStart(3, '0')}`;
      featureIndex++;
      
      features.push({
        id: featureId,
        name: baseName.replace(/([A-Z])/g, ' $1').trim(),
        summary: `Controller con ${actions.length} actions detectadas${actions.length > 0 ? ': ' + actions.slice(0, 3).join(', ') : ''}`,
        main_files: relatedFiles,
        metadata: {
          controller: controllerName,
          actions: actions.slice(0, 10),
          language: 'csharp',
          framework: 'aspnet-mvc'
        }
      });
      
    } catch (error) {
      log(`Error processing controller ${controllerFile}: ${error.message}`);
    }
  }
  
  return features;
}

/**
 * Detectar features en código Java
 */
function detectJavaFeatures(repoPath, files) {
  const features = [];
  const config = TECH_CONFIG?.languages?.java;
  if (!config) return features;
  
  const javaFiles = files.filter(f => f.full.endsWith('.java'));
  
  // Controllers (@RestController, @Controller)
  const controllerPattern = /@(Rest)?Controller/;
  for (const file of javaFiles) {
    try {
      const content = fs.readFileSync(file.full, 'utf8');
      if (controllerPattern.test(content)) {
        const className = path.basename(file.relative, '.java');
        features.push({
          id: `java-controller-${className.toLowerCase()}`,
          type: 'endpoint',
          language: 'java',
          files: [file.relative],
          description: `Java Controller: ${className}`
        });
      }
    } catch (error) {
      log(`Error reading ${file.full}: ${error.message}`);
    }
  }
  
  // Services (@Service)
  const servicePattern = /@Service/;
  for (const file of javaFiles) {
    try {
      const content = fs.readFileSync(file.full, 'utf8');
      if (servicePattern.test(content) && !features.some(f => f.files.includes(file.relative))) {
        const className = path.basename(file.relative, '.java');
        features.push({
          id: `java-service-${className.toLowerCase()}`,
          type: 'business_logic',
          language: 'java',
          files: [file.relative],
          description: `Java Service: ${className}`
        });
      }
    } catch (error) {
      log(`Error reading ${file.full}: ${error.message}`);
    }
  }
  
  // Repositories (@Repository, JpaRepository)
  const repoPattern = /@Repository|extends JpaRepository/;
  for (const file of javaFiles) {
    try {
      const content = fs.readFileSync(file.full, 'utf8');
      if (repoPattern.test(content) && !features.some(f => f.files.includes(file.relative))) {
        const className = path.basename(file.relative, '.java');
        features.push({
          id: `java-repository-${className.toLowerCase()}`,
          type: 'data_access',
          language: 'java',
          files: [file.relative],
          description: `Java Repository: ${className}`
        });
      }
    } catch (error) {
      log(`Error reading ${file.full}: ${error.message}`);
    }
  }
  
  log(`Detected ${features.length} Java features`);
  return features;
}

/**
 * Detectar features en código PHP
 */
function detectPHPFeatures(repoPath, files) {
  const features = [];
  const config = TECH_CONFIG?.languages?.php;
  if (!config) return features;
  
  const phpFiles = files.filter(f => f.full.endsWith('.php'));
  
  // Laravel Controllers (extends Controller, suffix Controller)
  for (const file of phpFiles) {
    const fileName = path.basename(file.relative);
    if (fileName.includes('Controller') || file.relative.includes('Controllers/')) {
      try {
        const content = fs.readFileSync(file.full, 'utf8');
        if (/class\s+\w+Controller/.test(content)) {
          const className = fileName.replace('.php', '');
          features.push({
            id: `php-controller-${className.toLowerCase()}`,
            type: 'endpoint',
            language: 'php',
            files: [file.relative],
            description: `PHP Controller: ${className}`
          });
        }
      } catch (error) {
        log(`Error reading ${file.full}: ${error.message}`);
      }
    }
  }
  
  // Models (Eloquent models, extends Model)
  const modelPattern = /extends\s+Model|use\s+HasFactory/;
  for (const file of phpFiles) {
    if (file.relative.includes('Models/') || file.relative.includes('app/')) {
      try {
        const content = fs.readFileSync(file.full, 'utf8');
        if (modelPattern.test(content) && !features.some(f => f.files.includes(file.relative))) {
          const className = path.basename(file.relative, '.php');
          features.push({
            id: `php-model-${className.toLowerCase()}`,
            type: 'data_access',
            language: 'php',
            files: [file.relative],
            description: `PHP Model: ${className}`
          });
        }
      } catch (error) {
        log(`Error reading ${file.full}: ${error.message}`);
      }
    }
  }
  
  // Services
  for (const file of phpFiles) {
    if (file.relative.includes('Services/') || path.basename(file.relative).includes('Service')) {
      const className = path.basename(file.relative, '.php');
      if (!features.some(f => f.files.includes(file.relative))) {
        features.push({
          id: `php-service-${className.toLowerCase()}`,
          type: 'business_logic',
          language: 'php',
          files: [file.relative],
          description: `PHP Service: ${className}`
        });
      }
    }
  }
  
  log(`Detected ${features.length} PHP features`);
  return features;
}

/**
 * Detectar features en código Python
 */
function detectPythonFeatures(repoPath, files) {
  const features = [];
  const config = TECH_CONFIG?.languages?.python;
  if (!config) return features;
  
  const pythonFiles = files.filter(f => f.full.endsWith('.py'));
  
  // Django views (views.py, def view)
  for (const file of pythonFiles) {
    const fileName = path.basename(file.relative);
    if (fileName === 'views.py' || file.relative.includes('views/')) {
      try {
        const content = fs.readFileSync(file.full, 'utf8');
        const functionPattern = /def\s+(\w+)\s*\(/g;
        const matches = [...content.matchAll(functionPattern)];
        
        for (const match of matches) {
          const funcName = match[1];
          if (funcName !== '__init__' && !funcName.startsWith('_')) {
            features.push({
              id: `python-view-${funcName.toLowerCase()}`,
              type: 'endpoint',
              language: 'python',
              files: [file.relative],
              description: `Python View: ${funcName}`
            });
          }
        }
      } catch (error) {
        log(`Error reading ${file.full}: ${error.message}`);
      }
    }
  }
  
  // Django models (models.py, class Meta)
  for (const file of pythonFiles) {
    if (path.basename(file.relative) === 'models.py') {
      try {
        const content = fs.readFileSync(file.full, 'utf8');
        const classPattern = /class\s+(\w+)\s*\(/g;
        const matches = [...content.matchAll(classPattern)];
        
        for (const match of matches) {
          const className = match[1];
          if (className !== 'Meta' && !features.some(f => f.id.includes(className.toLowerCase()))) {
            features.push({
              id: `python-model-${className.toLowerCase()}`,
              type: 'data_access',
              language: 'python',
              files: [file.relative],
              description: `Python Model: ${className}`
            });
          }
        }
      } catch (error) {
        log(`Error reading ${file.full}: ${error.message}`);
      }
    }
  }
  
  // Flask/FastAPI routes (@app.route, @router.get)
  const routePattern = /@(app|router|api)\.(get|post|put|delete|route)/;
  for (const file of pythonFiles) {
    try {
      const content = fs.readFileSync(file.full, 'utf8');
      if (routePattern.test(content) && !features.some(f => f.files.includes(file.relative))) {
        const baseName = path.basename(file.relative, '.py');
        features.push({
          id: `python-api-${baseName.toLowerCase()}`,
          type: 'endpoint',
          language: 'python',
          files: [file.relative],
          description: `Python API: ${baseName}`
        });
      }
    } catch (error) {
      log(`Error reading ${file.full}: ${error.message}`);
    }
  }
  
  log(`Detected ${features.length} Python features`);
  return features;
}

/**
 * Detectar features en código JavaScript/TypeScript
 */
function detectJavaScriptFeatures(repoPath, files) {
  const features = [];
  const config = TECH_CONFIG?.languages?.javascript || TECH_CONFIG?.languages?.typescript;
  if (!config) return features;
  
  const jsFiles = files.filter(f => f.full.endsWith('.js') || f.full.endsWith('.ts'));
  
  // Express routes (app.get, router.get, etc.)
  const routePattern = /(app|router)\.(get|post|put|delete|patch|use)\s*\(/;
  for (const file of jsFiles) {
    try {
      const content = fs.readFileSync(file.full, 'utf8');
      if (routePattern.test(content)) {
        const baseName = path.basename(file.relative).replace(/\.(js|ts)$/, '');
        features.push({
          id: `js-route-${baseName.toLowerCase()}`,
          type: 'endpoint',
          language: file.full.endsWith('.ts') ? 'typescript' : 'javascript',
          files: [file.relative],
          description: `Express Route: ${baseName}`
        });
      }
    } catch (error) {
      log(`Error reading ${file.full}: ${error.message}`);
    }
  }
  
  // Controllers (class XxxController, export controller)
  const controllerPattern = /(class\s+\w+Controller|export.*Controller)/;
  for (const file of jsFiles) {
    if (file.relative.includes('controller') || file.relative.includes('Controller')) {
      try {
        const content = fs.readFileSync(file.full, 'utf8');
        if (controllerPattern.test(content) && !features.some(f => f.files.includes(file.relative))) {
          const baseName = path.basename(file.relative).replace(/\.(js|ts)$/, '');
          features.push({
            id: `js-controller-${baseName.toLowerCase()}`,
            type: 'endpoint',
            language: file.full.endsWith('.ts') ? 'typescript' : 'javascript',
            files: [file.relative],
            description: `Controller: ${baseName}`
          });
        }
      } catch (error) {
        log(`Error reading ${file.full}: ${error.message}`);
      }
    }
  }
  
  // Services
  for (const file of jsFiles) {
    if (file.relative.includes('service') || file.relative.includes('Service')) {
      const baseName = path.basename(file.relative).replace(/\.(js|ts)$/, '');
      if (!features.some(f => f.files.includes(file.relative))) {
        features.push({
          id: `js-service-${baseName.toLowerCase()}`,
          type: 'business_logic',
          language: file.full.endsWith('.ts') ? 'typescript' : 'javascript',
          files: [file.relative],
          description: `Service: ${baseName}`
        });
      }
    }
  }
  
  // Models (Sequelize, Mongoose, TypeORM)
  const modelPattern = /(sequelize\.define|new\s+Schema|@Entity|Model\.init)/;
  for (const file of jsFiles) {
    if (file.relative.includes('model') || file.relative.includes('Model')) {
      try {
        const content = fs.readFileSync(file.full, 'utf8');
        if (modelPattern.test(content) && !features.some(f => f.files.includes(file.relative))) {
          const baseName = path.basename(file.relative).replace(/\.(js|ts)$/, '');
          features.push({
            id: `js-model-${baseName.toLowerCase()}`,
            type: 'data_access',
            language: file.full.endsWith('.ts') ? 'typescript' : 'javascript',
            files: [file.relative],
            description: `Model: ${baseName}`
          });
        }
      } catch (error) {
        log(`Error reading ${file.full}: ${error.message}`);
      }
    }
  }
  
  log(`Detected ${features.length} JavaScript/TypeScript features`);
  return features;
}

/**
 * Helper: Detectar features según el lenguaje
 */
async function detectFeatures(repoPath, tech_stack, maxFiles) {
  const language = tech_stack.language || 'unknown';
  const langConfig = TECH_CONFIG.supported_languages[language];
  
  if (!langConfig) {
    log(`Warning: Language '${language}' not configured in TECH_CONFIG`);
    return [];
  }
  
  log(`Detecting features for language: ${language}`);
  
  // Buscar archivos con las extensiones del lenguaje
  const extensions = langConfig.extensions || [];
  const files = findFiles(repoPath, extensions, maxFiles);
  
  log(`Found ${files.length} files with extensions: ${extensions.join(', ')}`);
  
  // Detectar features según el lenguaje
  let features = [];
  
  switch (language) {
    case 'csharp':
      features = detectCSharpFeatures(repoPath, files);
      break;
      
    case 'java':
      features = detectJavaFeatures(repoPath, files);
      break;
      
    case 'php':
      features = detectPHPFeatures(repoPath, files);
      break;
      
    case 'python':
      features = detectPythonFeatures(repoPath, files);
      break;
      
    case 'javascript':
    case 'typescript':
      features = detectJavaScriptFeatures(repoPath, files);
      break;
      
    default:
      log(`Language not yet implemented: ${language}`);
  }
  
  return features;
}

/**
 * ============================================================================
 * ANÁLISIS PROFUNDO DE FEATURES - MÚLTIPLES LENGUAJES
 * ============================================================================
 */

/**
 * Helper: Extraer queries SQL de código C#
 */
function extractCSharpQueries(content) {
  const queries = [];
  
  // Patrón para SqlCommand, ExecuteReader, ExecuteNonQuery
  const sqlCommandPattern = /"(SELECT|INSERT|UPDATE|DELETE|EXEC|EXECUTE)\s+[^"]+"/gi;
  const matches = content.matchAll(sqlCommandPattern);
  
  for (const match of matches) {
    let query = match[0].replace(/^"|"$/g, '').trim();
    query = query.replace(/"\s*\+\s*"/g, ' '); // Limpiar concatenaciones
    query = query.replace(/\\r\\n|\\n/g, ' '); // Limpiar saltos de línea
    queries.push(query);
  }
  
  // Queries en @"..." (verbatim strings)
  const verbatimPattern = /@"(SELECT|INSERT|UPDATE|DELETE|EXEC)[^"]+"/gi;
  const verbatimMatches = content.matchAll(verbatimPattern);
  for (const match of verbatimMatches) {
    let query = match[0].replace(/^@"|"$/g, '').trim();
    queries.push(query);
  }
  
  return queries;
}

/**
 * Helper: Extraer queries SQL de código Java
 */
function extractJavaQueries(content) {
  const queries = [];
  
  // JDBC queries
  const jdbcPattern = /"(SELECT|INSERT|UPDATE|DELETE)\s+[^"]+"/gi;
  const matches = content.matchAll(jdbcPattern);
  
  for (const match of matches) {
    queries.push(match[0].replace(/^"|"$/g, '').trim());
  }
  
  // JPA @Query annotations
  const jpaPattern = /@Query\s*\(\s*"([^"]+)"\s*\)/gi;
  const jpaMatches = content.matchAll(jpaPattern);
  for (const match of jpaMatches) {
    queries.push(match[1].trim());
  }
  
  return queries;
}

/**
 * Helper: Extraer queries SQL de código PHP
 */
function extractPHPQueries(content) {
  const queries = [];
  
  // PDO/MySQLi queries
  const sqlPattern = /['"`](SELECT|INSERT|UPDATE|DELETE)\s+[^'"`]+['"`]/gi;
  const matches = content.matchAll(sqlPattern);
  
  for (const match of matches) {
    queries.push(match[0].replace(/^['"`]|['"`]$/g, '').trim());
  }
  
  // Eloquent no genera SQL directo, pero podemos detectar los modelos
  return queries;
}

/**
 * Helper: Extraer queries SQL de código Python
 */
function extractPythonQueries(content) {
  const queries = [];
  
  // Raw SQL strings
  const sqlPattern = /['"](SELECT|INSERT|UPDATE|DELETE)\s+[^'"]+['"]/gi;
  const matches = content.matchAll(sqlPattern);
  
  for (const match of matches) {
    queries.push(match[0].replace(/^['"]|['"]$/g, '').trim());
  }
  
  // cursor.execute patterns
  const executePattern = /execute\s*\(\s*['"](.*?)['"]/gi;
  const executeMatches = content.matchAll(executePattern);
  for (const match of executeMatches) {
    if (/^(SELECT|INSERT|UPDATE|DELETE)/i.test(match[1])) {
      queries.push(match[1].trim());
    }
  }
  
  return queries;
}

/**
 * Helper: Extraer queries SQL de código JavaScript/TypeScript
 */
function extractJavaScriptQueries(content) {
  const queries = [];
  
  // Raw SQL strings
  const sqlPattern = /[`'"](SELECT|INSERT|UPDATE|DELETE)\s+[^`'"]+[`'"]/gi;
  const matches = content.matchAll(sqlPattern);
  
  for (const match of matches) {
    queries.push(match[0].replace(/^[`'"]|[`'"]$/g, '').trim());
  }
  
  return queries;
}

/**
 * Helper: Analizar query SQL y extraer información
 */
function analyzeQuery(query) {
  const info = {
    type: 'unknown',
    tables: [],
    columns: [],
    filters: '',
    joins: ''
  };
  
  // Detectar tipo
  if (/^SELECT/i.test(query)) info.type = 'SELECT';
  else if (/^INSERT/i.test(query)) info.type = 'INSERT';
  else if (/^UPDATE/i.test(query)) info.type = 'UPDATE';
  else if (/^DELETE/i.test(query)) info.type = 'DELETE';
  else if (/^EXEC|^EXECUTE/i.test(query)) info.type = 'STORED_PROC';
  
  // Extraer tablas
  const tablePatterns = [
    /FROM\s+([[\].\w]+)/gi,
    /JOIN\s+([[\].\w]+)/gi,
    /UPDATE\s+([[\].\w]+)/gi,
    /INSERT\s+INTO\s+([[\].\w]+)/gi
  ];
  
  for (const pattern of tablePatterns) {
    const matches = query.matchAll(pattern);
    for (const match of matches) {
      const table = match[1].replace(/[\[\]`]/g, '');
      if (!info.tables.includes(table)) info.tables.push(table);
    }
  }
  
  // Extraer columnas
  const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM/is);
  if (selectMatch && selectMatch[1] !== '*') {
    const cols = selectMatch[1].split(',').map(c => {
      const parts = c.trim().split(/\s+as\s+/i);
      return parts[parts.length - 1].replace(/[\[\]`]/g, '');
    });
    info.columns = cols.slice(0, 30);
  }
  
  // WHERE clause
  const whereMatch = query.match(/WHERE\s+(.*?)(?:ORDER BY|GROUP BY|LIMIT|$)/is);
  if (whereMatch) {
    info.filters = 'WHERE ' + whereMatch[1].trim().substring(0, 300);
  }
  
  // JOINs
  const joinMatches = query.matchAll(/((?:INNER|LEFT|RIGHT|FULL)?\s*JOIN\s+[^W]+?ON\s+[^J]+?)(?=(?:INNER|LEFT|RIGHT|FULL)?\s*JOIN|WHERE|ORDER|GROUP|$)/gis);
  const joins = [...joinMatches].map(m => m[1].trim());
  if (joins.length > 0) {
    info.joins = joins.join(' ').substring(0, 400);
  }
  
  return info;
}

/**
 * Helper: Extraer rutas de archivos del código
 */
function extractFilePaths(content, language) {
  const paths = [];
  
  // Rutas UNC (\\SERVER\Share) - todas los lenguajes
  const uncPattern = /\\\\[A-Za-z0-9_-]+\\[A-Za-z0-9_$-\\]+/g;
  const uncMatches = content.matchAll(uncPattern);
  for (const match of uncMatches) {
    paths.push({
      kind: 'network_share',
      path_pattern: match[0],
      operation: 'unknown'
    });
  }
  
  // Patrones específicos por lenguaje
  switch (language) {
    case 'csharp':
      // File.Read, StreamReader, etc.
      const csFilePattern = /File\.(Read|Write|Open|Create|Copy|Move|Delete)[^(]*\((?:@)?"([^"]+)"/g;
      const csMatches = content.matchAll(csFilePattern);
      for (const match of csMatches) {
        const op = /Read|Open/.test(match[1]) ? 'read' : 'write';
        paths.push({ kind: 'local', path_pattern: match[2], operation: op });
      }
      break;
      
    case 'java':
      // FileInputStream, FileOutputStream, Files.readAllBytes, etc.
      const javaFilePattern = /(?:new\s+File|Files\.\w+)\s*\(\s*"([^"]+)"/g;
      const javaMatches = content.matchAll(javaFilePattern);
      for (const match of javaMatches) {
        paths.push({ kind: 'local', path_pattern: match[1], operation: 'unknown' });
      }
      break;
      
    case 'php':
      // fopen, file_get_contents, Storage::put, etc.
      const phpFilePattern = /(?:fopen|file_get_contents|file_put_contents|Storage::(?:put|get))\s*\(\s*['"]([^'"]+)/g;
      const phpMatches = content.matchAll(phpFilePattern);
      for (const match of phpMatches) {
        paths.push({ kind: 'local', path_pattern: match[1], operation: 'unknown' });
      }
      break;
      
    case 'python':
      // open(), Path(), os.path operations
      const pyFilePattern = /open\s*\(\s*[rf]?['"]([^'"]+)|Path\s*\(\s*['"]([^'"]+)/g;
      const pyMatches = content.matchAll(pyFilePattern);
      for (const match of pyMatches) {
        const pathVal = match[1] || match[2];
        paths.push({ kind: 'local', path_pattern: pathVal, operation: 'unknown' });
      }
      break;
      
    case 'javascript':
    case 'typescript':
      // fs.readFile, fs.writeFile, require('fs')
      const jsFilePattern = /fs\.(readFile|writeFile|readFileSync|writeFileSync)[^(]*\((?:['"`])([^'"`]+)/g;
      const jsMatches = content.matchAll(jsFilePattern);
      for (const match of jsMatches) {
        const op = /read/i.test(match[1]) ? 'read' : 'write';
        paths.push({ kind: 'local', path_pattern: match[2], operation: op });
      }
      break;
  }
  
  // Remover duplicados
  const unique = [];
  const seen = new Set();
  for (const p of paths) {
    const key = `${p.kind}:${p.path_pattern}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }
  
  return unique;
}

/**
 * Helper: Extraer APIs externas del código
 */
function extractExternalAPIs(content) {
  const apis = [];
  const seen = new Set();
  
  // URLs HTTP/HTTPS
  const urlPattern = /(https?:\/\/[^\s"'`<>)]+)/g;
  const matches = content.matchAll(urlPattern);
  
  for (const match of matches) {
    const url = match[1];
    // Ignorar URLs de docs/referencias
    if (!url.includes('microsoft.com') && 
        !url.includes('w3.org') && 
        !url.includes('localhost') &&
        !url.includes('127.0.0.1') &&
        !seen.has(url)) {
      
      seen.add(url);
      
      // Intentar detectar método HTTP
      let method = 'unknown';
      const methodMatch = content.match(new RegExp(`(POST|GET|PUT|DELETE|PATCH).*?${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
      if (methodMatch) {
        method = methodMatch[1].toUpperCase();
      }
      
      apis.push({
        kind: 'api_call',
        url_or_host: url,
        method
      });
    }
  }
  
  return apis;
}

/**
 * Helper: Extraer business rules del código
 */
function extractBusinessRules(content, language) {
  const rules = [];
  
  // Validaciones (if con throw/return)
  const validationPattern = /if\s*\([^)]+\)\s*(?:throw|return)/gi;
  const validations = content.match(validationPattern);
  if (validations) {
    rules.push(`Contiene ${validations.length} validaciones en el código`);
  }
  
  // Comentarios relevantes (TODO, BUSINESS RULE, VALIDATION, etc.)
  const commentPatterns = {
    'csharp': /\/\/\s*(BUSINESS|RULE|VALIDATION|TODO|NOTE):\s*([^\n]+)/gi,
    'java': /\/\/\s*(BUSINESS|RULE|VALIDATION|TODO|NOTE):\s*([^\n]+)/gi,
    'php': /\/\/\s*(BUSINESS|RULE|VALIDATION|TODO|NOTE):\s*([^\n]+)/gi,
    'python': /#\s*(BUSINESS|RULE|VALIDATION|TODO|NOTE):\s*([^\n]+)/gi,
    'javascript': /\/\/\s*(BUSINESS|RULE|VALIDATION|TODO|NOTE):\s*([^\n]+)/gi,
    'typescript': /\/\/\s*(BUSINESS|RULE|VALIDATION|TODO|NOTE):\s*([^\n]+)/gi
  };
  
  const pattern = commentPatterns[language];
  if (pattern) {
    const comments = content.matchAll(pattern);
    for (const match of comments) {
      rules.push(`${match[1]}: ${match[2].trim()}`);
      if (rules.length >= 10) break; // Limitar a 10 reglas
    }
  }
  
  return rules;
}

/**
 * Analizar feature C# en profundidad
 */
async function analyzeCSharpFeature(featureId, validFiles, repoPath, tech_stack, maxDepth) {
  const allContent = [];
  const allFiles = [];
  
  for (const file of validFiles) {
    try {
      const content = fs.readFileSync(file.full, 'utf8');
      allContent.push(content);
      allFiles.push(file.relative);
    } catch (error) {
      log(`Error reading file ${file.full}: ${error.message}`);
    }
  }
  
  const combinedContent = allContent.join('\n\n');
  const baseName = path.basename(validFiles[0].relative, '.cs').replace('Controller', '');
  
  // Extraer todo
  const queries = extractCSharpQueries(combinedContent);
  const file_system = extractFilePaths(combinedContent, 'csharp');
  const external_services = extractExternalAPIs(combinedContent);
  const business_rules = extractBusinessRules(combinedContent, 'csharp');
  
  log(`C# Analysis: ${queries.length} queries, ${file_system.length} files, ${external_services.length} APIs`);
  
  // Data sources
  const data_sources = [];
  const databases = tech_stack.databases || [];
  
  for (const query of queries) {
    const queryInfo = analyzeQuery(query);
    for (const table of queryInfo.tables) {
      const parts = table.split('.');
      const schema = parts.length > 1 ? parts[0] : 'dbo';
      const tableName = parts[parts.length - 1];
      
      data_sources.push({
        kind: 'database',
        engine: databases[0]?.engine || 'sql_server',
        database: databases[0]?.name || 'DATABASE_NAME',
        schema,
        table: tableName,
        columns: queryInfo.columns.length > 0 ? queryInfo.columns : ['*'],
        filters: queryInfo.filters,
        joins: queryInfo.joins,
        source_code_snippet: query.substring(0, 600)
      });
    }
  }
  
  // Detectar inputs/outputs
  const methodPattern = /public\s+(?:async\s+)?(?:Task<)?(\w+)[^(]*\s+(\w+)\s*\(([^)]*)\)/g;
  const methods = [...combinedContent.matchAll(methodPattern)].slice(0, 5);
  const inputs = methods.map(m => ({
    name: m[2],
    type: m[1],
    description: m[3] || 'sin parámetros'
  }));
  
  return {
    feature_id: featureId,
    name: baseName.replace(/([A-Z])/g, ' $1').trim(),
    domain_purpose: `Funcionalidad de ${baseName}. Analizada desde ${validFiles.length} archivo(s) C#.`,
    inputs,
    outputs: [{ type: 'ActionResult', description: 'Respuesta del controller' }],
    data_sources,
    file_system,
    external_services,
    business_rules,
    files_involved: allFiles,
    tech_stack
  };
}

/**
 * Analizar feature Java en profundidad
 */
async function analyzeJavaFeature(featureId, validFiles, repoPath, tech_stack, maxDepth) {
  const allContent = [];
  const allFiles = [];
  
  for (const file of validFiles) {
    try {
      const content = fs.readFileSync(file.full, 'utf8');
      allContent.push(content);
      allFiles.push(file.relative);
    } catch (error) {
      log(`Error reading file ${file.full}: ${error.message}`);
    }
  }
  
  const combinedContent = allContent.join('\n\n');
  const baseName = path.basename(validFiles[0].relative, '.java').replace('Controller', '');
  
  // Extraer todo
  const queries = extractJavaQueries(combinedContent);
  const file_system = extractFilePaths(combinedContent, 'java');
  const external_services = extractExternalAPIs(combinedContent);
  const business_rules = extractBusinessRules(combinedContent, 'java');
  
  log(`Java Analysis: ${queries.length} queries, ${file_system.length} files, ${external_services.length} APIs`);
  
  // Data sources
  const data_sources = [];
  const databases = tech_stack.databases || [];
  
  for (const query of queries) {
    const queryInfo = analyzeQuery(query);
    for (const table of queryInfo.tables) {
      const parts = table.split('.');
      const schema = parts.length > 1 ? parts[0] : 'public';
      const tableName = parts[parts.length - 1];
      
      data_sources.push({
        kind: 'database',
        engine: databases[0]?.engine || 'postgresql',
        database: databases[0]?.name || 'DATABASE_NAME',
        schema,
        table: tableName,
        columns: queryInfo.columns.length > 0 ? queryInfo.columns : ['*'],
        filters: queryInfo.filters,
        joins: queryInfo.joins,
        source_code_snippet: query.substring(0, 600)
      });
    }
  }
  
  return {
    feature_id: featureId,
    name: baseName,
    domain_purpose: `Funcionalidad Java: ${baseName}`,
    inputs: [],
    outputs: [{ type: 'ResponseEntity', description: 'REST response' }],
    data_sources,
    file_system,
    external_services,
    business_rules,
    files_involved: allFiles,
    tech_stack
  };
}

/**
 * Analizar feature PHP en profundidad
 */
async function analyzePHPFeature(featureId, validFiles, repoPath, tech_stack, maxDepth) {
  const allContent = [];
  const allFiles = [];
  
  for (const file of validFiles) {
    try {
      const content = fs.readFileSync(file.full, 'utf8');
      allContent.push(content);
      allFiles.push(file.relative);
    } catch (error) {
      log(`Error reading file ${file.full}: ${error.message}`);
    }
  }
  
  const combinedContent = allContent.join('\n\n');
  const baseName = path.basename(validFiles[0].relative, '.php').replace('Controller', '');
  
  // Extraer todo
  const queries = extractPHPQueries(combinedContent);
  const file_system = extractFilePaths(combinedContent, 'php');
  const external_services = extractExternalAPIs(combinedContent);
  const business_rules = extractBusinessRules(combinedContent, 'php');
  
  log(`PHP Analysis: ${queries.length} queries, ${file_system.length} files, ${external_services.length} APIs`);
  
  // Data sources
  const data_sources = [];
  const databases = tech_stack.databases || [];
  
  for (const query of queries) {
    const queryInfo = analyzeQuery(query);
    for (const table of queryInfo.tables) {
      data_sources.push({
        kind: 'database',
        engine: databases[0]?.engine || 'mysql',
        database: databases[0]?.name || 'DATABASE_NAME',
        schema: '',
        table: table,
        columns: queryInfo.columns.length > 0 ? queryInfo.columns : ['*'],
        filters: queryInfo.filters,
        joins: queryInfo.joins,
        source_code_snippet: query.substring(0, 600)
      });
    }
  }
  
  return {
    feature_id: featureId,
    name: baseName,
    domain_purpose: `Funcionalidad PHP: ${baseName}`,
    inputs: [],
    outputs: [{ type: 'Response', description: 'HTTP response' }],
    data_sources,
    file_system,
    external_services,
    business_rules,
    files_involved: allFiles,
    tech_stack
  };
}

/**
 * Analizar feature Python en profundidad
 */
async function analyzePythonFeature(featureId, validFiles, repoPath, tech_stack, maxDepth) {
  const allContent = [];
  const allFiles = [];
  
  for (const file of validFiles) {
    try {
      const content = fs.readFileSync(file.full, 'utf8');
      allContent.push(content);
      allFiles.push(file.relative);
    } catch (error) {
      log(`Error reading file ${file.full}: ${error.message}`);
    }
  }
  
  const combinedContent = allContent.join('\n\n');
  const baseName = path.basename(validFiles[0].relative, '.py');
  
  // Extraer todo
  const queries = extractPythonQueries(combinedContent);
  const file_system = extractFilePaths(combinedContent, 'python');
  const external_services = extractExternalAPIs(combinedContent);
  const business_rules = extractBusinessRules(combinedContent, 'python');
  
  log(`Python Analysis: ${queries.length} queries, ${file_system.length} files, ${external_services.length} APIs`);
  
  // Data sources
  const data_sources = [];
  const databases = tech_stack.databases || [];
  
  for (const query of queries) {
    const queryInfo = analyzeQuery(query);
    for (const table of queryInfo.tables) {
      data_sources.push({
        kind: 'database',
        engine: databases[0]?.engine || 'postgresql',
        database: databases[0]?.name || 'DATABASE_NAME',
        schema: 'public',
        table: table,
        columns: queryInfo.columns.length > 0 ? queryInfo.columns : ['*'],
        filters: queryInfo.filters,
        joins: queryInfo.joins,
        source_code_snippet: query.substring(0, 600)
      });
    }
  }
  
  return {
    feature_id: featureId,
    name: baseName.replace(/_/g, ' ').title(),
    domain_purpose: `Funcionalidad Python: ${baseName}`,
    inputs: [],
    outputs: [{ type: 'JsonResponse', description: 'JSON response' }],
    data_sources,
    file_system,
    external_services,
    business_rules,
    files_involved: allFiles,
    tech_stack
  };
}

/**
 * Analizar feature JavaScript/TypeScript en profundidad
 */
async function analyzeJavaScriptFeature(featureId, validFiles, repoPath, tech_stack, maxDepth) {
  const allContent = [];
  const allFiles = [];
  
  for (const file of validFiles) {
    try {
      const content = fs.readFileSync(file.full, 'utf8');
      allContent.push(content);
      allFiles.push(file.relative);
    } catch (error) {
      log(`Error reading file ${file.full}: ${error.message}`);
    }
  }
  
  const combinedContent = allContent.join('\n\n');
  const baseName = path.basename(validFiles[0].relative).replace(/\.(js|ts)$/, '').replace(/Controller|Route/, '');
  
  // Extraer todo
  const queries = extractJavaScriptQueries(combinedContent);
  const file_system = extractFilePaths(combinedContent, 'javascript');
  const external_services = extractExternalAPIs(combinedContent);
  const business_rules = extractBusinessRules(combinedContent, 'javascript');
  
  log(`JS/TS Analysis: ${queries.length} queries, ${file_system.length} files, ${external_services.length} APIs`);
  
  // Data sources
  const data_sources = [];
  const databases = tech_stack.databases || [];
  
  for (const query of queries) {
    const queryInfo = analyzeQuery(query);
    for (const table of queryInfo.tables) {
      data_sources.push({
        kind: 'database',
        engine: databases[0]?.engine || 'postgresql',
        database: databases[0]?.name || 'DATABASE_NAME',
        schema: 'public',
        table: table,
        columns: queryInfo.columns.length > 0 ? queryInfo.columns : ['*'],
        filters: queryInfo.filters,
        joins: queryInfo.joins,
        source_code_snippet: query.substring(0, 600)
      });
    }
  }
  
  return {
    feature_id: featureId,
    name: baseName,
    domain_purpose: `Funcionalidad Node.js: ${baseName}`,
    inputs: [],
    outputs: [{ type: 'Response', description: 'Express/HTTP response' }],
    data_sources,
    file_system,
    external_services,
    business_rules,
    files_involved: allFiles,
    tech_stack
  };
}

/**
 * Helper: Crear spec básico para lenguajes no implementados
 */
function createBasicSpec(featureId, validFiles, tech_stack) {
  return {
    feature_id: featureId,
    name: "Feature detectada (análisis básico)",
    domain_purpose: "Análisis detallado pendiente de implementación para este lenguaje",
    inputs: [],
    outputs: [],
    data_sources: [],
    file_system: [],
    external_services: [],
    business_rules: [],
    files_involved: validFiles.map(f => f.relative),
    tech_stack
  };
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
    
    // Detectar features basándose en el tech stack
    const features = await detectFeatures(repoPath, tech_stack, max_files);
    
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
    const validFiles = [];
    for (const file of entry_files) {
      const fullPath = path.join(repoPath, file);
      if (fs.existsSync(fullPath)) {
        validFiles.push({ relative: file, full: fullPath });
      } else {
        log(`WARNING: Entry file not found: ${fullPath}`);
      }
    }
    
    if (validFiles.length === 0) {
      throw new Error("No valid entry files found");
    }
    
    // Analizar features según el lenguaje
    const language = tech_stack.language || 'csharp';
    let spec;
    
    switch (language) {
      case 'csharp':
        spec = await analyzeCSharpFeature(feature_id, validFiles, repoPath, tech_stack, max_depth);
        break;
        
      case 'java':
        spec = await analyzeJavaFeature(feature_id, validFiles, repoPath, tech_stack, max_depth);
        break;
        
      case 'php':
        spec = await analyzePHPFeature(feature_id, validFiles, repoPath, tech_stack, max_depth);
        break;
        
      case 'python':
        spec = await analyzePythonFeature(feature_id, validFiles, repoPath, tech_stack, max_depth);
        break;
        
      case 'javascript':
      case 'typescript':
        spec = await analyzeJavaScriptFeature(feature_id, validFiles, repoPath, tech_stack, max_depth);
        break;
        
      default:
        spec = createBasicSpec(feature_id, validFiles, tech_stack);
    }
    
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
