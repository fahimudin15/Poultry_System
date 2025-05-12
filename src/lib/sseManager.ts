// Create a singleton for managing SSE clients
class SSEManager {
  private static instance: SSEManager;
  private clients: Set<ReadableStreamController<Uint8Array>>;
  private encoder: TextEncoder;

  private constructor() {
    this.clients = new Set();
    this.encoder = new TextEncoder();
  }

  public static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  public addClient(controller: ReadableStreamController<Uint8Array>) {
    this.clients.add(controller);
  }

  public removeClient(controller: ReadableStreamController<Uint8Array>) {
    this.clients.delete(controller);
  }

  public notifyClients() {
    const message = this.formatSSEMessage({ type: 'update' });
    this.clients.forEach(client => {
      try {
        client.enqueue(message);
      } catch (error) {
        console.error('Error sending SSE update:', error);
        this.clients.delete(client);
      }
    });
  }

  public formatSSEMessage(data: any) {
    return this.encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  }
}

// Export the singleton instance
export const sseManager = SSEManager.getInstance(); 