import { IntentAnalysis } from './intent';

export type TicketType = 'SUPPORT' | 'REQUEST' | 'ORDER';
export type TicketStatus = 'New' | 'In Progress' | 'Escalated' | 'Completed';
export type Platform = 'whatsapp' | 'facebook' | 'instagram';

export interface Ticket {
  id: number;
  title: string;
  customer_name: string;
  platform: Platform;
  type: string;
  status: TicketStatus;
  created_at: string;
  body: string;
  message_id?: string;
  conversation_id?: string;
  intent_type?: TicketType;
  context?: string;
  confidence_score?: number;
  escalation_reason?: string;
}

export interface TicketCreationInfo {
  title: string;
  customer_name: string;
  platform: Platform;
  type: string;
  body: string;
  message_id?: string;
  conversation_id?: string;
  intent_type?: TicketType;
  context?: string;
  confidence_score?: number;
  escalation_reason?: string;
}