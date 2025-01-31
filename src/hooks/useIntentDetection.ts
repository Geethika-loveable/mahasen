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