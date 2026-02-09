import { CalculationInputs, CalculationResults, CalculationStep, DistanceResult, OverpressurePoint } from '../types';
import { ATMOSPHERIC_PRESSURE_PA } from '../constants';
import { getThermoProvider } from './thermoProvider';

const tnoIndex10Points = [
  { p: 50, c: 0.11 },
  { p: 140, c: 0.05 },
  { p: 200, c: 0.032 },
  { p: 300, c: 0.028 },
];

function getTnoCoefficient(targetOverpressureMbar: number): number {
  // Handle edge cases (extrapolation) by clamping to the nearest known point's coefficient.
  if (targetOverpressureMbar <= tnoIndex10Points[0].p) {
    return tnoIndex10Points[0].c;
  }
  if (targetOverpressureMbar >= tnoIndex10Points[tnoIndex10Points.length - 1].p) {
    return tnoIndex10Points[tnoIndex10Points.length - 1].c;
  }

  // Find the two points to interpolate between.
  let p0: number | undefined, c0: number | undefined, p1: number | undefined, c1: number | undefined;
  for (let i = 0; i < tnoIndex10Points.length - 1; i++) {
    if (targetOverpressureMbar >= tnoIndex10Points[i].p && targetOverpressureMbar <= tnoIndex10Points[i + 1].p) {
      p0 = tnoIndex10Points[i].p;
      c0 = tnoIndex10Points[i].c;
      p1 = tnoIndex10Points[i + 1].p;
      c1 = tnoIndex10Points[i + 1].c;
      break;
    }
  }

  // This should not happen with the guards above, but as a fallback, return the closest point.
  if (p0 === undefined || p1 === undefined || c0 === undefined || c1 === undefined) {
      const closest = tnoIndex10Points.reduce((prev, curr) => 
        Math.abs(curr.p - targetOverpressureMbar) < Math.abs(prev.p - targetOverpressureMbar) ? curr : prev
      );
      return closest.c;
  }
  
  if (targetOverpressureMbar === p0) return c0;
  if (targetOverpressureMbar === p1) return c1;

  // Perform log-linear interpolation.
  // log(c) = log(c0) + (log(c1) - log(c0)) * (log(p) - log(p0)) / (log(p1) - log(p0))
  const log_p = Math.log(targetOverpressureMbar);
  const log_p0 = Math.log(p0);
  const log_p1 = Math.log(p1);
  const log_c0 = Math.log(c0);
  const log_c1 = Math.log(c1);

  const log_c = log_c0 + (log_c1 - log_c0) * (log_p - log_p0) / (log_p1 - log_p0);

  return Math.exp(log_c);
}

function getDistanceForOverpressure(
  targetOverpressureMbar: number,
  effectiveEnergyJ: number
): number {
  if (targetOverpressureMbar <= 0) return Infinity;

  const coefficient = getTnoCoefficient(targetOverpressureMbar);
  
  // The formula from the TNO model is D = C * E^(1/3)
  const distanceM = coefficient * Math.pow(effectiveEnergyJ, 1 / 3);
  return distanceM;
}

