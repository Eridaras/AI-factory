# Scripts de AI Factory

Utilidades CLI para automatizar tareas comunes del ecosistema.

## Scripts Disponibles

### run-audit.sh (próximamente)

Ejecutará una auditoría completa de un proyecto sin necesidad de Claude Desktop.

**Uso previsto**:
```bash
./scripts/run-audit.sh /path/to/project
```

**Funcionalidad**:
- Analiza el proyecto
- Ejecuta herramientas MCP
- Genera documentos de auditoría
- Crea un reporte en formato HTML/PDF

## Desarrollo

Todos los scripts deben:
1. Ser ejecutables (`chmod +x script.sh`)
2. Incluir shebang apropiado (`#!/bin/bash` o `#!/usr/bin/env node`)
3. Validar argumentos de entrada
4. Manejar errores gracefully
5. Proporcionar output claro y progreso

## Próximamente

- `run-audit.sh`: Auditoría sin Claude Desktop
- `setup-mcp.sh`: Configuración automática de servidores MCP
- `generate-report.js`: Generador de reportes HTML/PDF desde auditorías
- `validate-stack.sh`: Validación rápida de versiones de stack
