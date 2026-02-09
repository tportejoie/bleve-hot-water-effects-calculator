import { ThermoProperties, ThermoProvider } from './thermoService';

interface ThermoApiResponse {
  pressure: number;
  temperature: number;
  h_l: number;
  h_v: number;
  rho_l: number;
  rho_v: number;
  s_l: number;
  s_v: number;
  u_l?: number;
  u_v?: number;
}

function parseThermoResponse(payload: ThermoApiResponse): ThermoProperties {
  return {
    pressure: payload.pressure,
    temperature: payload.temperature,
    h_l: payload.h_l,
    h_v: payload.h_v,
    rho_l: payload.rho_l,
    rho_v: payload.rho_v,
    s_l: payload.s_l,
    s_v: payload.s_v,
    u_l: payload.u_l ?? payload.h_l - payload.pressure / payload.rho_l,
    u_v: payload.u_v ?? payload.h_v - payload.pressure / payload.rho_v,
  };
}

export async function getPropertiesFromApi(baseUrl: string, pressurePa: number): Promise<ThermoProperties> {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const response = await fetch(`${normalizedBaseUrl}/thermo/properties?pressurePa=${encodeURIComponent(pressurePa)}`);

  if (!response.ok) {
    throw new Error(`Thermo API error (${response.status}): unable to retrieve properties.`);
  }

  const payload = (await response.json()) as ThermoApiResponse;
  return parseThermoResponse(payload);
}

export function createApiThermoProvider(baseUrl: string): ThermoProvider {
  return {
    getPropertiesFromPressure: async (pressurePa: number) => getPropertiesFromApi(baseUrl, pressurePa),
  };
}
