
import { CalculationInputs } from './types';

export const ATMOSPHERIC_PRESSURE_PA = 101325;
export const DEFAULT_ASB = 2.0;

export const DEFAULT_INPUTS: CalculationInputs = {
  volume: 1.0,
  liquidFraction: 0.7,
  pressureRel: 30.0,
  asb: DEFAULT_ASB,
  thresholds: '50, 140, 200',
};
