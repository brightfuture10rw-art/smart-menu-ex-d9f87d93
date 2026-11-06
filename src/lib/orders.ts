import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type OrderItem = {
  name: string;
  qty: number;
  unit: number;
  addons: { name: string; price: number }[];
  line: number;
};

export type OrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  table_number: string;
  items: OrderItem[];
  subtotal: number;
  service: number;
  total: number;
  status: "pending" | "finished";
  created_at: string;
};

export const ordersQuery = {
  queryKey: ["orders"],
  queryFn: async (): Promise<OrderRow[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as OrderRow[];
  },
};

export async function placeOrder(o: {
  customer_name: string;
  phone: string;
  table_number: string;
  items: OrderItem[];
  subtotal: number;
  service: number;
  total: number;
}) {
  const { error } = await supabase
    .from("orders")
    .insert({ ...o, items: o.items as unknown as Json });
  if (error) throw error;
}

export async function finishOrder(id: string) {
  const { error } = await supabase.from("orders").update({ status: "finished" }).eq("id", id);
  if (error) throw error;
}
