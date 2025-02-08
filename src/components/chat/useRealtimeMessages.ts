
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRealtimeMessages = (
  id: string | undefined,
  refetchMessages: () => void
) => {
  useEffect(() => {
    if (!id) return;

    console.log("Setting up real-time subscription for conversation:", id);

    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`
        },
        (payload) => {
          console.log("Received real-time update:", payload);
          
          // Handle different event types
          if (payload.eventType === 'INSERT') {
            toast.success('New message received');
          } else if (payload.eventType === 'UPDATE') {
            toast.info('Message updated');
          }
          
          // Refetch messages to update the UI
          refetchMessages();
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        
        if (status === 'SUBSCRIBED') {
          toast.success('Connected to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          toast.error('Failed to connect to real-time updates');
          // Attempt to reconnect after a delay
          setTimeout(() => {
            console.log("Attempting to reconnect...");
            channel.subscribe();
          }, 5000);
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up subscription");
      channel.unsubscribe();
    };
  }, [id, refetchMessages]);
};
