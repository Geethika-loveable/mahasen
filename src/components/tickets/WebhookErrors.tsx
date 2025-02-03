import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WebhookError {
  id: string;
  error_type: string;
  message: string;
  details: any;
  notified: boolean;
  created_at: string;
}

export const WebhookErrors = () => {
  const { toast } = useToast();

  const { data: errors } = useQuery<WebhookError[]>({
    queryKey: ['webhook-errors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000 // Refetch every 5 seconds
  });

  useEffect(() => {
    if (errors && errors.length > 0) {
      errors.forEach((error) => {
        if (!error.notified) {
          toast({
            variant: "destructive",
            title: `WhatsApp Webhook Error: ${error.error_type}`,
            description: error.message,
          });

          // Update the notified status
          supabase
            .from('webhook_errors')
            .update({ notified: true })
            .eq('id', error.id)
            .then(() => {
              console.log('Updated notification status for error:', error.id);
            })
            .catch((updateError) => {
              console.error('Failed to update notification status:', updateError);
            });
        }
      });
    }
  }, [errors, toast]);

  return null; // This is a notification-only component
};