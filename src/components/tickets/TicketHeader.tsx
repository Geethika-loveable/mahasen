import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

interface TicketHeaderProps {
  onBackClick: () => void;
  onAddClick: () => void;
}

export const TicketHeader = ({ onBackClick, onAddClick }: TicketHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          className="mr-4"
          onClick={onBackClick}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
      </div>
      <Button onClick={onAddClick}>
        <Plus className="h-4 w-4 mr-2" />
        Add Ticket
      </Button>
    </div>
  );
};