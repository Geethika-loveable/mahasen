import axios from 'axios';
import 'dotenv/config';

export interface WhatsAppMessage {
  entry: [{
    changes: [{
      value: {
        contacts: [{
          wa_id: string;
          profile: { name: string; }
        }];
        messages: [{
          text: { body: string; }
        }];
      }
    }]
  }]
}

export interface WhatsAppResponse {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text";
  text: {
    preview_url: boolean;
    body: string;
  }
}

const WHATSAPP_API_BASE = 'https://graph.facebook.com/v17.0';

export class WhatsAppService {
  private static instance: WhatsAppService;
  private accessToken: string;
  private phoneId: string;
  private appId: string;
  private appSecret: string;

  private constructor() {
    this.accessToken = process.env.VITE_WHATSAPP_ACCESS_TOKEN || '';
    this.phoneId = process.env.VITE_WHATSAPP_PHONE_ID || '';
    this.appId = process.env.VITE_WHATSAPP_APP_ID || '';
    this.appSecret = process.env.VITE_WHATSAPP_APP_SECRET || '';

    if (!this.accessToken || !this.phoneId) {
      console.error('WhatsApp credentials missing in environment variables');
    }

    console.log('WhatsApp Service initialized with:', {
      phoneId: this.phoneId,
      appId: this.appId,
      hasAccessToken: !!this.accessToken,
      hasAppSecret: !!this.appSecret
    });
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  async sendMessage(to: string, message: string): Promise<WhatsAppResponse> {
    console.log('Attempting to send WhatsApp message:', { to, messageLength: message.length });
    
    const url = `${WHATSAPP_API_BASE}/${this.phoneId}/messages`;
    const payload: WhatsAppResponse = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    };

    try {
      console.log('Making WhatsApp API request to:', url);
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('WhatsApp API response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('WhatsApp API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
      } else {
        console.error('Unknown error while sending WhatsApp message:', error);
      }
      throw error;
    }
  }
}

export default WhatsAppService.getInstance();
