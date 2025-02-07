
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Ticket } from "@/types/ticket";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TicketHeader } from "./ticket-details/TicketHeader";
import { TicketStatus } from "./ticket-details/TicketStatus";
import { TicketContent } from "./ticket-details/TicketContent";
import { TicketHistory } from "./ticket-details/TicketHistory";
import { TicketActions } from "./ticket-details/TicketActions";
import { TicketMetadata } from "./ticket-details/TicketMetadata";
import { useTicketUpdates } from "./ticket-details/useTicketUpdates";
import { useTicketHistory } from "./ticket-details/useTicketHistory";

interface TicketDetailsDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TicketDetailsDialog = ({ ticket, open, onOpenChange }: TicketDetailsDialogProps) => {
  const navigate = useNavigate();
  const { ticketHistory } = useTicketHistory(ticket?.id ?? null);
  const { isUpdating, handleStatusChange, handleAssignmentChange, handlePriorityChange } = 
    useTicketUpdates(ticket, () => onOpenChange(false));

  const handleGoToMessage = () => {
    if (ticket?.conversation_id) {
      onOpenChange(false);
      navigate(`/chat/${ticket.conversation_id}`);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Ticket #{ticket.id}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 pb-6">
            <TicketHeader ticket={ticket} />
            
            <TicketStatus 
              status={ticket.status} 
              isUpdating={isUpdating} 
              onStatusChange={handleStatusChange} 
            />

            <TicketContent ticket={ticket} />
            
            <TicketHistory history={ticketHistory} />
            
            <TicketActions 
              conversationId={ticket.conversation_id} 
              onGoToMessage={handleGoToMessage}
            />

            <hr className="border-gray-200 dark:border-gray-700" />

            <TicketMetadata
              ticket={ticket}
              isUpdating={isUpdating}
              onPriorityChange={handlePriorityChange}
              onAssignmentChange={handleAssignmentChange}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
