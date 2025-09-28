export interface HealthcareDataset {
  id: string;
  name: string;
  uploadedAt: Date;
  rowCount: number;
  columns: string[];
  data: Record<string, any>[];
}

export interface AnalysisResult {
  id: string;
  datasetId: string;
  query: string;
  results: {
    summary: string;
    statistics: Record<string, number>;
    insights: string[];
    visualizations?: any[];
  };
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysisId?: string;
}
