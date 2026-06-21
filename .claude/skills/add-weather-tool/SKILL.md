---
name: add-weather-tool
description: Add a new tool to the weather MCP server. Invoke manually with /add-weather-tool <tool-name> <description>.
argument-hint: [tool-name] [description]
disable-model-invocation: true
allowed-tools: Read Edit Bash(uv run weather.py)
---

## Task

Add a new MCP tool called `$ARGUMENTS[0]` to `weather.py`.

Tool purpose: $ARGUMENTS[1]

## Steps

**1. Add a fetch function** above `@app.list_tools()`:

```python
async def get_<name>(latitude: float, longitude: float, timezone: str) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "timezone": timezone,
        # Add relevant Open-Meteo parameters here
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(WEATHER_URL, params=params)
        return response.json()
```

**2. Register in `list_tools()`** — append a `Tool(...)` entry:

```python
Tool(
    name="$ARGUMENTS[0]",
    description="$ARGUMENTS[1]",
    inputSchema={
        "type": "object",
        "properties": {
            "city": {"type": "string", "description": "City name"}
        },
        "required": ["city"]
    }
),
```

**3. Handle in `call_tool()`** — add an `elif` branch before the final `return`:

```python
elif name == "$ARGUMENTS[0]":
    data = await get_<name>(location["latitude"], location["longitude"], location["timezone"])
    # Format and return result
    return [TextContent(type="text", text=result)]
```

## Open-Meteo variable reference

Current weather variables: `temperature_2m`, `relative_humidity_2m`, `apparent_temperature`, `weather_code`, `wind_speed_10m`, `wind_direction_10m`, `precipitation`, `surface_pressure`, `visibility`, `uv_index`, `cloud_cover`

Daily variables: `temperature_2m_max`, `temperature_2m_min`, `weather_code`, `precipitation_sum`, `wind_speed_10m_max`, `sunrise`, `sunset`, `uv_index_max`, `precipitation_probability_max`

Hourly variables: `temperature_2m`, `precipitation_probability`, `precipitation`, `weather_code`, `wind_speed_10m`, `uv_index`

## Validation

After editing, verify the file has no syntax errors:

```bash
uv run python -c "import ast; ast.parse(open('weather.py').read()); print('OK')"
```
