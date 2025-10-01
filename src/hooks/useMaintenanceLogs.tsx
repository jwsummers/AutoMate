import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/** Local, minimal row shapes until you regenerate Supabase types */
type UUID = string;

export type MaintenanceStatus = 'completed' | 'upcoming' | 'overdue';

export interface MaintenanceLogRow {
  id: UUID;
  user_id: UUID;
  vehicle_id: UUID;
  date: string; // 'YYYY-MM-DD'
  mileage: number | null;
  vendor_name: string | null;
  location: string | null;
  invoice_number: string | null;
  labor_cost: number | null;
  parts_cost: number | null;
  taxes: number | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceItemRow {
  id: UUID;
  log_id: UUID;
  type: string;
  description: string | null;
  status: MaintenanceStatus;
  cost: number | null;
  created_at?: string;
  updated_at?: string;
}

/** App-facing shapes */
export type MaintenanceLog = MaintenanceLogRow;
export type MaintenanceItem = MaintenanceItemRow;

export interface MaintenanceLogWithItems extends MaintenanceLog {
  items: MaintenanceItem[];
  totals: {
    items_count: number;
    items_cost: number;
    grand_total: number; // items_cost + labor_cost + parts_cost + taxes
  };
}

export type NewItemInput = {
  type: string;
  description?: string | null;
  status?: MaintenanceStatus;
  cost?: number | null;
};

export type NewLogInput = Omit<
  MaintenanceLog,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;

const LOGS_LIMIT = 200;

/** Use an untyped client in THIS file only, to avoid TS errors until you regenerate DB types */
const untyped = supabase as unknown as SupabaseClient<Record<string, unknown>>;

function computeTotals(log: MaintenanceLog, items: MaintenanceItem[]) {
  const items_cost = items.reduce((s, it) => s + (it.cost ?? 0), 0);
  const grand_total =
    items_cost +
    (log.labor_cost ?? 0) +
    (log.parts_cost ?? 0) +
    (log.taxes ?? 0);
  return { items_count: items.length, items_cost, grand_total };
}

export function useMaintenanceLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLogWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async (vehicleId?: string) => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        // 1) fetch logs
        let q = untyped
          .from('maintenance_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(LOGS_LIMIT);

        if (vehicleId) q = q.eq('vehicle_id', vehicleId);

        const { data: logRows, error: logErr } = await q;
        if (logErr) throw logErr;

        const logsTyped: MaintenanceLog[] = (logRows ?? []) as MaintenanceLog[];

        const logIds = logsTyped.map((l) => l.id);
        if (logIds.length === 0) {
          setLogs([]);
          return;
        }

        // 2) fetch items for these logs
        const { data: itemRows, error: itemErr } = await untyped
          .from('maintenance_items')
          .select('*')
          .in('log_id', logIds);

        if (itemErr) throw itemErr;

        const itemsTyped: MaintenanceItem[] = (itemRows ??
          []) as MaintenanceItem[];

        // 3) assemble
        const byLog = new Map<UUID, MaintenanceItem[]>();
        for (const id of logIds) byLog.set(id, []);
        for (const it of itemsTyped) {
          const arr = byLog.get(it.log_id);
          if (arr) arr.push(it);
        }

        const assembled: MaintenanceLogWithItems[] = logsTyped.map((l) => {
          const items = byLog.get(l.id) ?? [];
          return {
            ...l,
            items,
            totals: computeTotals(l, items),
          };
        });

        setLogs(assembled);
      } catch (e) {
        console.error('fetchLogs error', e);
        setError('Failed to load maintenance logs');
        toast.error('Failed to load maintenance logs');
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const addLogWithItems = useCallback(
    async (logInput: NewLogInput, items: NewItemInput[]) => {
      if (!user) return null;
      try {
        setLoading(true);

        // 1) insert parent log
        const { data: logData, error: logErr } = await untyped
          .from('maintenance_logs')
          .insert([{ ...logInput, user_id: user.id }])
          .select('*')
          .single();

        if (logErr || !logData) throw logErr;
        const log = logData as MaintenanceLog;

        // 2) insert child items (can be empty)
        let insertedItems: MaintenanceItem[] = [];
        if (items.length > 0) {
          const rows = items.map((it) => ({
            log_id: log.id,
            type: it.type,
            description: it.description ?? null,
            status: it.status ?? 'completed',
            cost: it.cost ?? null,
          }));

          const { data: itemData, error: itemErr } = await untyped
            .from('maintenance_items')
            .insert(rows)
            .select('*');

          if (itemErr) throw itemErr;
          insertedItems = (itemData ?? []) as MaintenanceItem[];
        }

        const assembled: MaintenanceLogWithItems = {
          ...log,
          items: insertedItems,
          totals: computeTotals(log, insertedItems),
        };

        setLogs((prev) => [assembled, ...prev]);
        toast.success(
          `Added log${
            items.length
              ? ` with ${items.length} item${items.length === 1 ? '' : 's'}`
              : ''
          }`
        );
        return assembled;
      } catch (e) {
        console.error('addLogWithItems error', e);
        toast.error('Failed to add maintenance log');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateLog = useCallback(
    async (logId: string, patch: Partial<NewLogInput>) => {
      if (!user) return false;
      try {
        const { data, error } = await untyped
          .from('maintenance_logs')
          .update(patch)
          .eq('id', logId)
          .eq('user_id', user.id)
          .select('*')
          .single();
        if (error) throw error;
        const updated = data as MaintenanceLog;

        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? {
                  ...updated,
                  items: l.items,
                  totals: computeTotals(updated, l.items),
                }
              : l
          )
        );
        toast.success('Log updated');
        return true;
      } catch (e) {
        console.error('updateLog error', e);
        toast.error('Failed to update log');
        return false;
      }
    },
    [user]
  );

  const addItem = useCallback(
    async (logId: string, item: NewItemInput) => {
      if (!user) return null;
      try {
        const { data, error } = await untyped
          .from('maintenance_items')
          .insert([
            {
              log_id: logId,
              type: item.type,
              description: item.description ?? null,
              status: item.status ?? 'completed',
              cost: item.cost ?? null,
            },
          ])
          .select('*')
          .single();
        if (error) throw error;
        const created = data as MaintenanceItem;

        setLogs((prev) =>
          prev.map((l) => {
            if (l.id !== logId) return l;
            const items = [...l.items, created];
            return { ...l, items, totals: computeTotals(l, items) };
          })
        );
        toast.success('Item added');
        return created;
      } catch (e) {
        console.error('addItem error', e);
        toast.error('Failed to add item');
        return null;
      }
    },
    [user]
  );

  const updateItem = useCallback(
    async (itemId: string, patch: Partial<MaintenanceItem>) => {
      if (!user) return false;
      try {
        const { data, error } = await untyped
          .from('maintenance_items')
          .update(patch)
          .eq('id', itemId)
          .select('*')
          .single();
        if (error) throw error;
        const updated = data as MaintenanceItem;

        setLogs((prev) =>
          prev.map((l) => {
            const items = l.items.map((it) =>
              it.id === itemId ? updated : it
            );
            return { ...l, items, totals: computeTotals(l, items) };
          })
        );
        toast.success('Item updated');
        return true;
      } catch (e) {
        console.error('updateItem error', e);
        toast.error('Failed to update item');
        return false;
      }
    },
    [user]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      if (!user) return false;
      try {
        const { error } = await untyped
          .from('maintenance_items')
          .delete()
          .eq('id', itemId);
        if (error) throw error;

        setLogs((prev) =>
          prev.map((l) => {
            const items = l.items.filter((it) => it.id !== itemId);
            return { ...l, items, totals: computeTotals(l, items) };
          })
        );
        toast.success('Item deleted');
        return true;
      } catch (e) {
        console.error('deleteItem error', e);
        toast.error('Failed to delete item');
        return false;
      }
    },
    [user]
  );

  const deleteLog = useCallback(
    async (logId: string) => {
      if (!user) return false;
      try {
        const { error } = await untyped
          .from('maintenance_logs')
          .delete()
          .eq('id', logId)
          .eq('user_id', user.id);
        if (error) throw error;

        setLogs((prev) => prev.filter((l) => l.id !== logId));
        toast.success('Log deleted');
        return true;
      } catch (e) {
        console.error('deleteLog error', e);
        toast.error('Failed to delete log');
        return false;
      }
    },
    [user]
  );

  useEffect(() => {
    if (user) {
      fetchLogs();
    } else {
      setLogs([]);
      setLoading(false);
    }
  }, [user, fetchLogs]);

  const flatItems = useMemo(
    () => logs.flatMap((l) => l.items.map((it) => ({ log: l, item: it }))),
    [logs]
  );

  return {
    logs,
    flatItems,
    loading,
    error,
    fetchLogs,
    addLogWithItems,
    updateLog,
    addItem,
    updateItem,
    deleteItem,
    deleteLog,
  };
}
