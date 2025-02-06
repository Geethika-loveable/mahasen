import { AIContext, AIResponse, AISettings } from "./types/ai-response.ts";
import { generateGroqResponse, generateGeminiResponse } from "./services/model-service.ts";
import { AutomatedTicketService } from './automatedTicketService.ts';

export async function generateAIResponse(
  message: string, 
  context: AIContext, 
  aiSettings: AISettings
): Promise<string> {
  try {
    let responseText: string;
    
    if (aiSettings.model_name === 'llama-3.3-70b-versatile') {
      responseText = await generateGroqResponse(message, context, aiSettings);
    } else if (aiSettings.model_name === 'gemini-2.0-flash-exp') {
      responseText = await generateGeminiResponse(message, context, aiSettings);
    } else if (aiSettings.model_name === 'deepseek-r1-distill-llama-70b') {
      responseText = await generateGroqResponse(message, context, aiSettings);
    } else {
      throw new Error('Invalid model specified');
    }

    const parsedResponse = parseAndValidateResponse(responseText);
    return await handleParsedResponse(parsedResponse, context);
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
  }
}

function parseAndValidateResponse(responseText: string): AIResponse {
  try {
    const parsedResponse = JSON.parse(responseText);
    validateResponseFormat(parsedResponse);
    return parsedResponse;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Invalid response format from AI model');
  }
}

function validateResponseFormat(response: any): void {
  const requiredFields = ['intent', 'confidence', 'requires_escalation', 'detected_entities', 'response'];
  for (const field of requiredFields) {
    if (!(field in response)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

async function handleParsedResponse(
  parsedResponse: AIResponse, 
  context: AIContext
): Promise<string> {
  if (parsedResponse.intent === 'ORDER_PLACEMENT') {
    return await handleOrderResponse(parsedResponse, context);
  }

  if (parsedResponse.requires_escalation || 
      parsedResponse.intent === 'HUMAN_AGENT_REQUEST' ||
      (parsedResponse.intent === 'SUPPORT_REQUEST' && 
       parsedResponse.detected_entities.urgency_level === 'high')) {
    await createSupportTicket(parsedResponse, context);
  }

  return parsedResponse.response;
}

async function handleOrderResponse(
  parsedResponse: AIResponse, 
  context: AIContext
): Promise<string> {
  const orderInfo = parsedResponse.detected_entities.order_info;
  
  if (orderInfo.state === 'PROCESSING' && orderInfo.confirmed) {
    try {
      const ticket = await AutomatedTicketService.generateTicket({
        messageId: context.messageId,
        conversationId: context.conversationId,
        analysis: parsedResponse,
        customerName: context.userName,
        platform: 'whatsapp',
        messageContent: `Order: ${orderInfo.product} x ${orderInfo.quantity}`,
        context: `Product: ${orderInfo.product}\nQuantity: ${orderInfo.quantity}`
      });

      if (ticket) {
        return `Your Order for ${orderInfo.product} for ${orderInfo.quantity} is placed successfully. Order Number is ${ticket.id}.`;
      }
    } catch (error) {
      console.error('Error creating order ticket:', error);
    }
    return "Order failed. Please retry with correct Product & Quantity in a bit.";
  }

  return parsedResponse.response;
}

async function createSupportTicket(
  parsedResponse: AIResponse, 
  context: AIContext
): Promise<void> {
  try {
    await AutomatedTicketService.generateTicket({
      messageId: context.messageId,
      conversationId: context.conversationId,
      analysis: parsedResponse,
      customerName: context.userName,
      platform: 'whatsapp',
      messageContent: parsedResponse.response,
      context: context.knowledgeBase || ''
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
  }
}