---
name: weather-mcp
description: Reference for modifying or extending the weather MCP server. Use when adding tools, changing API parameters, updating weather formatting, or debugging the server in weather.py.
allowed-tools: Read Edit Bash(uv *)
---

## Current server state

!`cat weather.py`

## Architecture

The server has three layers you edit when adding a tool:

1. **Fetch function** — async function using `httpx.AsyncClient` that calls Open-Meteo
2. **`list_tools()`** — registers the tool with name, description, and inputSchema
3. **`call_tool()`** — dispatches on `name ==` and formats the result as `TextContent`

## Key constants

- `GEOCODING_URL` — resolves a city name to lat/lon/timezone
- `WEATHER_URL` — Open-Meteo forecast endpoint
- `WMO_CODES` — maps WMO weather code integers to human-readable strings

## Units in use

- Temperature: `celsius`
- Wind speed: `mph`
- Precipitation: `mm`
- Pressure: `hPa`
- Visibility: `m`

## Testing

```bash
uv run weather.py
```

The server communicates over stdio (MCP protocol). Test through Claude Desktop or an MCP client — not directly in a terminal since it expects binary MCP frames.
