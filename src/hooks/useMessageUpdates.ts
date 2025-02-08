
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Platform } from "@/types/platform";

export const useMessageUpdates = (platform: Platform | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!platform) return;

    console.log('Setting up real-time subscription for messages');

    const channel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          
          // Immediately invalidate and refetch conversations
          queryClient.invalidateQueries({ 
            queryKey: ["conversations", platform],
            exact: true
          });

          // Show notification for new messages
          if (payload.eventType === 'INSERT' && payload.new.status === 'received') {
            toast.success(`New message from ${payload.new.sender_name}`);
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to messages updates');
        }
      });

    return () => {
      console.log("Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [platform, queryClient]);
};
