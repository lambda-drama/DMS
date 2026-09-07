type TechnicianOption = { name: string; full_name?: string | null };

export function technicianNameFromList(
  id: string | undefined,
  technicians?: TechnicianOption[] | null
): string | undefined {
  if (!id) return undefined;
  return technicians?.find((t) => t.name === id)?.full_name || undefined;
}

/** Prefer full name over the Technician document id. */
export function technicianDisplayName(
  technician?: string | null,
  technicianName?: string | null,
  technicians?: TechnicianOption[] | null
): string {
  const named = (technicianName || "").trim();
  if (named) return named;
  const fromList = technicianNameFromList(technician || undefined, technicians);
  if (fromList) return fromList;
  return (technician || "").trim();
}
