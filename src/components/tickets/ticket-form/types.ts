import { z } from "zod";

export const ticketFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  customer_name: z.string().min(1, "Customer name is required"),
  platform: z.enum(["whatsapp", "facebook", "instagram"]),
  type: z.string().min(1, "Type is required"),
  status: z.enum(["New", "In Progress", "Escalated", "Completed"]),
  body: z.string().min(1, "Description is required"),
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>;