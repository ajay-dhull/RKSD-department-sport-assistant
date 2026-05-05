import { type User, type InsertUser, type ChatMessage, type InsertChatMessage, type CollegeInfo, type InsertCollegeInfo } from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat messages
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // College information
  getCollegeInfo(): Promise<CollegeInfo[]>;
  getCollegeInfoByCategory(category: string): Promise<CollegeInfo[]>;
  createCollegeInfo(info: InsertCollegeInfo): Promise<CollegeInfo>;
  searchCollegeInfo(query: string): Promise<CollegeInfo[]>;
  
  // Admin methods
  getCollegeDataJSON(): Promise<any>;
  updateCollegeDataJSON(data: any): Promise<void>;
  getClassesDataJSON(): Promise<any>;
  updateClassesDataJSON(data: any): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatMessages: ChatMessage[];
  private collegeInfo: CollegeInfo[];

  constructor() {
    this.users = new Map();
    this.chatMessages = [];
    this.collegeInfo = [];
    this.initializeCollegeData();
  }

  private initializeCollegeData() {
    console.log('Initializing college data - all data now comes from Supabase and website scraping');
    
    const basicData: Omit<CollegeInfo, 'id'>[] = [
      {
        category: 'college',
        title: 'College Information',
        content: 'R.K.S.D. (PG) College, Kaithal - Data is dynamically loaded from Supabase database and RKSD College website.',
        metadata: JSON.stringify({ 
          note: 'All college data is now managed through admin panel and automatically imported from website.',
          website: 'https://rksdcollege.ac.in'
        })
      }
    ];
    
    basicData.forEach(data => {
      const id = randomUUID();
      this.collegeInfo.push({ ...data, id });
    });

    console.log('Basic college info initialized - use Import from Website feature in admin panel to populate data');
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getChatMessages(limit = 50): Promise<ChatMessage[]> {
    return this.chatMessages
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, limit)
      .reverse();
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const chatMessage: ChatMessage = {
      ...message,
      id,
      timestamp: new Date(),
      language: message.language ?? null,
    };
    this.chatMessages.push(chatMessage);
    return chatMessage;
  }

  async getCollegeInfo(): Promise<CollegeInfo[]> {
    return this.collegeInfo;
  }

  async getCollegeInfoByCategory(category: string): Promise<CollegeInfo[]> {
    return this.collegeInfo.filter(info => info.category === category);
  }

  async createCollegeInfo(info: InsertCollegeInfo): Promise<CollegeInfo> {
    const id = randomUUID();
    const collegeInfo: CollegeInfo = { 
      ...info, 
      id,
      metadata: info.metadata ?? null 
    };
    this.collegeInfo.push(collegeInfo);
    return collegeInfo;
  }

  async searchCollegeInfo(query: string): Promise<CollegeInfo[]> {
    const searchTerm = query.toLowerCase();
    return this.collegeInfo.filter(info => 
      info.title.toLowerCase().includes(searchTerm) ||
      info.content.toLowerCase().includes(searchTerm) ||
      info.category.toLowerCase().includes(searchTerm)
    );
  }

  async getCollegeDataJSON(): Promise<any> {
    return {
      message: 'College data is now managed through Supabase database and imported from website.',
      note: 'Use the admin panel Import from Website feature to populate data.',
      website: 'https://rksdcollege.ac.in'
    };
  }

  async updateCollegeDataJSON(data: any): Promise<void> {
    console.log('College data is now managed through Supabase database');
  }

  async getClassesDataJSON(): Promise<any> {
    return {
      message: 'Class schedule data is now managed through Supabase database.',
      note: 'Use the admin panel to manage class schedules.'
    };
  }

  async updateClassesDataJSON(data: any): Promise<void> {
    console.log('Class data is now managed through Supabase database');
  }
}

export const storage = new MemStorage();
