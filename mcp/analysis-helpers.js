// Helper functions for deep code analysis (to be inserted before scan_feature)

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
    queries.push(query);
  }
  
  return queries;
}

/**
 * Helper: Analizar información de una query SQL
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
  
  // Extraer tablas
  const tablePatterns = [/FROM\s+([[\].\w]+)/gi, /JOIN\s+([[\].\w]+)/gi];
  for (const pattern of tablePatterns) {
    const matches = query.matchAll(pattern);
    for (const match of matches) {
      const table = match[1].replace(/[\[\]]/g, '');
      if (!info.tables.includes(table)) info.tables.push(table);
    }
  }
  
  // Extraer columnas
  const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM/is);
  if (selectMatch && selectMatch[1] !== '*') {
    info.columns = selectMatch[1].split(',').map(c => c.trim()).slice(0, 20);
  }
  
  // WHERE clause
  const whereMatch = query.match(/WHERE\s+(.*?)(?:ORDER BY|GROUP BY|$)/is);
  if (whereMatch) info.filters = 'WHERE ' + whereMatch[1].trim().substring(0, 200);
  
  return info;
}

/**
 * Helper: Analizar feature C# en profundidad
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
  
  const combinedContent = allContent.join('\n');
  const baseName = path.basename(validFiles[0].relative, '.cs').replace('Controller', '');
  
  // Extraer queries
  const queries = extractCSharpQueries(combinedContent);
  log(`Extracted ${queries.length} queries`);
  
  // Data sources
  const data_sources = [];
  const databases = tech_stack.databases || [];
  
  for (const query of queries) {
    const queryInfo = analyzeQuery(query);
    for (const table of queryInfo.tables) {
      const [schema, tableName] = table.includes('.') ? table.split('.') : ['dbo', table];
      data_sources.push({
        kind: 'database',
        engine: databases[0]?.engine || 'sql_server',
        database: databases[0]?.name || 'DATABASE_NAME',
        schema,
        table: tableName,
        columns: queryInfo.columns.length > 0 ? queryInfo.columns : ['*'],
        filters: queryInfo.filters,
        source_code_snippet: query.substring(0, 500)
      });
    }
  }
  
  return {
    feature_id: featureId,
    name: baseName.replace(/([A-Z])/g, ' $1').trim(),
    domain_purpose: `Funcionalidad de ${baseName}`,
    inputs: [],
    outputs: [{ type: 'ActionResult', description: 'Controller response' }],
    data_sources,
    file_system: [],
    external_services: [],
    business_rules: [`Contiene ${queries.length} queries SQL`],
    files_involved: allFiles,
    tech_stack
  };
}

function createBasicSpec(featureId, validFiles, tech_stack) {
  return {
    feature_id: featureId,
    name: "Feature (basic analysis)",
    domain_purpose: "Detailed analysis not available for this language",
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
