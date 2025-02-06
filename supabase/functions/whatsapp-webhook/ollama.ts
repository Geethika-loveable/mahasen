import { formatAIResponse, isValidAIResponse } from './utils/aiResponseFormatter.ts';
import { AutomatedTicketService } from './automatedTicketService.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generateAIResponse(message: string, context: any, aiSettings: any): Promise<string> {
  if (aiSettings.model_name === 'llama-3.3-70b-versatile') {
    return await generateGroqResponse(message, context, aiSettings);
  } else if (aiSettings.model_name === 'gemini-2.0-flash-exp') {
    return await generateGeminiResponse(message, context, aiSettings);
  } else if (aiSettings.model_name === 'deepseek-r1-distill-llama-70b') {
    return await generateGroqResponse(message, context, aiSettings);
  } else {
    throw new Error('Invalid model specified');
  }
}

async function generateGroqResponse(message: string, context: any, aiSettings: any): Promise<string> {
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const systemPrompt = `
You are an AI assistant responsible for analyzing user intents and handling both support requests and orders.

Knowledge Base Context:
${context.knowledgeBase || 'No specific knowledge base content available.'}

Conversation History:
${context.conversationHistory || 'No conversation history available.'}

Intent Detection Guidelines:
1. Identify explicit requests for human agents
2. Detect order requests and collect order information
3. Evaluate message urgency (high/medium/low)
4. Detect support requests vs general queries
5. Consider user frustration signals
6. Use provided knowledge base context for informed decisions
`;

  try {
    console.log('Sending request to Groq with context:', { message, context, aiSettings });
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiSettings.model_name === 'deepseek-r1-distill-llama-70b' ? 'deepseek-r1-distill-llama-70b' : 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorData
      });
      throw new Error(`Groq API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content.trim();
    console.log('Raw LLM response:', responseText);
    
    const parsedResponse = formatAIResponse(responseText);
    
    if (!parsedResponse || !isValidAIResponse(parsedResponse)) {
      console.error('Invalid response structure:', parsedResponse);
      return "I apologize, but I received an invalid response format. Please try again.";
    }

    // Handle order processing
    if (parsedResponse.intent === 'ORDER_PLACEMENT') {
      // Ensure order_info exists and has default quantity of 1
      if (!parsedResponse.detected_entities.order_info) {
        parsedResponse.detected_entities.order_info = {
          product: null,
          quantity: 1,
          state: 'COLLECTING_INFO',
          confirmed: false
        };
      }
      
      // Set default quantity if not explicitly specified
      if (!parsedResponse.detected_entities.order_info.quantity) {
        parsedResponse.detected_entities.order_info.quantity = 1;
      }
      
      const orderInfo = parsedResponse.detected_entities.order_info;
      
      if (orderInfo.state === 'PROCESSING' && orderInfo.confirmed) {
        console.log('Creating order ticket...');
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
          } else {
            return "Order failed. Please retry with correct Product & Quantity in a bit.";
          }
        } catch (error) {
          console.error('Error creating order ticket:', error);
          return "Order failed. Please retry with correct Product & Quantity in a bit.";
        }
      }
    }

    // Handle regular ticket creation for other cases
    if (parsedResponse.requires_escalation || 
        parsedResponse.intent === 'HUMAN_AGENT_REQUEST' ||
        (parsedResponse.intent === 'SUPPORT_REQUEST' && parsedResponse.detected_entities.urgency_level === 'high')) {
      try {
        await AutomatedTicketService.generateTicket({
          messageId: context.messageId,
          conversationId: context.conversationId,
          analysis: parsedResponse,
          customerName: context.userName,
          platform: 'whatsapp',
          messageContent: message,
          context: context.knowledgeBase || ''
        });
      } catch (error) {
        console.error('Error creating ticket:', error);
      }
    }

    return parsedResponse.response;
  } catch (error) {
    console.error('Error getting Groq response:', error);
    throw error;
  }
}

async function generateGeminiResponse(message: string, context: any, aiSettings: any): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  
  const intentDetectionPrompt = `
You are an AI assistant responsible for analyzing user intents and determining when human intervention is needed.

Intent Detection Guidelines:
1. Always identify explicit requests for human agents
2. Evaluate message urgency (high/medium/low)
3. Detect support requests vs general queries
4. Consider user frustration signals

You must respond in the following JSON format:
{
  "intent": "HUMAN_AGENT_REQUEST" | "SUPPORT_REQUEST" | "ORDER_PLACEMENT" | "GENERAL_QUERY",
  "confidence": 0.0-1.0,
  "requires_escalation": boolean,
  "escalation_reason": string | null,
  "detected_entities": {
    "product_mentions": string[],
    "issue_type": string | null,
    "urgency_level": "high" | "medium" | "low"
  },
  "response": string
}`;

  const knowledgeBaseContext = context ? `\nRelevant knowledge base context:\n${context.knowledgeBase}` : '';
  const adminBehaviorPrompt = `\nTone: ${aiSettings.tone}\n${aiSettings.behaviour || ''}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${intentDetectionPrompt}${adminBehaviorPrompt}${knowledgeBaseContext}\n\nUser message: ${message}\n\nProvide your analysis and response in the specified JSON format:` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate Gemini response');
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const responseText = data.candidates[0].content.parts[0].text.trim();
    
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(responseText);
      console.log('Parsed LLM response:', parsedResponse);

      // Store the analysis for ticket creation if needed
      if (parsedResponse.requires_escalation || 
          parsedResponse.intent === 'HUMAN_AGENT_REQUEST' ||
          (parsedResponse.intent === 'SUPPORT_REQUEST' && parsedResponse.detected_entities.urgency_level === 'high')) {
        console.log('Ticket creation may be needed:', parsedResponse);
      }

      // Return only the response part for the user
      return parsedResponse.response;
    } catch (parseError) {
      console.error('Error parsing LLM response as JSON:', parseError);
      return responseText;
    }
  } catch (error) {
    console.error('Error with Gemini API:', error);
    throw error;
  }
}
