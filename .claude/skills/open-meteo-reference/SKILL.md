---
name: open-meteo-reference
description: Open-Meteo API parameter reference. Use when selecting weather variables, understanding units, or choosing forecast models for the weather MCP server.
user-invocable: false
---

## Endpoints

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1`
- Forecast: `https://api.open-meteo.com/v1/forecast`

No API key required for either endpoint.

## Current weather variables (`current:`)

| Variable | Description | Unit |
|---|---|---|
| `temperature_2m` | Air temperature at 2m | °C / °F |
| `apparent_temperature` | Feels-like temperature | °C / °F |
| `relative_humidity_2m` | Relative humidity | % |
| `weather_code` | WMO weather code | - |
| `wind_speed_10m` | Wind speed at 10m | km/h, mph, m/s, kn |
| `wind_direction_10m` | Wind direction at 10m | ° |
| `wind_gusts_10m` | Wind gusts at 10m | km/h, mph, m/s, kn |
| `precipitation` | Total precipitation | mm |
| `surface_pressure` | Atmospheric pressure | hPa |
| `cloud_cover` | Total cloud cover | % |
| `visibility` | Visibility | m |
| `uv_index` | UV index | - |
| `is_day` | Day (1) or night (0) | 0/1 |
| `sunshine_duration` | Sunshine duration per hour | s |

## Daily variables (`daily:`)

| Variable | Description |
|---|---|
| `temperature_2m_max` / `_min` | Max/min temperature |
| `apparent_temperature_max` / `_min` | Max/min feels-like |
| `weather_code` | Dominant weather code |
| `precipitation_sum` | Total precipitation |
| `precipitation_hours` | Hours with precipitation |
| `precipitation_probability_max` | Max precipitation probability |
| `wind_speed_10m_max` | Max wind speed |
| `wind_gusts_10m_max` | Max wind gusts |
| `sunrise` / `sunset` | Sunrise/sunset time (ISO8601) |
| `uv_index_max` | Max UV index |
| `sunshine_duration` | Total sunshine |

## Hourly variables (`hourly:`)

`temperature_2m`, `precipitation_probability`, `precipitation`, `weather_code`, `wind_speed_10m`, `wind_direction_10m`, `uv_index`, `visibility`, `cloud_cover`, `relative_humidity_2m`, `dew_point_2m`, `surface_pressure`, `cape` (thunderstorm potential)

## Unit options

| Parameter | Options |
|---|---|
| `temperature_unit` | `celsius` (default), `fahrenheit` |
| `wind_speed_unit` | `kmh` (default), `mph`, `ms`, `kn` |
| `precipitation_unit` | `mm` (default), `inch` |
| `timeformat` | `iso8601` (default), `unixtime` |

## forecast_days

Range: 1–16. Default: 7. Use `past_days` (0–92) for historical data.

## WMO weather codes (selected)

0 Clear sky · 1 Mainly clear · 2 Partly cloudy · 3 Overcast  
45/48 Fog · 51/53/55 Drizzle · 61/63/65 Rain · 71/73/75 Snow  
80/81/82 Showers · 95 Thunderstorm · 96/99 Thunderstorm with hail
