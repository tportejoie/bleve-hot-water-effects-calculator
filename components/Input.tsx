
import React from 'react';
import { HelpCircleIcon } from './Icons';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  unit: string;
  tooltip: string;
}

const Input: React.FC<InputProps> = ({ label, unit, tooltip, ...props }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={props.name} className="block text-sm font-medium text-gray-300 flex items-center">
          {label}
          <span className="group relative ml-2">
            <HelpCircleIcon className="w-4 h-4 text-gray-500" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {tooltip}
            </span>
          </span>
        </label>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      <input
        id={props.name}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500 text-white"
        {...props}
      />
    </div>
  );
};

export default Input;