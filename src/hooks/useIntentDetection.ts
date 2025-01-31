import { useState } from 'react';
import { IntentAnalysis, TicketCreationInfo } from '@/types/intent';
import { IntentDetectionService } from '@/services/intentDetection';

export const useIntentDetection = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState<IntentAnalysis | null>(null);
  const [ticketInfo, setTicketInfo] = useState<TicketCreationInfo | null>(null);

  const analyzeMessage = (
    message: string,
    messageId: string,
    knowledgeBaseContext: string | null = null,
    conversationContext: string = ''
  ) => {
    const analysis = IntentDetectionService.analyzeIntent(message, knowledgeBaseContext);
    const ticketInfo = IntentDetectionService.generateTicketInfo(
      analysis,
      messageId,
      conversationContext
    ) as TicketCreationInfo; // Add type assertion here to ensure correct type

    setCurrentAnalysis(analysis);
    setTicketInfo(ticketInfo);

    return { analysis, ticketInfo };
  };

  return {
    currentAnalysis,
    ticketInfo,
    analyzeMessage
  };
};