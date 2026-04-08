import { api } from "./api";

export type Me = {
  username: string;
  is_superuser: boolean;
  role: "admin" | "editor" | "viewer";
};

export async function fetchMe(): Promise<Me> {
  const r = await api.get("/api/me/");
  return r.data;
}

export function canWrite(me: Me | null) {
  if (!me) return false;
  return me.is_superuser || me.role === "admin" || me.role === "editor";
}

