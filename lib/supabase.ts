import { createClient } from "@supabase/supabase-js";

// Créé à l'appel plutôt qu'à l'import, pour éviter un crash au
// build si les variables d'environnement ne sont pas encore
// disponibles à cette étape.
export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  return createClient(supabaseUrl, supabaseAnonKey);
}
