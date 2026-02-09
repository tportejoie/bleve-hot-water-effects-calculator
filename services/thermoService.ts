
// IMPORTANT: This is a simplified mock service providing illustrative thermodynamic properties for water.
// A real-world, high-precision application would require a full IAPWS-97 library for JavaScript.
// The values here are representative for demonstrating the calculation logic.

export interface ThermoProperties {
  pressure: number; // Pa
  temperature: number; // K
  h_l: number; // J/kg (saturated liquid enthalpy)
  h_v: number; // J/kg (saturated vapor enthalpy)
  rho_l: number; // kg/m³ (saturated liquid density)
  rho_v: number; // kg/m³ (saturated vapor density)
  s_l: number; // J/kg.K (saturated liquid entropy)
  s_v: number; // J/kg.K (saturated vapor entropy)
  u_l: number; // J/kg (saturated liquid internal energy)
  u_v: number; // J/kg (saturated vapor internal energy)
}

export interface ThermoProvider {
  getPropertiesFromPressure: (pressurePa: number) => Promise<ThermoProperties>;
}

// Data points from steam tables (Pressure in Pa)
const steamTable: Record<number, Omit<ThermoProperties, 'pressure' | 'u_l' | 'u_v'>> = {
    101325: { // 1 atm
        temperature: 373.12,
        h_l: 419.06e3, h_v: 2675.4e3,
        rho_l: 958.35, rho_v: 0.597,
        s_l: 1.3069e3, s_v: 7.3549e3,
    },
    1000000: { // 10 bar
        temperature: 453.03,
        h_l: 762.5e3, h_v: 2777.1e3,
        rho_l: 887.3, rho_v: 5.14,
        s_l: 2.1381e3, s_v: 6.5850e3,
    },
    2000000: { // 20 bar
        temperature: 485.53,
        h_l: 908.4e3, h_v: 2798.3e3,
        rho_l: 850.5, rho_v: 9.95,
        s_l: 2.4465e3, s_v: 6.3390e3,
    },
    3000000: { // 30 bar
        temperature: 506.96,
        h_l: 1008.3e3, h_v: 2803.2e3,
        rho_l: 822.4, rho_v: 15.9,
        s_l: 2.6454e3, s_v: 6.1856e3,
    },
    4000000: { // 40 bar
        temperature: 523.01,
        h_l: 1087.4e3, h_v: 2800.3e3,
        rho_l: 799.3, rho_v: 21.3,
        s_l: 2.7968e3, s_v: 6.0695e3,
    },
};

const tablePressures = Object.keys(steamTable).map(Number).sort((a, b) => a - b);

const linearInterp = (x: number, x0: number, x1: number, y0: number, y1: number) => {
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
}

export const getPropertiesFromPressure = (pressurePa: number): ThermoProperties => {
  if (pressurePa < tablePressures[0] || pressurePa > tablePressures[tablePressures.length - 1]) {
    throw new Error(`Pressure ${pressurePa / 1e5} bar is out of the supported range of this simplified thermo service.`);
  }

  let p0 = tablePressures[0];
  let p1 = tablePressures[tablePressures.length - 1];

  for (let i = 0; i < tablePressures.length - 1; i++) {
    if (pressurePa >= tablePressures[i] && pressurePa <= tablePressures[i + 1]) {
      p0 = tablePressures[i];
      p1 = tablePressures[i + 1];
      break;
    }
  }
  
  const props0 = steamTable[p0];
  const props1 = steamTable[p1];
  
  if (pressurePa === p0) {
      const props = props0;
      return {
          ...props,
          pressure: pressurePa,
          u_l: props.h_l - pressurePa / props.rho_l,
          u_v: props.h_v - pressurePa / props.rho_v,
      }
  }

  const props: Omit<ThermoProperties, 'pressure' | 'u_l' | 'u_v'> = {
      temperature: linearInterp(pressurePa, p0, p1, props0.temperature, props1.temperature),
      h_l: linearInterp(pressurePa, p0, p1, props0.h_l, props1.h_l),
      h_v: linearInterp(pressurePa, p0, p1, props0.h_v, props1.h_v),
      rho_l: linearInterp(pressurePa, p0, p1, props0.rho_l, props1.rho_l),
      rho_v: linearInterp(pressurePa, p0, p1, props0.rho_v, props1.rho_v),
      s_l: linearInterp(pressurePa, p0, p1, props0.s_l, props1.s_l),
      s_v: linearInterp(pressurePa, p0, p1, props0.s_v, props1.s_v),
  };
  
  return {
    ...props,
    pressure: pressurePa,
    u_l: props.h_l - pressurePa / props.rho_l,
    u_v: props.h_v - pressurePa / props.rho_v,
  };
};

export const mockThermoProvider: ThermoProvider = {
  getPropertiesFromPressure: async (pressurePa: number) => getPropertiesFromPressure(pressurePa),
};
