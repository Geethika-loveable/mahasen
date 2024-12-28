import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsAppMessage } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";

export const useMessageSending = (
  id: string | undefined,
  contactNumber: string | undefined,
  refetchMessages: () => void,
  isAIEnabled: boolean
) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (newMessage: string) => {
    if (!newMessage.trim() || !id || !contactNumber) return;
    
    setIsSending(true);
    try {
      // First, store the message in our database
      const { error: dbError } = await supabase.from("messages").insert({
        conversation_id: id,
        content: newMessage,
        status: "sent",
        sender_name: "Agent",
        sender_number: "system",
      });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      // Generate embedding for the message to search knowledge base
      console.log('Generating embedding for message:', newMessage);
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
        'generate-embedding',
        {
          body: { text: newMessage }
        }
      );

      if (embeddingError) {
        console.error('Embedding error:', embeddingError);
        throw embeddingError;
      }

      console.log('Successfully generated embedding:', embeddingData);

      // Search knowledge base for relevant content
      console.log('Searching knowledge base with embedding...');
      const { data: matches, error: searchError } = await supabase.rpc(
        'match_knowledge_base',
        {
          query_embedding: embeddingData.embedding,
          match_threshold: 0.7, // Adjust threshold for better matches
          match_count: 3 // Get top 3 most relevant matches
        }
      );

      if (searchError) {
        console.error('Knowledge base search error:', searchError);
        throw searchError;
      }

      console.log('Found knowledge base matches:', matches);

      // Prepare context from knowledge base matches
      const context = matches && matches.length > 0
        ? `\nRelevant information from knowledge base:\n${matches
            .map((match, index) => `[${index + 1}] ${match.content}`)
            .join('\n')}`
        : '';

      console.log('Prepared context:', context);

      // Then, send the message through WhatsApp using the Edge Function
      const messagePayload: WhatsAppMessage = {
        to: contactNumber,
        message: newMessage,
        type: "text",
        useAI: isAIEnabled,
        context: context // Add context to the message payload
      };

      console.log('Sending message with payload:', messagePayload);

      const { data, error: whatsappError } = await supabase.functions.invoke(
        'send-whatsapp',
        {
          body: messagePayload,
        }
      );

      if (whatsappError) {
        console.error('WhatsApp sending error:', whatsappError);
        throw whatsappError;
      }

      console.log('WhatsApp response:', data);

      refetchMessages();
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendMessage,
    isSending,
  };
};