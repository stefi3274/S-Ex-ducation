// Les erreurs de Supabase (PostgrestError, StorageError...) ne sont
// pas des instances de la classe Error native, donc `err instanceof
// Error` échoue et fait perdre le vrai message. Cette fonction
// récupère le message quel que soit le type d'erreur.
export function messageErreur(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "";
}
