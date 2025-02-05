import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface TicketActionsProps {
  conversationId?: string;
  onGoToMessage: () => void;
}

export const TicketActions = ({ conversationId, onGoToMessage }: TicketActionsProps) => {
  if (!conversationId) return null;

  return (
    <div className="pt-4">
      <Button
        onClick={onGoToMessage}
        className="w-full"
        variant="outline"
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Go to Message
      </Button>
    </div>
  );
};