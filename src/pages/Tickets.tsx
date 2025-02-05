import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AddTicketDialog } from "@/components/tickets/AddTicketDialog";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketHeader } from "@/components/tickets/TicketHeader";
import { Ticket, TicketType, TicketPriority } from "@/types/ticket";

const Tickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Ticket; direction: 'asc' | 'desc' }>({ 
    key: 'id', 
    direction: 'asc' 
  });

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select("*")
          .neq('status', 'Completed') // Filter out completed tickets
          .order('id', { ascending: true });

        if (error) throw error;
        
        // Transform the data to ensure all fields match their expected types
        const transformedData = (data || []).map(ticket => ({
          ...ticket,
          intent_type: ticket.intent_type as TicketType,
          priority: (ticket.priority || 'LOW') as TicketPriority,
          assigned_to: ticket.assigned_to || undefined,
          confidence_score: ticket.confidence_score || undefined,
          context: ticket.context || undefined,
          conversation_id: ticket.conversation_id || undefined,
          escalation_reason: ticket.escalation_reason || undefined,
          message_id: ticket.message_id || undefined,
          last_updated_at: ticket.last_updated_at || undefined
        }));

        setTickets(transformedData);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();

    // Subscribe to changes in the tickets table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: 'status=neq.Completed'
        },
        () => {
          // Refetch tickets when there are changes
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <TicketHeader 
          onBackClick={() => navigate("/dashboard")} 
          onAddClick={() => setDialogOpen(true)}
        />

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow">
          <TicketList 
            tickets={tickets}
            loading={loading}
            sortConfig={sortConfig}
            onSortChange={(config) => setSortConfig(config)}
          />
        </div>
      </div>
      <AddTicketDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onTicketAdded={(newTicket) => setTickets((prev) => [newTicket, ...prev])}
      />
    </div>
  );
};

export default Tickets;