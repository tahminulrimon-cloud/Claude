# Weather MCP Server

A Python MCP (Model Context Protocol) server that provides real-time weather data via Open-Meteo (no API key required).

## Stack

- Python 3.10+
- `mcp` library (stdio server)
- `httpx` for async HTTP
- `uv` for package management

## Running the server

```bash
uv run weather.py
```

## Installing dependencies

Dependencies are declared in `pyproject.toml`. `uv run` installs them automatically.

## Project layout

- `weather.py` — MCP server with two tools: `get_current_weather` and `get_weather_forecast`
- `pyproject.toml` — project metadata and dependencies
- `uv.lock` — pinned dependency lockfile (committed)

## Claude Desktop config (Windows)

```json
{
  "mcpServers": {
    "weather": {
      "command": "uv",
      "args": ["--directory", "C:\\Users\\tahminul.rimon\\weather", "run", "weather.py"]
    }
  }
}
```

Config path: `%AppData%\Claude\claude_desktop_config.json`

## APIs used

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast: `https://api.open-meteo.com/v1/forecast`
