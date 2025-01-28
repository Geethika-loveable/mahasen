export type Database = {
  public: {
    Tables: AgentsTables &
      AiSettingsTables &
      ConversationsTables &
      KnowledgeBaseTables &
      MessagesTables &
      MessengerTables &
      TicketsTables;
    Views: {
      [_ in never]: never;
    };
    Functions: DatabaseFunctions;
    Enums: {
      ai_model: "gemini-2.0-flash-exp" | "groq-llama-3.3-70b";
      ai_tone: "Professional" | "Friendly" | "Empathetic" | "Playful";
      message_status: "sent" | "delivered" | "read" | "failed";
      platform: "whatsapp" | "facebook" | "instagram" | "telegram";
      ticket_status: "New" | "In Progress" | "Resolved" | "Closed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type DatabaseEnums = Database['public']['Enums'];