export const calculateBleve = async (inputs: CalculationInputs): Promise<CalculationResults> => {
  const thermoProvider = getThermoProvider();
  const steps: CalculationStep[] = [];
  const log = (description: string, value: string | number, unit: string) => {
    steps.push({ description, value: typeof value === 'number' ? parseFloat(value.toPrecision(5)) : value, unit });
  };

  if (!Number.isFinite(inputs.volume) || inputs.volume <= 0) {
    throw new Error('Vessel volume must be a positive number.');
  }
  if (!Number.isFinite(inputs.liquidFraction) || inputs.liquidFraction <= 0 || inputs.liquidFraction > 1) {
    throw new Error('Liquid volume fraction must be between 0 and 1.');
  }
  if (!Number.isFinite(inputs.pressureRel) || inputs.pressureRel < 0) {
    throw new Error('Relative rupture pressure must be a non-negative number.');
  }
  if (!Number.isFinite(inputs.asb) || inputs.asb <= 0) {
    throw new Error('Surface factor (Asb) must be greater than 0.');
  }

  // Step 1: Initial Conditions
  log('Total Volume (V_tot)', inputs.volume, 'm³');
  log('Liquid Volume Fraction (φ_l)', inputs.liquidFraction, '-');
  log('Initial Relative Pressure (P_rel)', inputs.pressureRel, 'bar');
  const pressureInitialAbsPa = inputs.pressureRel * 1e5 + ATMOSPHERIC_PRESSURE_PA;
  log('Initial Absolute Pressure (P_i)', pressureInitialAbsPa / 1e5, 'bar');

  // Step 2: Thermodynamic Properties at Initial State
  const initialProps = await thermoProvider.getPropertiesFromPressure(pressureInitialAbsPa);
  log('Initial Temperature', (initialProps.temperature - 273.15).toFixed(2), '°C');
  log('Initial Liquid Enthalpy (h_l_i)', initialProps.h_l / 1e3, 'kJ/kg');
  log('Initial Vapor Enthalpy (h_v_i)', initialProps.h_v / 1e3, 'kJ/kg');
  log('Initial Liquid Density (ρ_l_i)', initialProps.rho_l, 'kg/m³');
  log('Initial Vapor Density (ρ_v_i)', initialProps.rho_v, 'kg/m³');
  log('Initial Liquid Entropy (s_l_i)', initialProps.s_l / 1e3, 'kJ/kg.K');
  log('Initial Vapor Entropy (s_v_i)', initialProps.s_v / 1e3, 'kJ/kg.K');
  
  // Step 3: Mass and Volume Calculations
  const Vl = inputs.volume * inputs.liquidFraction;
  const Vv = inputs.volume - Vl;
  const ml = initialProps.rho_l * Vl;
  const mv = initialProps.rho_v * Vv;
  const M_total = ml + mv;
  log('Liquid Volume (V_l)', Vl, 'm³');
  log('Vapor Volume (V_v)', Vv, 'm³');
  log('Liquid Mass (m_l)', ml, 'kg');
  log('Vapor Mass (m_v)', mv, 'kg');
  log('Total Mass (M_tot)', M_total, 'kg');

  // Step 4: Initial Internal Energy
  const ul_i = initialProps.u_l;
  const uv_i = initialProps.u_v;
  const Ui = ml * ul_i + mv * uv_i;
  log('Initial Liquid Internal Energy (u_l_i)', ul_i / 1e3, 'kJ/kg');
  log('Initial Vapor Internal Energy (u_v_i)', uv_i / 1e3, 'kJ/kg');
  log('Total Initial Internal Energy (U_i)', Ui / 1e6, 'MJ');

  // Step 5: Isentropic Expansion to Final State (Atmospheric Pressure)
  const si = (ml * initialProps.s_l + mv * initialProps.s_v) / M_total;
  log('Average Initial Entropy (s_i)', si / 1e3, 'kJ/kg.K');

  const finalProps = await thermoProvider.getPropertiesFromPressure(ATMOSPHERIC_PRESSURE_PA);
  log('Final Liquid Entropy (s_l_f)', finalProps.s_l / 1e3, 'kJ/kg.K');
  log('Final Vapor Entropy (s_v_f)', finalProps.s_v / 1e3, 'kJ/kg.K');
  
  const y = (si - finalProps.s_l) / (finalProps.s_v - finalProps.s_l);
  log('Final Vapor Mass Fraction (y)', y, '-');
  
  if (y < 0 || y > 1) {
    throw new Error('Calculation resulted in an invalid final vapor fraction. Check input parameters.');
  }

  // Step 6: Final Internal Energy
  const ul_f = finalProps.u_l;
  const uv_f = finalProps.u_v;
  const Uf = M_total * ((1 - y) * ul_f + y * uv_f);
  log('Final Liquid Internal Energy (u_l_f)', ul_f / 1e3, 'kJ/kg');
  log('Final Vapor Internal Energy (u_v_f)', uv_f / 1e3, 'kJ/kg');
  log('Total Final Internal Energy (U_f)', Uf / 1e6, 'MJ');

  // Step 7: Available and Effective Energy
  const E_available = Ui - Uf;
  log('Available Energy (E_available = Ui - Uf)', E_available / 1e6, 'MJ');
  
  const E_effective = inputs.asb * E_available;
  log('Surface Factor (Asb)', inputs.asb, '-');
  log('Effective Energy (E_effective = Asb * E_available)', E_effective / 1e6, 'MJ');

  // Step 8: Calculate Effect Distances
  const thresholds = inputs.thresholds.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
  if (thresholds.length === 0) {
    throw new Error('At least one positive overpressure threshold is required.');
  }
  const distanceResults: DistanceResult[] = thresholds.map(threshold => ({
    threshold,
    distance: getDistanceForOverpressure(threshold, E_effective),
  }));

  // Step 9: Generate Overpressure Curve Data
  const curvePoints: OverpressurePoint[] = [];
  const maxDist = (distanceResults.length > 0 ? Math.max(...distanceResults.map(r => r.distance)) : 1000) * 1.2;
  const numPoints = 100;
  
  const maxThreshold = Math.max(...thresholds, 300);
  const minThreshold = Math.min(...thresholds, 10) * 0.5;

  for (let i = 0; i <= numPoints; i++) {
    const p = maxThreshold - (i * (maxThreshold - minThreshold)) / numPoints;
    if (p > 0) {
      const dist = getDistanceForOverpressure(p, E_effective);
      if (dist < maxDist * 2 && dist > 0) {
         curvePoints.push({ distance: dist, overpressure: p });
      }
    }
  }
  curvePoints.sort((a, b) => a.distance - b.distance);


  return {
    availableEnergy: E_available,
    effectiveEnergy: E_effective,
    distanceResults,
    calculationSteps: steps,
    overpressureCurve: curvePoints
  };
};
