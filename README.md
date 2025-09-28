# cf_ai_healthcare_insights

An AI-powered healthcare data analysis agent built on Cloudflare's platform. Upload healthcare datasets and interact with them using natural language queries.

## Features

- **Dataset Upload**: Support for CSV healthcare datasets
- **AI-Powered Analysis**: Natural language querying using Llama 3.3
- **Statistical Analysis**: Automated descriptive statistics and insights
- **Real-time Chat**: WebSocket-based interactive interface
- **Persistent State**: Durable Objects for data persistence

## Architecture

- **Agent**: Custom Durable Object extending Cloudflare's Agent SDK
- **LLM**: Llama 3.3 70B via Workers AI for query understanding
- **Storage**: SQLite database in Durable Objects for datasets and chat history
- **Frontend**: Vanilla HTML/CSS/JS with WebSocket communication
- **Analytics**: Custom statistical analysis using simple-statistics library

## Local Development

1. Clone the repository:
```
git clone https://github.com/yourusername/cf_ai_healthcare_insights.git
cd cf_ai_healthcare_insights
```

2. Install dependencies:
```
npm install
```

3. Start development server:
```
npx wrangler dev
```

4. Open http://localhost:8787 in your browser

## Deployment

Deploy to Cloudflare:
```
npx wrangler deploy
```


## Usage

1. **Upload Dataset**: Drag and drop a CSV file with healthcare data
2. **Ask Questions**: Use natural language queries like:
   - "What's the average age of patients?"
   - "Show me gender distribution"
   - "Are there any correlations between age and outcomes?"
3. **View Results**: Get AI-generated insights with statistical analysis

## Sample Healthcare Data Format
patient_id,age,gender,diagnosis,treatment_outcome,days_in_hospital
1,45,Female,Diabetes,Improved,5
2,67,Male,Hypertension,Stable,3
3,34,Female,Asthma,Recovered,2


## Technology Stack

- **Cloudflare Workers**: Serverless compute platform
- **Durable Objects**: Stateful objects with SQLite storage
- **Workers AI**: Llama 3.3 70B language model
- **Agents SDK**: Framework for building AI agents
- **TypeScript**: Type-safe development
- **Simple Statistics**: Statistical analysis library

## License

No License