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
    const closedClients = new Set<ReadableStreamController<Uint8Array>>();

    this.clients.forEach(client => {
      try {
        // Check if the controller's desiredSize is null (indicates closed stream)
        if (client.desiredSize === null) {
          closedClients.add(client);
          return;
        }
        client.enqueue(message);
      } catch (error) {
        console.error('Error sending SSE update:', error);
        closedClients.add(client);
      }
    });

    // Clean up closed clients
    closedClients.forEach(client => {
      this.clients.delete(client);
    });
  }

  public formatSSEMessage(data: any) {
    return this.encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  }
}

// Export the singleton instance
export const sseManager = SSEManager.getInstance(); 