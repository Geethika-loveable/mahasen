import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { TicketBasicInfo } from "./ticket-form/TicketBasicInfo";
import { TicketPlatformInfo } from "./ticket-form/TicketPlatformInfo";
import { TicketStatusInfo } from "./ticket-form/TicketStatusInfo";
import { ticketFormSchema, type TicketFormValues } from "./ticket-form/types";

interface AddTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketAdded: (ticket: any) => void;
}

export function AddTicketDialog({ open, onOpenChange, onTicketAdded }: AddTicketDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: "",
      customer_name: "",
      platform: "whatsapp",
      type: "REQUEST",
      status: "New",
      body: "",
      priority: "HIGH",
    },
  });

  const onSubmit = async (values: TicketFormValues) => {
    setIsSubmitting(true);
    try {
      const ticketData = {
        title: values.title,
        customer_name: values.customer_name,
        platform: values.platform,
        type: values.type,
        status: values.status,
        body: values.body,
        priority: values.priority,
        assigned_to: values.assigned_to,
        intent_type: "HUMAN_AGENT_REQUEST",
        escalation_reason: "Customer explicitly requested human agent",
      };

      const { data, error } = await supabase
        .from("tickets")
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket created successfully",
      });

      onTicketAdded(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create ticket. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <TicketBasicInfo form={form} />
            <TicketPlatformInfo form={form} />
            <TicketStatusInfo form={form} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}