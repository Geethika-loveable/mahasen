import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { platformColors } from "../ticket-utils";
import { Ticket } from "@/types/ticket";

interface TicketHeaderProps {
  ticket: Ticket;
}

export const TicketHeader = ({ ticket }: TicketHeaderProps) => {
  return (
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
      <Badge variant="secondary" className={platformColors[ticket.platform]}>
        {ticket.platform}
      </Badge>
    </div>
  );
};