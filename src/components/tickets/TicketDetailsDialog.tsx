import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Ticket } from "@/types/ticket";
import { TicketHeader } from "./ticket-details/TicketHeader";
import { TicketStatus } from "./ticket-details/TicketStatus";
import { TicketPrioritySection } from "./ticket-details/TicketPriority";
import { TicketAssignment } from "./ticket-details/TicketAssignment";
import { TicketInfo } from "./ticket-details/TicketInfo";
import { TicketHistory } from "./ticket-details/TicketHistory";
import { TicketActions } from "./ticket-details/TicketActions";

interface TicketDetailsDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TicketDetailsDialog = ({ ticket, open, onOpenChange }: TicketDetailsDialogProps) => {
  const [status, setStatus] = useState<Ticket["status"]>(ticket?.status || "New");
  const [assignedTo, setAssignedTo] = useState<string | undefined>(ticket?.assigned_to);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">(ticket?.priority || "LOW");
  const [isUpdating, setIsUpdating] = useState(false);
  const [ticketHistory, setTicketHistory] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (ticket?.id) {
      fetchTicketHistory();
    }
  }, [ticket?.id]);

  const fetchTicketHistory = async () => {
    if (!ticket?.id) return;

    try {
      const { data, error } = await supabase
        .from('ticket_history')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTicketHistory(data || []);
    } catch (error) {
      console.error('Error fetching ticket history:', error);
    }
  };

  const handleStatusChange = async (newStatus: Ticket["status"]) => {
    if (!ticket) return;
    
    setIsUpdating(true);
    try {
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ 
          status: newStatus,
          last_updated_at: new Date().toISOString()
        })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('ticket_history')
        .insert({
          ticket_id: ticket.id,
          action: 'Status Update',
          previous_status: status,
          new_status: newStatus,
          changed_by: 'Agent'
        });

      if (historyError) throw historyError;

      setStatus(newStatus);
      await fetchTicketHistory();
      
      toast({
        title: "Status updated",
        description: `Ticket status changed to ${newStatus}`,
      });

      if (newStatus === 'Completed') {
        onOpenChange(false);
        navigate('/completed-tickets');
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignmentChange = async (newAssignedTo: string) => {
    if (!ticket) return;
    
    setIsUpdating(true);
    try {
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ 
          assigned_to: newAssignedTo,
          last_updated_at: new Date().toISOString()
        })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('ticket_history')
        .insert({
          ticket_id: ticket.id,
          action: 'Assignment Update',
          previous_assigned_to: assignedTo,
          new_assigned_to: newAssignedTo,
          changed_by: 'Agent'
        });

      if (historyError) throw historyError;

      setAssignedTo(newAssignedTo);
      await fetchTicketHistory();
      
      toast({
        title: "Assignment updated",
        description: `Ticket assigned to ${newAssignedTo}`,
      });
    } catch (error) {
      console.error("Error updating ticket assignment:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket assignment",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: "LOW" | "MEDIUM" | "HIGH") => {
    if (!ticket) return;
    
    setIsUpdating(true);
    try {
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ 
          priority: newPriority,
          last_updated_at: new Date().toISOString()
        })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('ticket_history')
        .insert({
          ticket_id: ticket.id,
          action: 'Priority Update',
          previous_status: priority,
          new_status: newPriority,
          changed_by: 'Agent'
        });

      if (historyError) throw historyError;

      setPriority(newPriority);
      await fetchTicketHistory();
      
      toast({
        title: "Priority updated",
        description: `Ticket priority changed to ${newPriority}`,
      });
    } catch (error) {
      console.error("Error updating ticket priority:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket priority",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGoToMessage = () => {
    if (ticket?.conversation_id) {
      onOpenChange(false);
      navigate(`/chat/${ticket.conversation_id}`);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Ticket #{ticket.id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <TicketHeader ticket={ticket} />
          
          <div className="flex justify-end">
            <TicketStatus 
              status={status} 
              isUpdating={isUpdating} 
              onStatusChange={handleStatusChange} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TicketPrioritySection
              priority={priority}
              isUpdating={isUpdating}
              onPriorityChange={handlePriorityChange}
            />

            <TicketAssignment
              assignedTo={assignedTo}
              isUpdating={isUpdating}
              onAssignmentChange={handleAssignmentChange}
            />
          </div>

          <TicketInfo ticket={ticket} />
          
          <TicketHistory history={ticketHistory} />
          
          <TicketActions 
            conversationId={ticket.conversation_id} 
            onGoToMessage={handleGoToMessage}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};