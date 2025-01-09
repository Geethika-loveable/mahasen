export interface Agent {
  id: string;
  name: string;
  type: 'welcome' | 'sales' | 'knowledge' | 'support';
  systemRole: string;
  prompt: string;
  features: string[];
}