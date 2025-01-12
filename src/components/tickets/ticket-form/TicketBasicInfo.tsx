import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { TicketFormValues } from "./types";

interface TicketBasicInfoProps {
  form: UseFormReturn<TicketFormValues>;
}

export function TicketBasicInfo({ form }: TicketBasicInfoProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter ticket title" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="customer_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Customer Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter customer name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}