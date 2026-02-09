
import React, { useState, useCallback } from 'react';
import { CalculationInputs, CalculationResults } from './types';
import { calculateBleve } from './services/bleveCalculator';
import { exportToExcel } from './services/excelExporter';
import { DEFAULT_INPUTS } from './constants';
import Input from './components/Input';
import Button from './components/Button';
import ResultsCard from './components/ResultsCard';
import OverpressureChart from './components/OverpressureChart';
import { BleveIcon, GithubIcon, HelpCircleIcon, ZapIcon, Trash2Icon } from './components/Icons';


const App: React.FC = () => {
  const [inputs, setInputs] = useState<CalculationInputs>(DEFAULT_INPUTS);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isNumeric = e.target.type === 'number';
    
    setInputs(prev => ({ 
      ...prev, 
      // Handle numeric fields correctly, allowing them to be empty temporarily
      [name]: isNumeric ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const handleCalculate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Create a final, fully-numeric version of inputs for the calculator
      const numericInputs: CalculationInputs = {
        ...inputs,
        volume: Number(inputs.volume),
        liquidFraction: Number(inputs.liquidFraction),
        pressureRel: Number(inputs.pressureRel),
        asb: Number(inputs.asb),
      };
      // Simulate a short delay for better UX
      await new Promise(res => setTimeout(res, 300));
      const newResults = await calculateBleve(numericInputs);
      setResults(newResults);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during calculation.");
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [inputs]);

  const handleReset = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    setResults(null);
    setError(null);
  }, []);

  const handleExport = useCallback(() => {
    if (results) {
      exportToExcel(results, inputs);
    }
  }, [results, inputs]);

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans">
      <header className="bg-gray-800 shadow-md">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <BleveIcon className="w-8 h-8 mr-3 text-gold-500" />
            <h1 className="text-xl font-bold text-gold-500">BLEVE Calculator</h1>
          </div>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="View on GitHub">
            <GithubIcon className="w-6 h-6" />
          </a>
        </nav>
      </header>

      <main className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-lg h-fit">
          <h2 className="text-2xl font-semibold mb-6 text-white border-b-2 border-gold-500 pb-2">Input Parameters</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleCalculate(); }} className="space-y-4">
            <Input
              label="Vessel Volume"
              name="volume"
              unit="m³"
              type="number"
              value={inputs.volume}
              onChange={handleInputChange}
              tooltip="Total volume of the vessel containing the liquid."
              min="0.01"
              step="any"
              required
            />
            <Input
              label="Liquid Volume Fraction"
              name="liquidFraction"
              unit="-"
              type="number"
              step="0.001"
              min="0.01"
              max="1"
              value={inputs.liquidFraction}
              onChange={handleInputChange}
              tooltip="Fraction of the vessel volume occupied by the liquid (0 to 1)."
              required
            />
            <Input
              label="Relative Rupture Pressure"
              name="pressureRel"
              unit="bar"
              type="number"
              value={inputs.pressureRel}
              onChange={handleInputChange}
              tooltip="The gauge pressure at which the vessel ruptures."
              min="0"
              step="any"
              required
            />
            <Input
              label="Surface Factor (Asb)"
              name="asb"
              unit="-"
              type="number"
              step="0.1"
              value={inputs.asb}
              onChange={handleInputChange}
              tooltip="Factor representing the ground surface's reflectivity. E.g., 2.0 for hard, flat surfaces."
              min="0"
              required
            />
            <Input
              label="Overpressure Thresholds"
              name="thresholds"
              unit="mbar"
              type="text"
              value={inputs.thresholds}
              onChange={handleInputChange}
              tooltip="Comma-separated list of overpressure values to calculate effect distances for."
              required
            />
            <div className="mt-8 flex items-center gap-4">
              <Button type="submit" isLoading={isLoading} className="w-full">
                <ZapIcon className="w-5 h-5 mr-2" />
                Calculate
              </Button>
              <Button type="button" onClick={handleReset} variant="secondary" title="Reset Inputs">
                <Trash2Icon className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </aside>

        <section className="lg:col-span-2 space-y-8">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {results ? (
            <>
              <ResultsCard results={results} onExport={handleExport} />
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Overpressure vs. Distance</h3>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                  <OverpressureChart data={results.overpressureCurve} />
                </div>
              </div>
            </>
          ) : !isLoading && !error && (
            <div className="flex flex-col items-center justify-center h-full bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                <HelpCircleIcon className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white">Awaiting Calculation</h3>
                <p className="text-gray-400 mt-2">Enter your parameters and click "Calculate" to see the results.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
