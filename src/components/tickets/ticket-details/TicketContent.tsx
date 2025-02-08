
import { Ticket } from "@/types/ticket";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface TicketContentProps {
  ticket: Ticket;
}

export const TicketContent = ({ ticket }: TicketContentProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Function to get first two lines of text
  const getFirstTwoLines = (text: string) => {
    const lines = text.split('\n');
    return lines.slice(0, 2).join('\n');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <h4 className="font-medium">Customer</h4>
          <p>{ticket.customer_name}</p>
        </div>

        <div className="flex-1 min-w-[200px]">
          <h4 className="font-medium">Type</h4>
          <p>{ticket.type}</p>
        </div>

        {ticket.intent_type && (
          <div className="flex-1 min-w-[200px]">
            <h4 className="font-medium">Intent Type</h4>
            <p>{ticket.intent_type}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Description</h4>
        <div className="border-2 border-green-500 rounded-lg p-4">
          <p className="whitespace-pre-wrap">{ticket.body}</p>
        </div>
      </div>

      {ticket.escalation_reason && (
        <div className="space-y-2">
          <h4 className="font-medium">Escalation Reason</h4>
          <p>{ticket.escalation_reason}</p>
        </div>
      )}

      {ticket.confidence_score !== undefined && (
        <div className="space-y-2">
          <h4 className="font-medium">Confidence Score</h4>
          <p>{(ticket.confidence_score * 100).toFixed(1)}%</p>
        </div>
      )}

      {ticket.context && (
        <div className="space-y-2">
          <h4 className="font-medium">Conversation Context</h4>
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full space-y-2"
          >
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border bg-white px-4 py-2 font-medium hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800">
                <span className="text-sm">
                  {isOpen ? "Show Less" : "Show More"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
            </div>
            <div className="rounded-md border px-4 py-3 font-mono text-sm">
              <p className="whitespace-pre-wrap">
                {isOpen ? ticket.context : getFirstTwoLines(ticket.context)}
              </p>
            </div>
            <CollapsibleContent className="space-y-2">
              <div className="rounded-md bg-slate-50 px-4 py-3 font-mono text-sm dark:bg-slate-900">
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
};
