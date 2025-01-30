import { AgentsTable, AISettingsTable, ConversationsTable, KnowledgeBaseFilesTable, MessagesTable, MessengerSettingsTable, TicketsTable } from './tables';
import { DatabaseFunctions } from './functions';
import { DatabaseEnums } from './enums';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agents: AgentsTable
      ai_settings: AISettingsTable
      conversations: ConversationsTable
      knowledge_base_files: KnowledgeBaseFilesTable
      messages: MessagesTable
      messenger_settings: MessengerSettingsTable
      tickets: TicketsTable
    }
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

export type PublicSchema = Database[Extract<keyof Database, "public">]