import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Clock } from "lucide-react";

interface Ticket {
  id: number;
  title: string;
  customer_name: string;
  platform: "whatsapp" | "facebook" | "instagram";
  type: string;
  status: "New" | "In Progress" | "Escalated" | "Completed";
  created_at: string;
  body: string;
  message_id?: string;
  conversation_id?: string;
  intent_type?: string;
  context?: string;
  confidence_score?: number;
  escalation_reason?: string;
  assigned_to?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  last_updated_at?: string;
}

interface TicketHistory {
  id: number;
  action: string;
  previous_status?: string;
  new_status?: string;
  previous_assigned_to?: string;
  new_assigned_to?: string;
  changed_by?: string;
  created_at: string;
}

interface TicketDetailsDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = {
  New: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Escalated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const platformColors = {
  whatsapp: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  facebook: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  instagram: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export const TicketDetailsDialog = ({ ticket, open, onOpenChange }: TicketDetailsDialogProps) => {
  const [status, setStatus] = useState<Ticket["status"]>(ticket?.status || "New");
  const [assignedTo, setAssignedTo] = useState<string | undefined>(ticket?.assigned_to);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">(ticket?.priority || "LOW");
  const [isUpdating, setIsUpdating] = useState(false);
  const [ticketHistory, setTicketHistory] = useState<TicketHistory[]>([]);
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
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium">{ticket.title}</h3>
              <p className="text-sm text-muted-foreground">
                Created on {format(new Date(ticket.created_at), "MMM d, yyyy HH:mm")}
              </p>
              {ticket.last_updated_at && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last updated: {format(new Date(ticket.last_updated_at), "MMM d, yyyy HH:mm")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className={platformColors[ticket.platform]}>
                {ticket.platform}
              </Badge>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={statusColors[status]}>
                  {status}
                </Badge>
                <Select value={status} onValueChange={handleStatusChange} disabled={isUpdating}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Escalated">Escalated</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Priority</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={priorityColors[priority]}>
                  {priority}
                </Badge>
                <Select value={priority} onValueChange={handlePriorityChange} disabled={isUpdating}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Set priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Assigned To</h4>
              <Select 
                value={assignedTo || ""} 
                onValueChange={handleAssignmentChange} 
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Assign ticket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  <SelectItem value="agent1">Agent 1</SelectItem>
                  <SelectItem value="agent2">Agent 2</SelectItem>
                  <SelectItem value="agent3">Agent 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Customer</h4>
            <p>{ticket.customer_name}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Type</h4>
            <p>{ticket.type}</p>
          </div>

          {ticket.intent_type && (
            <div className="space-y-2">
              <h4 className="font-medium">Intent Type</h4>
              <p>{ticket.intent_type}</p>
            </div>
          )}

          {ticket.confidence_score !== undefined && (
            <div className="space-y-2">
              <h4 className="font-medium">Confidence Score</h4>
              <p>{(ticket.confidence_score * 100).toFixed(1)}%</p>
            </div>
          )}

          {ticket.escalation_reason && (
            <div className="space-y-2">
              <h4 className="font-medium">Escalation Reason</h4>
              <p>{ticket.escalation_reason}</p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <p className="whitespace-pre-wrap">{ticket.body}</p>
          </div>

          {ticket.context && (
            <div className="space-y-2">
              <h4 className="font-medium">Conversation Context</h4>
              <p className="whitespace-pre-wrap">{ticket.context}</p>
            </div>
          )}

          {ticketHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">History</h4>
              <div className="space-y-2">
                {ticketHistory.map((history) => (
                  <div key={history.id} className="text-sm">
                    <p className="text-muted-foreground">
                      {format(new Date(history.created_at), "MMM d, yyyy HH:mm")} - {history.action}
                      {history.changed_by && ` by ${history.changed_by}`}
                    </p>
                    {history.previous_status && history.new_status && (
                      <p>Status changed from {history.previous_status} to {history.new_status}</p>
                    )}
                    {history.previous_assigned_to && history.new_assigned_to && (
                      <p>Assignment changed from {history.previous_assigned_to || 'Unassigned'} to {history.new_assigned_to}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ticket.conversation_id && (
            <div className="pt-4">
              <Button
                onClick={handleGoToMessage}
                className="w-full"
                variant="outline"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Go to Message
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};