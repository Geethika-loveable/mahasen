import axios from 'axios';
import 'dotenv/config';

export interface MessageContext {
  wa_id: string;
  name: string;
  messageHistory: string[];
}

export interface OllamaConfig {
  model: string;
  baseUrl: string;
}

class OllamaService {
  private static instance: OllamaService;
  private config: OllamaConfig;
  private messageHistory: { [wa_id: string]: string[] };

  private constructor() {
    this.config = {
      model: "llama3.2:latest",
      baseUrl: process.env.VITE_OLLAMA_BASE_URL || "http://localhost:11434",
    };
    this.messageHistory = {};
  }

  public static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  private updateMessageHistory(wa_id: string, message: string) {
    if (!this.messageHistory[wa_id]) {
      this.messageHistory[wa_id] = [];
    }
    this.messageHistory[wa_id].push(message);
    if (this.messageHistory[wa_id].length > 5) {
      this.messageHistory[wa_id].shift();
    }
  }

  async generateResponse(context: MessageContext): Promise<string> {
    try {
      const prompt = `Previous messages:\n${context.messageHistory.join('\n')}\n\nUser ${context.name}: ${context.messageHistory[context.messageHistory.length - 1]}\n\nAssistant:`;
      
      const response = await axios.post(`${this.config.baseUrl}/api/generate`, {
        model: this.config.model,
        prompt,
        stream: false
      });

      const generatedResponse = response.data.response;
      this.updateMessageHistory(context.wa_id, generatedResponse);
      return generatedResponse;
    } catch (error) {
      console.error('Error generating Ollama response:', error);
      throw error;
    }
  }
}

export default OllamaService.getInstance();
