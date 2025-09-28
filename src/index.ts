import { HealthcareAgent } from './agents/healthcareAgent';

export { HealthcareAgent };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (url.pathname === '/websocket') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected websocket', { status: 400 });
      }

      const agentId = url.searchParams.get('id') || 'default';
      const id = env.HEALTHCARE_AGENT.idFromString(agentId);
      const agent = env.HEALTHCARE_AGENT.get(id);

      return agent.fetch(request);
    }

    // Serve static files
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return env.ASSETS.fetch(request);
    }

    // Handle other static assets
    if (url.pathname.startsWith('/')) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};

// Export the Durable Object class
export { HealthcareAgent };
