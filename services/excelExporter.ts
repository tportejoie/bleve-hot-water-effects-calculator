import { CalculationResults, CalculationInputs } from '../types';

export const exportToExcel = async (results: CalculationResults, inputs: CalculationInputs): Promise<void> => {
  const [{ default: ExcelJS }, { default: saveAs }] = await Promise.all([
    import('exceljs'),
    import('file-saver'),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BLEVE Calculator';
  workbook.created = new Date();
  
  // --- YellowBook_Steps Sheet ---
  const stepsSheet = workbook.addWorksheet('YellowBook_Steps');
  stepsSheet.columns = [
    { header: 'Description', key: 'description', width: 45 },
    { header: 'Value', key: 'value', width: 20 },
    { header: 'Unit', key: 'unit', width: 15 },
  ];
  stepsSheet.addRows(results.calculationSteps);

  // --- Distances_Effet Sheet ---
  const distancesSheet = workbook.addWorksheet('Distances_Effet');
  distancesSheet.columns = [
    { header: 'Overpressure Threshold', key: 'threshold', width: 25 },
    { header: 'Effect Distance', key: 'distance', width: 20 },
    { header: 'Method', key: 'method', width: 25 },
  ];
  results.distanceResults.forEach(res => {
    distancesSheet.addRow({
      threshold: `${res.threshold} mbar`,
      distance: `${res.distance.toFixed(2)} m`,
      method: 'TNO Multi-Energy (Index 10)'
    });
  });

  // --- Courbe Sheet ---
  const curveSheet = workbook.addWorksheet('Courbe');
  curveSheet.columns = [
    { header: 'Distance (m)', key: 'distance', width: 20 },
    { header: 'Overpressure (mbar)', key: 'overpressure', width: 25 },
  ];
  results.overpressureCurve.forEach(p => {
    curveSheet.addRow({
        distance: p.distance.toFixed(2),
        overpressure: p.overpressure.toFixed(2)
    });
  });

  // --- SourceCode Sheet ---
  const sourceCodeSheet = workbook.addWorksheet('SourceCode_Info');
  sourceCodeSheet.getCell('A1').value = 'Source Code Information';
  sourceCodeSheet.getCell('A1').font = { bold: true, size: 14 };
  sourceCodeSheet.getCell('A3').value = 'Note:';
  sourceCodeSheet.getCell('A3').font = { bold: true };
  sourceCodeSheet.getCell('A4').value = 'Embedding full source code in a web-based application export is not practical. The core calculation logic is implemented in TypeScript within the bleveCalculator.ts and thermoService.ts files of the application bundle.';
  sourceCodeSheet.getCell('A6').value = 'This export was generated based on the following inputs:';
  sourceCodeSheet.getCell('A7').value = `Volume: ${inputs.volume} m³, Liquid Fraction: ${inputs.liquidFraction}, Pressure: ${inputs.pressureRel} bar (rel), Asb: ${inputs.asb}`;


  // --- Generate and Download File ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `BLEVE_Analysis_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
