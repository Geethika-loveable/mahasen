
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const useRealtimeMessages = (
  id: string | undefined,
  refetchMessages: () => void
) => {
  const queryClient = useQueryClient();

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
            // Update the query cache directly instead of refetching
            queryClient.setQueryData(
              ['messages', id],
              (oldData: any[] | undefined) => {
                if (!oldData) return [payload.new];
                // Only add if message doesn't already exist
                const messageExists = oldData.some(msg => msg.id === payload.new.id);
                if (!messageExists) {
                  toast.success('New message received');
                  return [...oldData, payload.new];
                }
                return oldData;
              }
            );
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(
              ['messages', id],
              (oldData: any[] | undefined) => {
                if (!oldData) return [payload.new];
                return oldData.map(msg => 
                  msg.id === payload.new.id ? payload.new : msg
                );
              }
            );
            toast.info('Message updated');
          }
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
  }, [id, queryClient]);
};
