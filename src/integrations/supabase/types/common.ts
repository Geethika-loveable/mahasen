import { AgentTables } from './agents';
import { AiSettingsTables } from './ai-settings';
import { ConversationTables } from './conversations';
import { KnowledgeBaseTables } from './knowledge-base';
import { MessageTables } from './messages';
import { MessengerTables } from './messenger';
import { TicketTables } from './tickets';
import { DatabaseFunctions } from './database-functions';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: AgentTables & 
           AiSettingsTables & 
           ConversationTables & 
           KnowledgeBaseTables & 
           MessageTables & 
           MessengerTables & 
           TicketTables
    Views: {
      [_ in never]: never
    }
    Functions: DatabaseFunctions
    Enums: DatabaseEnums
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type DatabaseEnums = {
  agent_type: "welcome" | "sales" | "knowledge" | "support"
  ai_model: "llama3.2:latest" | "gemini-2.0-flash-exp"
  ai_tone: "Professional" | "Friendly" | "Empathetic" | "Playful"
  message_status: "sent" | "received"
  platform_type: "whatsapp" | "facebook" | "instagram"
  ticket_status: "New" | "In Progress" | "Escalated" | "Completed"
}