import { format } from "date-fns";

interface TicketHistory {
  id: number;
  action: string;
  previous_status?: string;
  new_status?: string;
  previous_assigned_to?: string;
  new_assigned_to?: string;
  changed_by?: string;
  created_at: string;
}

interface TicketHistoryProps {
  history: TicketHistory[];
}

export const TicketHistory = ({ history }: TicketHistoryProps) => {
  if (!history.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="font-medium">History</h4>
      <div className="space-y-2">
        {history.map((item) => (
          <div key={item.id} className="text-sm">
            <p className="text-muted-foreground">
              {format(new Date(item.created_at), "MMM d, yyyy HH:mm")} - {item.action}
              {item.changed_by && ` by ${item.changed_by}`}
            </p>
            {item.previous_status && item.new_status && (
              <p>Status changed from {item.previous_status} to {item.new_status}</p>
            )}
            {item.previous_assigned_to && item.new_assigned_to && (
              <p>Assignment changed from {item.previous_assigned_to || 'Unassigned'} to {item.new_assigned_to}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};