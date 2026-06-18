---
name: weather-mcp
description: Patterns for modifying or extending the weather MCP server in weather.py. Use when adding tools, changing API parameters, or updating weather data formatting.
---

## Adding a new tool

1. Define an async function to fetch data
2. Register it in `list_tools()` with name, description, and inputSchema
3. Handle it in `call_tool()` with the matching `name ==` branch

## Weather codes

WMO weather codes are mapped in `WMO_CODES` dict at the top of `weather.py`. Add entries there for any new codes.

## API parameters

- Temperature unit: `celsius` (change to `fahrenheit` in params if needed)
- Wind speed unit: `mph`
- Open-Meteo docs: https://open-meteo.com/en/docs

## Testing locally

```bash
uv run weather.py
```

The server reads from stdin and writes to stdout (MCP stdio transport). Test via Claude Desktop or an MCP client.
