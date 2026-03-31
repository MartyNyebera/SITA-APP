import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function query<T = any>(
  table: string,
  options: {
    select?: string;
    filter?: Record<string, any>;
    insert?: Record<string, any>;
    update?: Record<string, any>;
    delete?: boolean;
    single?: boolean;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ rows: T[]; rowCount: number; row?: T }> {
  let query = supabase.from(table);

  if (options.select) {
    query = query.select(options.select);
  } else {
    query = query.select("*");
  }

  if (options.filter) {
    Object.entries(options.filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }

  if (options.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  let result;
  if (options.insert) {
    result = await query.insert(options.insert);
  } else if (options.update) {
    if (options.filter && Object.keys(options.filter).length > 0) {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }
    result = await query.update(options.update);
  } else if (options.delete) {
    result = await query.delete();
  } else {
    result = await query;
  }

  if (result.error) {
    throw new Error(`Database query failed: ${result.error.message}`);
  }

  const data = result.data as T[];
  return {
    rows: data,
    rowCount: data.length,
    row: options.single ? data[0] : undefined,
  };
}

export async function rawQuery(sql: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql, params });
  
  if (error) {
    throw new Error(`Raw query failed: ${error.message}`);
  }
  
  return {
    rows: data || [],
    rowCount: data?.length || 0,
  };
}
