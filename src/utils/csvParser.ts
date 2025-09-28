import Papa from 'papaparse';

export async function parseCSV(csvContent: string): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
        } else {
          resolve(results.data as Record<string, any>[]);
        }
      },
      error: (error) => reject(error)
    });
  });
}

export function validateHealthcareData(data: Record<string, any>[]): string[] {
  const errors: string[] = [];
  
  if (data.length === 0) {
    errors.push('Dataset is empty');
    return errors;
  }

  // Check for required healthcare columns (flexible validation)
  const columns = Object.keys(data[0]);
  const requiredPatterns = ['age', 'gender', 'id'];
  
  requiredPatterns.forEach(pattern => {
    const hasColumn = columns.some(col => 
      col.toLowerCase().includes(pattern.toLowerCase())
    );
    if (!hasColumn) {
      errors.push(`No column found matching pattern: ${pattern}`);
    }
  });

  return errors;
}
