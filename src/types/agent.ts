export interface Agent {
  id: string;
  name: string;
  type: 'welcome' | 'sales' | 'knowledge' | 'support';
  systemRole: string;  // This matches our frontend usage
  prompt: string;
  features: string[];
}