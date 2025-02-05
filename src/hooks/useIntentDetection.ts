import { useState } from 'react';
import { IntentAnalysis, TicketCreationInfo } from '@/services/intent/types';
import { IntentDetectionService } from '@/services/intent/intentDetectionService';

export const useIntentDetection = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState<IntentAnalysis | null>(null);
  const [ticketInfo, setTicketInfo] = useState<TicketCreationInfo | null>(null);

  const analyzeMessage = (
    message: string,
    messageId: string,
    knowledgeBaseContext: string | null = null,
    conversationContext: string = '',
    previousMessages: string[] = []
  ) => {
    console.log('Analyzing message with context:', {
      message,
      knowledgeBaseContext,
      conversationContext,
      previousMessages
    });

    const analysis = IntentDetectionService.analyzeIntent(
      message, 
      knowledgeBaseContext,
      previousMessages
    );
    
    const generatedTicketInfo = IntentDetectionService.generateTicketInfo(
      analysis,
      messageId,
      conversationContext
    );

    console.log('Analysis result:', analysis);
    console.log('Generated ticket info:', generatedTicketInfo);

    setCurrentAnalysis(analysis);
    setTicketInfo(generatedTicketInfo);

    return { analysis, ticketInfo: generatedTicketInfo };
  };

  return {
    currentAnalysis,
    ticketInfo,
    analyzeMessage
  };
};