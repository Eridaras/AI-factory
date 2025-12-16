# Especificaciones de Funcionalidades

Este directorio contiene las especificaciones detalladas de funcionalidades extraídas de repositorios legacy usando el MCP `feature-replicator`.

## Estructura de archivos

Cada funcionalidad genera un archivo Markdown con el formato:

```
LEGACY-F-XXX_NombreFuncionalidad.md
```

## Contenido de cada especificación

Cada archivo `.md` incluye:

- **Propósito de negocio**: Descripción funcional clara
- **Entradas/Salidas**: Parámetros y respuestas
- **Fuentes de datos**: 
  - Bases de datos exactas (engine, database, schema, table)
  - Columnas específicas usadas
  - Queries SQL completas con filtros y joins
- **Sistema de archivos**: Rutas de red, carpetas, patrones de archivos
- **Servicios externos**: APIs, endpoints, payloads
- **Reglas de negocio**: Validaciones, condiciones, lógica
- **Archivos involucrados**: Código fuente que implementa la feature
- **Stack técnico**: Tecnologías utilizadas

## Uso

Estos documentos sirven como **contratos de implementación** para:

1. **Humanos**: Entienden qué hace la funcionalidad y cómo replicarla
2. **IAs**: Tienen toda la información estructurada para generar código equivalente en el nuevo stack

## Ejemplo de uso con Claude

```
Lee la especificación en LEGACY-F-002_ConsultaColores.md 
y genera la implementación equivalente en Node.js + PostgreSQL
```

La IA tendrá acceso a:
- Tablas exactas a consultar
- Columnas necesarias
- Lógica de negocio a replicar
- Validaciones a implementar
