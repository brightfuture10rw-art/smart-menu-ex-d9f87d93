import { supabase } from "@/integrations/supabase/client";

export type MenuRow = {
  id: string;
  course: string;
  name: string;
  description: string;
  price: number;
  image_key: string | null;
  image_url: string | null;
  sort: number;
};

export const COURSES = ["Caviar & Raw Bar", "Entrées", "Plats Principaux", "Desserts", "Cellar"];

const BUNDLED: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("../assets/*.jpg", { eager: true, import: "default" }),
  ).map(([p, url]) => [p.split("/").pop()!.replace(".jpg", ""), url]),
);

export const imageFor = (r: MenuRow) =>
  r.image_url || (r.image_key ? BUNDLED[r.image_key] : undefined) || BUNDLED["c1"];

export const fmtRwf = (n: number) => `RWF ${Math.round(n).toLocaleString("en-US")}`;

export const menuQuery = {
  queryKey: ["menu"],
  queryFn: async (): Promise<MenuRow[]> => {
    const { data, error } = await supabase.from("menu_items").select("*").order("sort");
    if (error) throw error;
    return data as MenuRow[];
  },
};
