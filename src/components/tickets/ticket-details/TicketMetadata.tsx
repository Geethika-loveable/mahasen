
import { Ticket } from "@/types/ticket";
import { TicketPrioritySection } from "./TicketPriority";
import { TicketAssignment } from "./TicketAssignment";
import { TicketStatus } from "./TicketStatus";

interface TicketMetadataProps {
  ticket: Ticket;
  isUpdating: boolean;
  onPriorityChange: (priority: "LOW" | "MEDIUM" | "HIGH") => void;
  onAssignmentChange: (assignedTo: string) => void;
  onStatusChange: (status: Ticket["status"]) => void;
}

export const TicketMetadata = ({ 
  ticket,
  isUpdating,
  onPriorityChange,
  onAssignmentChange,
  onStatusChange
}: TicketMetadataProps) => {
  return (
    <div className="space-y-4 text-gray-500 dark:text-gray-400">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <TicketStatus 
          status={ticket.status} 
          isUpdating={isUpdating} 
          onStatusChange={onStatusChange}
        />

        <TicketPrioritySection
          priority={ticket.priority}
          isUpdating={isUpdating}
          onPriorityChange={onPriorityChange}
        />

        <TicketAssignment
          assignedTo={ticket.assigned_to}
          isUpdating={isUpdating}
          onAssignmentChange={onAssignmentChange}
        />
      </div>

      {ticket.confidence_score !== undefined && (
        <div className="space-y-2">
          <h4 className="font-medium">Confidence Score</h4>
          <p>{(ticket.confidence_score * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
};
