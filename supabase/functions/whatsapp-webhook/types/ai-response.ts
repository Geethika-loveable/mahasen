export interface OrderInfo {
  product: string | null;
  quantity: number;
  state: 'COLLECTING_INFO' | 'CONFIRMING' | 'PROCESSING' | 'COMPLETED';
  confirmed: boolean;
}

export interface DetectedEntities {
  product_mentions: string[];
  issue_type: string | null;
  urgency_level: 'high' | 'medium' | 'low';
  order_info: OrderInfo;
}

export interface AIResponse {
  intent: 'HUMAN_AGENT_REQUEST' | 'SUPPORT_REQUEST' | 'ORDER_PLACEMENT' | 'GENERAL_QUERY';
  confidence: number;
  requires_escalation: boolean;
  escalation_reason: string | null;
  detected_entities: DetectedEntities;
  response: string;
}

export interface AIContext {
  messageId: string;
  conversationId: string;
  userName: string;
  knowledgeBase?: string;
}

export interface AISettings {
  tone: string;
  behaviour?: string;
  model_name: string;
}