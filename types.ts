
export interface CalculationInputs {
  volume: number; // m³
  liquidFraction: number; // 0-1
  pressureRel: number; // bar
  asb: number; // surface factor
  thresholds: string; // comma-separated mbar
}

export interface CalculationStep {
  description: string;
  value: string | number;
  unit: string;
}

export interface DistanceResult {
  threshold: number; // mbar
  distance: number; // m
}

export interface OverpressurePoint {
    distance: number; // m
    overpressure: number; // mbar
}

export interface CalculationResults {
  availableEnergy: number; // Joules
  effectiveEnergy: number; // Joules
  distanceResults: DistanceResult[];
  calculationSteps: CalculationStep[];
  overpressureCurve: OverpressurePoint[];
}

export interface ChartData {
  distance: number;
  overpressure: number;
}
