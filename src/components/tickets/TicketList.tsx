import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpNarrowWide, ArrowDownNarrowWide } from "lucide-react";
import { format } from "date-fns";

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

interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
  sortConfig: {
    key: keyof Ticket;
    direction: 'asc' | 'desc';
  };
  onSortChange: (config: { key: keyof Ticket; direction: 'asc' | 'desc' }) => void;
}

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

export const TicketList = ({ tickets, loading, sortConfig, onSortChange }: TicketListProps) => {
  const handleSort = (key: keyof Ticket) => {
    onSortChange({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getSortIcon = (columnKey: keyof Ticket) => {
    if (sortConfig.key !== columnKey) return null;
    
    return sortConfig.direction === 'asc' ? (
      <ArrowUpNarrowWide className="inline h-3 w-3 text-gray-500 ml-1" />
    ) : (
      <ArrowDownNarrowWide className="inline h-3 w-3 text-gray-500 ml-1" />
    );
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    const modifier = sortConfig.direction === 'asc' ? 1 : -1;
    if (a[sortConfig.key] < b[sortConfig.key]) return -1 * modifier;
    if (a[sortConfig.key] > b[sortConfig.key]) return 1 * modifier;
    return 0;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20 cursor-pointer" onClick={() => handleSort('id')}>
            ID {getSortIcon('id')}
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
  );
};