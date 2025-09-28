import * as ss from 'simple-statistics';
import * as d3 from 'd3-array';

export interface AnalysisSummary {
  summary: string;
  statistics: Record<string, number>;
  insights: string[];
}

export async function performAnalysis(data: Record<string, any>[], query: string): Promise<AnalysisSummary> {
  const numericColumns = getNumericColumns(data);
  const categoricalColumns = getCategoricalColumns(data);

  // Basic descriptive statistics
  const statistics: Record<string, number> = {};
  
  numericColumns.forEach(column => {
    const values = data.map(row => row[column]).filter(val => val !== null && !isNaN(val));
    if (values.length > 0) {
      statistics[`${column}_mean`] = ss.mean(values);
      statistics[`${column}_median`] = ss.median(values);
      statistics[`${column}_std`] = ss.standardDeviation(values);
      statistics[`${column}_min`] = Math.min(...values);
      statistics[`${column}_max`] = Math.max(...values);
    }
  });

  // Generate insights based on query
  const insights = generateInsights(data, query, numericColumns, categoricalColumns, statistics);
  
  const summary = `Analyzed ${data.length} records with ${numericColumns.length} numeric and ${categoricalColumns.length} categorical variables.`;

  return { summary, statistics, insights };
}

function getNumericColumns(data: Record<string, any>[]): string[] {
  if (data.length === 0) return [];
  
  const columns = Object.keys(data[0]);
  return columns.filter(column => {
    const sample = data.slice(0, 100).map(row => row[column]);
    return sample.every(val => val === null || val === undefined || typeof val === 'number');
  });
}

function getCategoricalColumns(data: Record<string, any>[]): string[] {
  if (data.length === 0) return [];
  
  const columns = Object.keys(data[0]);
  return columns.filter(column => {
    const sample = data.slice(0, 100).map(row => row[column]);
    return sample.some(val => typeof val === 'string');
  });
}

function generateInsights(
  data: Record<string, any>[], 
  query: string, 
  numericColumns: string[], 
  categoricalColumns: string[],
  statistics: Record<string, number>
): string[] {
  const insights: string[] = [];
  
  // Age-related insights (common in healthcare)
  const ageColumn = numericColumns.find(col => col.toLowerCase().includes('age'));
  if (ageColumn && statistics[`${ageColumn}_mean`]) {
    insights.push(`Average age in dataset: ${statistics[`${ageColumn}_mean`].toFixed(1)} years`);
    
    if (statistics[`${ageColumn}_mean`] > 65) {
      insights.push('Dataset primarily contains elderly patients (avg age > 65)');
    } else if (statistics[`${ageColumn}_mean`] < 35) {
      insights.push('Dataset primarily contains younger patients (avg age < 35)');
    }
  }

  // Gender distribution insights
  const genderColumn = categoricalColumns.find(col => col.toLowerCase().includes('gender'));
  if (genderColumn) {
    const genderCounts = d3.rollup(data, v => v.length, d => d[genderColumn]);
    const totalRecords = data.length;
    genderCounts.forEach((count, gender) => {
      const percentage = ((count / totalRecords) * 100).toFixed(1);
      insights.push(`${gender}: ${percentage}% of patients`);
    });
  }

  // Query-specific insights
  if (query.toLowerCase().includes('correlation')) {
    if (numericColumns.length >= 2) {
      insights.push(`Found ${numericColumns.length} numeric variables available for correlation analysis`);
    }
  }

  if (query.toLowerCase().includes('trend')) {
    insights.push('Consider time-series analysis if temporal data is available');
  }

  return insights;
}
