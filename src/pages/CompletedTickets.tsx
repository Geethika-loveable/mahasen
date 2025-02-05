import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketHeader } from "@/components/tickets/TicketHeader";
import { Ticket } from "@/types/ticket";

const CompletedTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Ticket; direction: 'asc' | 'desc' }>({ 
    key: 'id', 
    direction: 'asc' 
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <TicketHeader 
          onBackClick={() => navigate("/dashboard")} 
          showAddButton={false}
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
    </div>
  );
};

export default CompletedTickets;