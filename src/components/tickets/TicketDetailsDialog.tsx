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
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";

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

export const TicketDetailsDialog = ({ ticket, open, onOpenChange }: TicketDetailsDialogProps) => {
  const [status, setStatus] = useState<Ticket["status"]>(ticket?.status || "New");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStatusChange = async (newStatus: Ticket["status"]) => {
    if (!ticket) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticket.id);

      if (error) throw error;

      setStatus(newStatus);
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

  const handleGoToMessage = () => {
    if (ticket?.conversation_id) {
      onOpenChange(false); // Close the dialog
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