
import { Ticket } from "@/types/ticket";
import { TicketPrioritySection } from "./TicketPriority";
import { TicketAssignment } from "./TicketAssignment";

interface TicketMetadataProps {
  ticket: Ticket;
  isUpdating: boolean;
  onPriorityChange: (priority: "LOW" | "MEDIUM" | "HIGH") => void;
  onAssignmentChange: (assignedTo: string) => void;
}

export const TicketMetadata = ({ 
  ticket,
  isUpdating,
  onPriorityChange,
  onAssignmentChange
}: TicketMetadataProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
        <div className="space-y-2 text-gray-700 dark:text-gray-400">
          <h4 className="font-medium">Confidence Score</h4>
          <p>{(ticket.confidence_score * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
};
