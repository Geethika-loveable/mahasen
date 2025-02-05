import { Ticket } from "@/types/ticket";

interface TicketInfoProps {
  ticket: Ticket;
}

export const TicketInfo = ({ ticket }: TicketInfoProps) => {
  return (
    <div className="space-y-4">
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
        <div className="border-2 border-green-500 rounded-lg p-4">
          <p className="whitespace-pre-wrap">{ticket.body}</p>
        </div>
      </div>

      {ticket.context && (
        <div className="space-y-2">
          <h4 className="font-medium">Conversation Context</h4>
          <p className="whitespace-pre-wrap">{ticket.context}</p>
        </div>
      )}
    </div>
  );
};