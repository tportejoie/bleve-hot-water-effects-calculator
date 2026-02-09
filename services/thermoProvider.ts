import { mockThermoProvider, ThermoProvider } from './thermoService';
import { createApiThermoProvider } from './backendThermoService';

export type ThermoProviderKind = 'mock' | 'api';

export function resolveThermoProviderKind(): ThermoProviderKind {
  const configured = (import.meta.env.VITE_THERMO_PROVIDER ?? 'mock').toLowerCase();
  return configured === 'api' ? 'api' : 'mock';
}

export function getThermoProvider(): ThermoProvider {
  const providerKind = resolveThermoProviderKind();

  if (providerKind === 'api') {
    const baseUrl = import.meta.env.VITE_THERMO_API_BASE_URL ?? 'http://localhost:8000';
    return createApiThermoProvider(baseUrl);
  }

  return mockThermoProvider;
}
