import { useState } from "react";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketHeader } from "@/components/tickets/TicketHeader";
import { WebhookErrors } from "@/components/tickets/WebhookErrors";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "@/types/ticket";

const Tickets = () => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Ticket;
    direction: 'asc' | 'desc';
  }>({
    key: 'created_at',
    direction: 'desc'
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order(sortConfig.key, { ascending: sortConfig.direction === 'asc' });

      if (error) throw error;
      return data as Ticket[];
    }
  });

  return (
    <div className="container mx-auto py-8">
      <WebhookErrors />
      <TicketHeader />
      <div className="mt-8">
        <TicketList
          tickets={tickets || []}
          loading={isLoading}
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
        />
      </div>
    </div>
  );
};

export default Tickets;