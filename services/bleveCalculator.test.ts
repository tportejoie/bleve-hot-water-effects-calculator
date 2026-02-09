import { describe, expect, it } from 'vitest';
import { calculateBleve } from './bleveCalculator';

const baseInputs = {
  volume: 1.0,
  liquidFraction: 0.7,
  pressureRel: 30,
  asb: 2.0,
  thresholds: '50,140,200',
};

describe('calculateBleve', () => {
  it('computes energies and distances for nominal inputs', async () => {
    const results = await calculateBleve(baseInputs);

    expect(results.availableEnergy).toBeGreaterThan(0);
    expect(results.effectiveEnergy).toBeGreaterThan(results.availableEnergy);
    expect(results.distanceResults.length).toBe(3);
    expect(results.overpressureCurve.length).toBeGreaterThan(10);
  });

  it('rejects invalid thresholds list', async () => {
    await expect(
      calculateBleve({
        ...baseInputs,
        thresholds: 'foo, -1, 0',
      })
    ).rejects.toThrow(/threshold/i);
  });

  it('rejects invalid liquid fraction', async () => {
    await expect(
      calculateBleve({
        ...baseInputs,
        liquidFraction: 1.2,
      })
    ).rejects.toThrow(/fraction/i);
  });

  it('rejects clearly out-of-range pressure', async () => {
    await expect(
      calculateBleve({
        ...baseInputs,
        pressureRel: 300,
      })
    ).rejects.toThrow(/supported range|outside|unable to retrieve/i);
  });
});
