import { Database } from './database';

export interface AgentsTable {
  Row: {
    created_at: string
    features: string[]
    id: string
    name: string
    prompt: string
    system_role: string
    type: Database["public"]["Enums"]["agent_type"]
    updated_at: string
  }
  Insert: {
    created_at?: string
    features?: string[]
    id?: string
    name: string
    prompt: string
    system_role: string
    type: Database["public"]["Enums"]["agent_type"]
    updated_at?: string
  }
  Update: {
    created_at?: string
    features?: string[]
    id?: string
    name?: string
    prompt?: string
    system_role?: string
    type?: Database["public"]["Enums"]["agent_type"]
    updated_at?: string
  }
  Relationships: []
}

export interface AISettingsTable {
  Row: {
    behaviour: string | null
    context_memory_length: number | null
    conversation_timeout_hours: number | null
    created_at: string
    id: number
    model_name: Database["public"]["Enums"]["ai_model"]
    tone: Database["public"]["Enums"]["ai_tone"]
    updated_at: string
  }
  Insert: {
    behaviour?: string | null
    context_memory_length?: number | null
    conversation_timeout_hours?: number | null
    created_at?: string
    id?: number
    model_name?: Database["public"]["Enums"]["ai_model"]
    tone?: Database["public"]["Enums"]["ai_tone"]
    updated_at?: string
  }
  Update: {
    behaviour?: string | null
    context_memory_length?: number | null
    conversation_timeout_hours?: number | null
    created_at?: string
    id?: number
    model_name?: Database["public"]["Enums"]["ai_model"]
    tone?: Database["public"]["Enums"]["ai_tone"]
    updated_at?: string
  }
  Relationships: []
}

export interface ConversationsTable {
  Row: {
    ai_enabled: boolean | null
    contact_name: string
    contact_number: string
    created_at: string | null
    id: string
    platform: Database["public"]["Enums"]["platform_type"]
    updated_at: string | null
  }
  Insert: {
    ai_enabled?: boolean | null
    contact_name: string
    contact_number: string
    created_at?: string | null
    id?: string
    platform: Database["public"]["Enums"]["platform_type"]
    updated_at?: string | null
  }
  Update: {
    ai_enabled?: boolean | null
    contact_name?: string
    contact_number?: string
    created_at?: string | null
    id?: string
    platform?: Database["public"]["Enums"]["platform_type"]
    updated_at?: string | null
  }
  Relationships: []
}

export interface KnowledgeBaseFilesTable {
  Row: {
    content: string | null
    content_type: string
    created_at: string
    embedding: string | null
    file_path: string
    filename: string
    fts: unknown | null
    id: string
    size: number
    user_id: string
  }
  Insert: {
    content?: string | null
    content_type: string
    created_at?: string
    embedding?: string | null
    file_path: string
    filename: string
    fts?: unknown | null
    id?: string
    size: number
    user_id: string
  }
  Update: {
    content?: string | null
    content_type?: string
    created_at?: string
    embedding?: string | null
    file_path?: string
    filename?: string
    fts?: unknown | null
    id?: string
    size?: number
    user_id?: string
  }
  Relationships: []
}

export interface MessagesTable {
  Row: {
    content: string
    conversation_id: string | null
    created_at: string | null
    id: string
    read: boolean | null
    sender_name: string
    sender_number: string
    status: Database["public"]["Enums"]["message_status"]
  }
  Insert: {
    content: string
    conversation_id?: string | null
    created_at?: string | null
    id?: string
    read?: boolean | null
    sender_name: string
    sender_number: string
    status: Database["public"]["Enums"]["message_status"]
  }
  Update: {
    content?: string
    conversation_id?: string | null
    created_at?: string | null
    id?: string
    read?: boolean | null
    sender_name?: string
    sender_number?: string
    status?: Database["public"]["Enums"]["message_status"]
  }
  Relationships: [
    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
      isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    }
  ]
}

export interface MessengerSettingsTable {
  Row: {
    access_token: string
    created_at: string
    id: number
    page_id: string
    updated_at: string
  }
  Insert: {
    access_token: string
    created_at?: string
    id?: number
    page_id: string
    updated_at?: string
  }
  Update: {
    access_token?: string
    created_at?: string
    id?: number
    page_id?: string
    updated_at?: string
  }
  Relationships: []
}

export interface TicketsTable {
  Row: {
    body: string
    created_at: string
    customer_name: string
    id: number
    platform: Database["public"]["Enums"]["platform_type"]
    status: Database["public"]["Enums"]["ticket_status"]
    title: string
    type: string
  }
  Insert: {
    body: string
    created_at?: string
    customer_name: string
    id?: number
    platform: Database["public"]["Enums"]["platform_type"]
    status?: Database["public"]["Enums"]["ticket_status"]
    title: string
    type: string
  }
  Update: {
    body?: string
    created_at?: string
    customer_name?: string
    id?: number
    platform?: Database["public"]["Enums"]["platform_type"]
    status?: Database["public"]["Enums"]["ticket_status"]
    title?: string
    type?: string
  }
  Relationships: []
}