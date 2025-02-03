import { formatAIResponse, isValidAIResponse } from './utils/aiResponseFormatter.ts';
import { AutomatedTicketService } from './automatedTicketService.ts';

export async function generateAIResponse(message: string, context: string, aiSettings: any): Promise<string> {
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

async function generateGroqResponse(message: string, context: string, aiSettings: any): Promise<string> {
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const systemPrompt = `
You are an AI assistant responsible for analyzing user intents and determining when human intervention is needed.

Intent Detection Guidelines:
1. Always identify explicit requests for human agents
2. Evaluate message urgency (high/medium/low)
3. Detect support requests vs general queries
4. Consider user frustration signals
5. Use provided knowledge base context for informed decisions
6. Consider conversation history for better context

Escalation Criteria:
- Explicit human agent requests
- High urgency situations
- Complex support needs
- Low confidence in automated response
- Multiple repeated queries
- Technical issues requiring specialist knowledge

Available Intent Types:
- HUMAN_AGENT_REQUEST
- SUPPORT_REQUEST
- ORDER_PLACEMENT
- GENERAL_QUERY

Urgency Levels:
- high: immediate attention needed, critical issues, explicit urgency
- medium: standard support requests, non-critical issues
- low: general inquiries, information requests

Knowledge Base Context:
${context}

Admin Settings:
Tone: ${aiSettings.tone}
${aiSettings.behaviour || ''}

You MUST respond in the following JSON format without any markdown backticks or prefixes:
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
    
    // Format and validate the response
    const parsedResponse = formatAIResponse(responseText);
    
    if (!parsedResponse || !isValidAIResponse(parsedResponse)) {
      console.error('Invalid response structure:', parsedResponse);
      return "I apologize, but I received an invalid response format. Please try again.";
    }

    // Store the analysis for ticket creation if needed
    if (parsedResponse.requires_escalation || 
        parsedResponse.intent === 'HUMAN_AGENT_REQUEST' ||
        (parsedResponse.intent === 'SUPPORT_REQUEST' && parsedResponse.detected_entities.urgency_level === 'high')) {
      console.log('Ticket creation criteria met:', parsedResponse);
      console.log('Testing One')
      try {
        const ticket = await AutomatedTicketService.generateTicket({
          messageId: context.messageId, // Make sure context includes messageId
          conversationId: context.conversationId, // Make sure context includes conversationId
          analysis: parsedResponse,
          customerName: context.userName, // Make sure context includes userName
          platform: 'whatsapp',
          messageContent: message,
          context: context
        });
        
        if (ticket) {
          console.log('Ticket created successfully:', ticket);
        } else {
          console.error('Failed to create ticket - no ticket returned');
        }
      } catch (error) {
        console.error('Error creating ticket:', error);
        throw error; // Re-throw to ensure errors are not silently caught
      };
    }
    console.log('Testing Two');

    console.log('Testing Three');
    return parsedResponse.response;
  } catch (error) {
    console.error('Error getting Groq response:', error);
    throw error;
  }
}

async function generateGeminiResponse(message: string, context: string, aiSettings: any): Promise<string> {
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

  const knowledgeBaseContext = context ? `\nRelevant knowledge base context:\n${context}` : '';
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
