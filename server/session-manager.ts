/**
 * Session Management for Conversation Memory
 * Maintains conversation history per session with automatic cleanup
 */

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface Session {
  id: string;
  messages: Message[];
  lastActivity: number;
}

class SessionManager {
  private sessions: Map<string, Session>;
  private readonly MAX_MESSAGES = 30;
  private readonly SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessions = new Map();
    this.startCleanupTask();
  }

  /**
   * Generate a new session ID
   */
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get or create a session
   */
  getOrCreateSession(sessionId?: string): { sessionId: string; session: Session } {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.lastActivity = Date.now();
      return { sessionId, session };
    }

    // Create new session
    const newSessionId = this.generateSessionId();
    const newSession: Session = {
      id: newSessionId,
      messages: [],
      lastActivity: Date.now()
    };
    this.sessions.set(newSessionId, newSession);
    console.log(`Session created: ${newSessionId}`);
    return { sessionId: newSessionId, session: newSession };
  }

  /**
   * Add a message to session
   */
  addMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Session not found: ${sessionId}`);
      return;
    }

    session.messages.push({
      role,
      content,
      timestamp: Date.now()
    });

    // Keep only last N messages
    if (session.messages.length > this.MAX_MESSAGES) {
      session.messages = session.messages.slice(-this.MAX_MESSAGES);
    }

    session.lastActivity = Date.now();
  }

  /**
   * Get conversation history for Groq API
   * Returns messages in OpenAI format
   */
  getConversationHistory(sessionId: string, systemPrompt: string): Array<{ role: string; content: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [{ role: 'system', content: systemPrompt }];
    }

    // Start with system prompt
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add recent conversation history (last 20 messages for context)
    const recentMessages = session.messages.slice(-20);
    messages.push(...recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    })));

    return messages;
  }

  /**
   * Clear a specific session
   */
  clearSession(sessionId: string): void {
    if (this.sessions.delete(sessionId)) {
      console.log(`Session cleared: ${sessionId}`);
    }
  }

  /**
   * Clean up inactive sessions
   */
  private cleanupInactiveSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    const entries = Array.from(this.sessions.entries());
    for (const [sessionId, session] of entries) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} inactive sessions. Active sessions: ${this.sessions.size}`);
    }
  }

  /**
   * Start periodic cleanup task
   */
  private startCleanupTask(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup task (for graceful shutdown)
   */
  stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get session stats for monitoring
   */
  getStats(): { totalSessions: number; sessions: Array<{ id: string; messageCount: number; lastActivity: Date }> } {
    const sessions = Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      messageCount: session.messages.length,
      lastActivity: new Date(session.lastActivity)
    }));

    return {
      totalSessions: this.sessions.size,
      sessions
    };
  }
}

export const sessionManager = new SessionManager();
