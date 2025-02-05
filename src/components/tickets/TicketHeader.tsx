import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TicketHeaderProps {
  onBackClick: () => void;
  onAddClick?: () => void;
  showAddButton?: boolean;
}

export const TicketHeader = ({ 
  onBackClick, 
  onAddClick, 
  showAddButton = true 
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
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">
          {showAddButton ? "Support Tickets" : "Completed Tickets"}
        </h1>
      </div>
      <div className="flex gap-2">
        {showAddButton && (
          <>
            <Button 
              variant="outline"
              onClick={() => navigate("/completed-tickets")}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed Tickets
            </Button>
            <Button onClick={onAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              Add Ticket
            </Button>
          </>
        )}
      </div>
    </div>
  );
};