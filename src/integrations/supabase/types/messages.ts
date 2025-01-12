import { DatabaseEnums } from './common';

export type MessageTables = {
  messages: {
    Row: {
      content: string
      conversation_id: string | null
      created_at: string | null
      id: string
      read: boolean | null
      sender_name: string
      sender_number: string
      status: DatabaseEnums["message_status"]
    }
    Insert: {
      content: string
      conversation_id?: string | null
      created_at?: string | null
      id?: string
      read?: boolean | null
      sender_name: string
      sender_number: string
      status: DatabaseEnums["message_status"]
    }
    Update: {
      content?: string
      conversation_id?: string | null
      created_at?: string | null
      id?: string
      read?: boolean | null
      sender_name?: string
      sender_number?: string
      status?: DatabaseEnums["message_status"]
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
}