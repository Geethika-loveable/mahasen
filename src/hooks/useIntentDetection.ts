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