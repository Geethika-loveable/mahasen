import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, ArrowUpNarrowWide, ArrowDownNarrowWide } from "lucide-react";
import { format } from "date-fns";
import { AddTicketDialog } from "@/components/tickets/AddTicketDialog";

interface Ticket {
  id: number;
  title: string;
  customer_name: string;
  platform: "whatsapp" | "facebook" | "instagram";
  type: string;
  status: "New" | "In Progress" | "Escalated" | "Completed";
  created_at: string;
  body: string;
}

type SortConfig = {
  key: keyof Ticket;
  direction: 'asc' | 'desc';
} | null;

const statusColors = {
  New: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Escalated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const platformColors = {
  whatsapp: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  facebook: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  instagram: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

const Tickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select("*")
          .order('id', { ascending: true });

        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleSort = (key: keyof Ticket) => {
    setSortConfig(currentConfig => {
      if (currentConfig?.key === key) {
        return {
          key,
          direction: currentConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'desc' };
    });
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    const modifier = direction === 'asc' ? 1 : -1;

    if (a[key] < b[key]) return -1 * modifier;
    if (a[key] > b[key]) return 1 * modifier;
    return 0;
  });

  const getSortIcon = (columnKey: keyof Ticket) => {
    if (sortConfig?.key !== columnKey) return null;
    
    return sortConfig.direction === 'asc' ? (
      <ArrowUpNarrowWide className="inline h-3 w-3 text-gray-500 ml-1" />
    ) : (
      <ArrowDownNarrowWide className="inline h-3 w-3 text-gray-500 ml-1" />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="mr-4"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Support Tickets</h1>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Ticket
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 cursor-pointer" onClick={() => handleSort('id')}>
                  Ticket ID {getSortIcon('id')}
                </TableHead>
                <TableHead className="w-48 cursor-pointer" onClick={() => handleSort('title')}>
                  Title {getSortIcon('title')}
                </TableHead>
                <TableHead className="w-40 cursor-pointer" onClick={() => handleSort('customer_name')}>
                  Customer Name {getSortIcon('customer_name')}
                </TableHead>
                <TableHead className="w-32 cursor-pointer" onClick={() => handleSort('platform')}>
                  Platform {getSortIcon('platform')}
                </TableHead>
                <TableHead className="w-32 cursor-pointer" onClick={() => handleSort('type')}>
                  Type {getSortIcon('type')}
                </TableHead>
                <TableHead className="w-32 cursor-pointer" onClick={() => handleSort('status')}>
                  Status {getSortIcon('status')}
                </TableHead>
                <TableHead className="w-40 cursor-pointer" onClick={() => handleSort('created_at')}>
                  Date & Time {getSortIcon('created_at')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading tickets...
                  </TableCell>
                </TableRow>
              ) : sortedTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                sortedTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableCell>#{ticket.id}</TableCell>
                    <TableCell className="font-medium">{ticket.title}</TableCell>
                    <TableCell>{ticket.customer_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={platformColors[ticket.platform]}>
                        {ticket.platform}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.type}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[ticket.status]}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(ticket.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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