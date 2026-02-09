
import React from 'react';
import { CalculationResults } from '../types';
import Button from './Button';
import { DownloadIcon } from './Icons';

interface ResultsCardProps {
  results: CalculationResults;
  onExport: () => void;
}

const ResultsCard: React.FC<ResultsCardProps> = ({ results, onExport }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Analysis Results</h3>
          <p className="text-sm text-gray-400">Summary of BLEVE energy and effects.</p>
        </div>
        <Button onClick={onExport} variant="secondary">
          <DownloadIcon className="w-5 h-5 mr-2" />
          Export to Excel
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700/50 p-4 rounded-md">
          <p className="text-sm text-gray-400">Available Energy (E_available)</p>
          <p className="text-2xl font-bold text-gold-500">{(results.availableEnergy / 1e6).toFixed(2)} MJ</p>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-md">
          <p className="text-sm text-gray-400">Effective Energy (E_effective)</p>
          <p className="text-2xl font-bold text-gold-500">{(results.effectiveEnergy / 1e6).toFixed(2)} MJ</p>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold text-lg mb-3 text-white">Effect Distances</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="p-3 text-sm font-semibold tracking-wide">Overpressure Threshold</th>
                <th className="p-3 text-sm font-semibold tracking-wide">Effect Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {results.distanceResults.map((res) => (
                <tr key={res.threshold} className="hover:bg-gray-700/30 transition-colors">
                  <td className="p-3 whitespace-nowrap">{res.threshold} mbar</td>
                  <td className="p-3 whitespace-nowrap font-medium">{res.distance.toFixed(2)} m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsCard;