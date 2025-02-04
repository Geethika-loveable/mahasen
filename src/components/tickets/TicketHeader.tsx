import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TicketHeaderProps {
  onBackClick: () => void;
  onAddClick?: () => void;
  showAddButton?: boolean;
  title?: string;
}

export const TicketHeader = ({ 
  onBackClick, 
  onAddClick, 
  showAddButton = true,
  title = "Support Tickets" 
}: TicketHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          className="mr-4"
          onClick={onBackClick}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {title === "Support Tickets" ? "Dashboard" : "Tickets"}
        </Button>
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {title === "Support Tickets" && (
          <Button 
            variant="outline"
            onClick={() => navigate("/completed-tickets")}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Completed Tickets
          </Button>
        )}
        {showAddButton && onAddClick && (
          <Button onClick={onAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Ticket
          </Button>
        )}
      </div>
    </div>
  );
};