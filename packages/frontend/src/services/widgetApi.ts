import { api } from "./api";

/**
 * Exemplar: API service module for a resource.
 *
 * Pattern: one service file per resource, wrapping the shared axios client.
 * Each function maps 1:1 to a backend endpoint. Return types match the
 * shared types from @template/types.
 *
 * Benefits:
 * - Centralizes API URLs (easy to update if endpoints change)
 * - Reusable across components and XState machine actors
 * - Testable in isolation (mock the api client)
 *
 * NOTE: This uses the axios-based `api` client. If you prefer fetch,
 * use the same pattern but with fetch() directly — the key insight is
 * one service file per resource, not the HTTP library choice.
 */

export interface Widget {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export async function listWidgets(): Promise<Widget[]> {
  const res = await api.get<{ data: Widget[] }>("/widgets");
  return res.data.data;
}

export async function createWidget(
  body: Pick<Widget, "name"> & { description?: string },
): Promise<Widget> {
  const res = await api.post<{ data: Widget }>("/widgets", body);
  return res.data.data;
}

export async function getWidget(id: string): Promise<Widget> {
  const res = await api.get<{ data: Widget }>(`/widgets/${id}`);
  return res.data.data;
}

export async function updateWidget(
  id: string,
  body: Pick<Widget, "name"> & { description?: string },
): Promise<Widget> {
  const res = await api.put<{ data: Widget }>(`/widgets/${id}`, body);
  return res.data.data;
}

export async function deleteWidget(id: string): Promise<void> {
  await api.delete(`/widgets/${id}`);
}
