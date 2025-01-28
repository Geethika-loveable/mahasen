import { AgentTables } from './agents';
import { AISettingsTables } from './ai-settings';
import { ConversationTables } from './conversations';
import { KnowledgeBaseTables } from './knowledge-base';
import { MessageTables } from './messages';
import { MessengerTables } from './messenger';
import { TicketTables } from './tickets';
import { DatabaseFunctionDefs } from './database-functions';

export type Database = {
  public: {
    Tables: AgentTables &
      AISettingsTables &
      ConversationTables &
      KnowledgeBaseTables &
      MessageTables &
      MessengerTables &
      TicketTables;
    Views: {
      [_ in never]: never;
    };
    Functions: DatabaseFunctionDefs;
    Enums: {
      ai_model: "groq-llama-3.3-70b" | "gemini-2.0-flash-exp";
      ai_tone: "Professional" | "Friendly" | "Empathetic" | "Playful";
      message_status: "sent" | "delivered" | "read" | "failed";
      platform: "whatsapp" | "facebook" | "instagram" | "telegram";
      ticket_status: "New" | "In Progress" | "Resolved" | "Closed";
      agent_type: "welcome" | "sales" | "knowledge" | "support";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type DatabaseEnums = Database['public']['Enums'];