/**
 * Court Session Management for Conversation Memory
 * Maintains conversation history per session for Court Assistant
 * Completely separate from Campus AI session manager
 */

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface CourtSession {
  id: string;
  messages: Message[];
  lastActivity: number;
}

class CourtSessionManager {
  private sessions: Map<string, CourtSession>;
  private readonly MAX_MESSAGES = 30;
  private readonly SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessions = new Map();
    this.startCleanupTask();
  }

  generateSessionId(): string {
    return `court_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getOrCreateSession(sessionId?: string): { sessionId: string; session: CourtSession } {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.lastActivity = Date.now();
      return { sessionId, session };
    }

    const newSessionId = this.generateSessionId();
    const newSession: CourtSession = {
      id: newSessionId,
      messages: [],
      lastActivity: Date.now()
    };
    this.sessions.set(newSessionId, newSession);
    console.log(`Court session created: ${newSessionId}`);
    return { sessionId: newSessionId, session: newSession };
  }

  addMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Court session not found: ${sessionId}`);
      return;
    }

    session.messages.push({
      role,
      content,
      timestamp: Date.now()
    });

    if (session.messages.length > this.MAX_MESSAGES) {
      session.messages = session.messages.slice(-this.MAX_MESSAGES);
    }

    session.lastActivity = Date.now();
  }

  getConversationHistory(sessionId: string, systemPrompt: string): Array<{ role: string; content: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [{ role: 'system', content: systemPrompt }];
    }

    return [
      { role: 'system', content: systemPrompt },
      ...session.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
  }

  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.lastActivity > this.SESSION_TIMEOUT) {
          this.sessions.delete(sessionId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`Court sessions cleaned up: ${cleanedCount} inactive sessions removed`);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
  }
}

export const courtSessionManager = new CourtSessionManager();
