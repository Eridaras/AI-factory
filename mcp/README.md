# Servidores MCP - AI Factory

Este directorio contiene los servidores MCP (Model Context Protocol) que exponen herramientas especializadas para diferentes ecosistemas de desarrollo.

## Servidores Disponibles

### 🛠 perplexity-audit-server.js

**Propósito**: Proporciona herramientas de research técnico para auditoría de código.

**Herramientas expuestas**:

1. **stack_status**
   - Evalúa el estado de soporte de tecnologías y versiones
   - Identifica componentes en EOL o próximos a EOL
   - Recomienda versiones actualizadas
   - Evalúa riesgo general del stack
   
   **Input**:
   ```json
   {
     "components": [
       { "name": "python", "version": "3.9" },
       { "name": "django", "version": "3.2" }
     ],
     "app_type": "saas-api"
   }
   ```
   
   **Output**:
   ```json
   {
     "components": [
       {
         "name": "python",
         "version": "3.9",
         "status": "nearing_eol",
         "recommended_version": "3.12",
         "notes": "..."
       }
     ],
     "overall_risk": "high",
     "summary": "..."
   }
   ```

2. **best_practices**
   - Obtiene mejores prácticas actualizadas (2025) para un stack específico
   - Enfoca en: seguridad, rendimiento, mantenibilidad, scalability, testing
   - Proporciona recomendaciones accionables
   
   **Input**:
   ```json
   {
     "language": "python",
     "framework": "fastapi",
     "database": "postgresql",
     "app_type": "saas-api",
     "focus": ["security", "performance"]
   }
   ```
   
   **Output**:
   ```json
   {
     "security": {
       "summary": "...",
       "recommendations": ["...", "..."]
     },
     "performance": {
       "summary": "...",
       "recommendations": ["...", "..."]
     }
   }
   ```

**API utilizada**: Perplexity Sonar (llama-3.1-sonar-large-128k-online)

**Logging**: Todas las operaciones se registran en `perplexity-audit.log` en este directorio:
- Llamadas a herramientas con inputs
- Llamadas a Perplexity API con tokens usados
- Errores con stack traces
- Resultados exitosos con resúmenes

**Validaciones implementadas**:
- ✅ Validación de inputs requeridos (lanza error si faltan)
- ✅ Validación de estructuras de salida (lanza error si JSON inválido)
- ✅ Manejo robusto de errores con logging completo

**Configuración**:
```json
{
  "mcpServers": {
    "perplexity-audit": {
      "command": "node",
      "args": ["path/to/perplexity-audit-server.js"],
      "env": {
        "PERPLEXITY_API_KEY": "your_key"
      }
    }
  }
}
```

## Próximamente

### 💡 perplexity-research-server.js
Research de mercado, análisis de competencia, validación de ideas de negocio.

### 🎨 gemini-design-server.js
Generación de identidad visual, paletas de colores, sugerencias de UI/UX.

### 🔍 tool-scout-server.js
Descubrimiento y evaluación de herramientas tecnológicas según requisitos.

## Desarrollo

### Crear un nuevo servidor MCP

1. Crea un nuevo archivo en este directorio: `mi-servidor.js`

2. Estructura básica:

```javascript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "mi-servidor",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Registrar herramientas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "mi_herramienta",
        description: "Descripción de lo que hace",
        inputSchema: {
          type: "object",
          properties: {
            // Definir parámetros
          },
          required: []
        }
      }
    ]
  };
});

// Manejar llamadas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "mi_herramienta") {
    // Implementar lógica
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
});

// Iniciar
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Mi servidor MCP ejecutándose");
}

main().catch(console.error);
```

3. Añade tu servidor a `claude_desktop_config.json`

4. Reinicia Claude Desktop

## Testing

Para probar un servidor de forma independiente:

```bash
node perplexity-audit-server.js
```

El servidor esperará input en stdin (JSON-RPC 2.0 sobre stdio).

## Buenas Prácticas

1. **Manejo de errores**: Siempre captura errores y devuelve estructuras JSON con campo `error: true`
2. **Validación de input**: Valida parámetros antes de procesar
3. **Timeout**: Implementa timeouts para llamadas a APIs externas
4. **Logging**: Usa `console.error()` para logs (stdout está reservado para MCP)
5. **Rate limiting**: Respeta límites de las APIs externas
6. **Documentación**: Documenta cada herramienta en `inputSchema.description`

## Recursos

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
- [Perplexity API Docs](https://docs.perplexity.ai)
- [Gemini API Docs](https://ai.google.dev/docs)
