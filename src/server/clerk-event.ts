export type ClerkUserEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  timestamp: number;
  data: {
    id: string;
    primary_email_address_id?: string | null;
    email_addresses?: { id: string; email_address: string }[];
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    created_at?: number;
    updated_at?: number;
  };
};

export function isClerkUserEvent(value: unknown): value is ClerkUserEvent {
  if (!value || typeof value !== "object") return false;
  const e = value as Partial<ClerkUserEvent>;
  return (
    ["user.created", "user.updated", "user.deleted"].includes(e.type ?? "") &&
    typeof e.timestamp === "number" &&
    Number.isFinite(e.timestamp) &&
    !!e.data &&
    typeof e.data.id === "string" &&
    e.data.id.startsWith("user_")
  );
}

export function userRecord(event: ClerkUserEvent) {
  const data = event.data;
  const primary = data.email_addresses?.find(
    (e) => e.id === data.primary_email_address_id,
  );
  return {
    id: data.id,
    email:
      primary?.email_address ??
      data.email_addresses?.[0]?.email_address ??
      null,
    name: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
    imageUrl: data.image_url ?? null,
    createdAt: new Date(data.created_at ?? event.timestamp),
    clerkUpdatedAt:
      event.type === "user.deleted"
        ? event.timestamp
        : (data.updated_at ?? event.timestamp),
    deletedAt: event.type === "user.deleted" ? new Date(event.timestamp) : null,
  };
}
