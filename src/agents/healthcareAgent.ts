import { Agent } from 'agents';
import { parseCSV } from '../utils/csvParser';
import { performAnalysis } from '../utils/dataAnalysis';
import { HealthcareDataset, AnalysisResult, ChatMessage } from '../types';

export class HealthcareAgent extends Agent {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    await this.sql.exec(`
      CREATE TABLE IF NOT EXISTS datasets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        row_count INTEGER NOT NULL,
        columns TEXT NOT NULL,
        data TEXT NOT NULL
      )
    `);

    await this.sql.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        dataset_id TEXT,
        FOREIGN KEY (dataset_id) REFERENCES datasets (id)
      )
    `);

    await this.sql.exec(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        query TEXT NOT NULL,
        results TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (dataset_id) REFERENCES datasets (id)
      )
    `);
  }

  async onMessage(message: any): Promise<Response> {
    const { type, data } = message;

    switch (type) {
      case 'upload_dataset':
        return this.handleDatasetUpload(data);
      case 'chat_message':
        return this.handleChatMessage(data);
      case 'get_datasets':
        return this.getDatasets();
      default:
        return new Response('Unknown message type', { status: 400 });
    }
  }

  private async handleDatasetUpload(data: { file: string; name: string }) {
    try {
      // Parse CSV data
      const parsedData = await parseCSV(data.file);
      
      // Create dataset record
      const dataset: HealthcareDataset = {
        id: crypto.randomUUID(),
        name: data.name,
        uploadedAt: new Date(),
        rowCount: parsedData.length,
        columns: Object.keys(parsedData[0] || {}),
        data: parsedData
      };

      // Store in Durable Object's SQL database
      await this.sql.exec(`
        INSERT INTO datasets (id, name, uploaded_at, row_count, columns, data)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        dataset.id,
        dataset.name,
        dataset.uploadedAt.toISOString(),
        dataset.rowCount,
        JSON.stringify(dataset.columns),
        JSON.stringify(dataset.data)
      ]);

      return Response.json({ success: true, dataset });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  private async handleChatMessage(data: { message: string; datasetId?: string }) {
    try {
      // Get dataset if specified
      let dataset = null;
      if (data.datasetId) {
        const result = await this.sql.exec(
          'SELECT * FROM datasets WHERE id = ?',
          [data.datasetId]
        );
        dataset = result.results[0] ? JSON.parse(result.results[0].data as string) : null;
      }

      // Generate analysis using AI
      const analysisPrompt = `
        User query: ${data.message}
        Dataset available: ${dataset ? 'Yes' : 'No'}
        ${dataset ? `Dataset columns: ${JSON.parse(dataset.columns).join(', ')}` : ''}
        
        Provide a helpful response about healthcare data analysis.
      `;

      const aiResponse = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
        prompt: analysisPrompt,
        max_tokens: 512
      });

      // Store chat message
      const messageId = crypto.randomUUID();
      await this.sql.exec(`
        INSERT INTO chat_messages (id, role, content, timestamp, dataset_id)
        VALUES (?, ?, ?, ?, ?)
      `, [
        messageId,
        'user',
        data.message,
        new Date().toISOString(),
        data.datasetId || null
      ]);

      await this.sql.exec(`
        INSERT INTO chat_messages (id, role, content, timestamp)
        VALUES (?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        'assistant',
        aiResponse.response,
        new Date().toISOString()
      ]);

      return Response.json({ 
        message: aiResponse.response,
        analysis: dataset ? await performAnalysis(dataset.data, data.message) : null
      });

    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  async getDatasets() {
    const result = await this.sql.exec('SELECT id, name, uploaded_at, row_count FROM datasets');
    return Response.json({ datasets: result.results });
  }
}
