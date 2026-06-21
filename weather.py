import httpx
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import json

app = Server("weather")

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

WMO_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    77: "Snow grains", 80: "Slight showers", 81: "Moderate showers",
    82: "Violent showers", 85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail"
}


async def get_coordinates(city: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(GEOCODING_URL, params={"name": city, "count": 1, "language": "en", "format": "json"})
        data = response.json()
        if not data.get("results"):
            return None
        result = data["results"][0]
        return {
            "name": result["name"],
            "country": result.get("country", ""),
            "latitude": result["latitude"],
            "longitude": result["longitude"],
            "timezone": result.get("timezone", "UTC")
        }


async def get_current_weather(latitude: float, longitude: float, timezone: str) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "timezone": timezone,
        "current": [
            "temperature_2m", "relative_humidity_2m", "apparent_temperature",
            "weather_code", "wind_speed_10m", "wind_direction_10m",
            "precipitation", "surface_pressure", "visibility"
        ],
        "wind_speed_unit": "mph",
        "temperature_unit": "celsius"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(WEATHER_URL, params=params)
        return response.json()


async def get_forecast(latitude: float, longitude: float, timezone: str, days: int = 7) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "timezone": timezone,
        "daily": [
            "temperature_2m_max", "temperature_2m_min", "weather_code",
            "precipitation_sum", "wind_speed_10m_max", "sunrise", "sunset"
        ],
        "forecast_days": days,
        "temperature_unit": "celsius",
        "wind_speed_unit": "mph"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(WEATHER_URL, params=params)
        return response.json()


@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_current_weather",
            description="Get the current weather for a city",
            inputSchema={
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name (e.g. 'London', 'New York')"}
                },
                "required": ["city"]
            }
        ),
        Tool(
            name="get_weather_forecast",
            description="Get a multi-day weather forecast for a city",
            inputSchema={
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"},
                    "days": {"type": "integer", "description": "Number of forecast days (1-16)", "default": 7}
                },
                "required": ["city"]
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    city = arguments.get("city", "")

    location = await get_coordinates(city)
    if not location:
        return [TextContent(type="text", text=f"Could not find location: {city}")]

    if name == "get_current_weather":
        data = await get_current_weather(location["latitude"], location["longitude"], location["timezone"])
        current = data.get("current", {})
        units = data.get("current_units", {})
        code = current.get("weather_code", 0)
        condition = WMO_CODES.get(code, "Unknown")

        result = f"""Current Weather for {location['name']}, {location['country']}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Condition:        {condition}
Temperature:      {current.get('temperature_2m')}°C
Feels Like:       {current.get('apparent_temperature')}°C
Humidity:         {current.get('relative_humidity_2m')}%
Wind Speed:       {current.get('wind_speed_10m')} mph
Wind Direction:   {current.get('wind_direction_10m')}°
Precipitation:    {current.get('precipitation')} mm
Pressure:         {current.get('surface_pressure')} hPa
Visibility:       {current.get('visibility')} m
"""
        return [TextContent(type="text", text=result)]

    elif name == "get_weather_forecast":
        days = arguments.get("days", 7)
        data = await get_forecast(location["latitude"], location["longitude"], location["timezone"], days)
        daily = data.get("daily", {})

        lines = [f"Weather Forecast for {location['name']}, {location['country']}", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"]
        dates = daily.get("time", [])
        for i, date in enumerate(dates):
            code = daily.get("weather_code", [])[i] if i < len(daily.get("weather_code", [])) else 0
            condition = WMO_CODES.get(code, "Unknown")
            t_max = daily.get("temperature_2m_max", [])[i] if i < len(daily.get("temperature_2m_max", [])) else "N/A"
            t_min = daily.get("temperature_2m_min", [])[i] if i < len(daily.get("temperature_2m_min", [])) else "N/A"
            rain = daily.get("precipitation_sum", [])[i] if i < len(daily.get("precipitation_sum", [])) else "N/A"
            wind = daily.get("wind_speed_10m_max", [])[i] if i < len(daily.get("wind_speed_10m_max", [])) else "N/A"
            sunrise = daily.get("sunrise", [])[i] if i < len(daily.get("sunrise", [])) else "N/A"
            sunset = daily.get("sunset", [])[i] if i < len(daily.get("sunset", [])) else "N/A"

            lines.append(f"\n{date}")
            lines.append(f"  Condition:   {condition}")
            lines.append(f"  High/Low:    {t_max}°C / {t_min}°C")
            lines.append(f"  Rain:        {rain} mm")
            lines.append(f"  Wind:        {wind} mph")
            lines.append(f"  Sunrise:     {sunrise}")
            lines.append(f"  Sunset:      {sunset}")

        return [TextContent(type="text", text="\n".join(lines))]

    return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
