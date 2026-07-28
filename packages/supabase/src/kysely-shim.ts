import crypto from "crypto";

export class KyselySupabaseShim {
  private tableName: string;
  private selectBuilder: any;
  private insertValues: any;
  private updateValues: any;
  private isDelete = false;
  private operation: "select" | "insert" | "update" | "delete" = "select";
  private isSingle = false;
  private isMaybeSingle = false;
  private filters: Array<{ type: string; column: string; value: any; operator?: string }> = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitCount: number | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = "*") {
    return this;
  }

  insert(values: any) {
    this.operation = "insert";
    this.insertValues = this.sanitizeValues(values);
    return this;
  }

  update(values: any) {
    this.operation = "update";
    this.updateValues = this.sanitizeValues(values);
    return this;
  }

  delete() {
    this.operation = "delete";
    this.isDelete = true;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ type: "neq", column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: "in", column, value: values });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ type: "is", column, value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ type: "gt", column, value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ type: "gte", column, value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ type: "lt", column, value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ type: "lte", column, value });
    return this;
  }

  not(column: string, operator: string, value: any) {
    this.filters.push({ type: "not", column, value, operator });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderCol = column;
    this.orderAsc = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private sanitizeValues(values: any): any {
    if (Array.isArray(values)) {
      return values.map(v => this.sanitizeItem(v));
    }
    return this.sanitizeItem(values);
  }

  private sanitizeItem(item: any): any {
    const copy = { ...item };
    for (const key of Object.keys(copy)) {
      if (typeof copy[key] === "object" && copy[key] !== null) {
        copy[key] = JSON.stringify(copy[key]);
      }
    }
    return copy;
  }

  async then(
    onfulfilled?: (value: { data: any; error: any; count?: number }) => any,
    onrejected?: (reason: any) => any
  ): Promise<any> {
    try {
      if (typeof window !== "undefined") {
        const payload = { data: null, error: { message: "Database queries cannot run in browser" } };
        if (onfulfilled) return onfulfilled(payload);
        return payload;
      }

      // Lazy import database package to keep browser bundles clean of fs/better-sqlite3 dependencies
      const { db } = await import("@repo/database");

      let data: any;
      if (this.operation === "select") {
        let q = db.selectFrom(this.tableName as any).selectAll();
        for (const f of this.filters) {
          const val = typeof f.value === "object" ? JSON.stringify(f.value) : f.value;
          if (f.type === "eq") q = q.where(f.column as any, "=", val);
          else if (f.type === "neq") q = q.where(f.column as any, "!=", val);
          else if (f.type === "in") q = q.where(f.column as any, "in", f.value);
          else if (f.type === "is") {
            if (f.value === null) q = q.where(f.column as any, "is", null);
            else q = q.where(f.column as any, "=", f.value);
          } else if (f.type === "gt") q = q.where(f.column as any, ">", val);
          else if (f.type === "gte") q = q.where(f.column as any, ">=", val);
          else if (f.type === "lt") q = q.where(f.column as any, "<", val);
          else if (f.type === "lte") q = q.where(f.column as any, "<=", val);
          else if (f.type === "not") {
            if (f.operator === "in") q = q.where(f.column as any, "not in", f.value);
            else q = q.where(f.column as any, "!=", f.value);
          }
        }
        if (this.orderCol) {
          q = q.orderBy(this.orderCol as any, this.orderAsc ? "asc" : "desc");
        }
        if (this.limitCount !== null) {
          q = q.limit(this.limitCount);
        }
        data = await q.execute();
      } else if (this.operation === "insert") {
        data = await db.insertInto(this.tableName as any).values(this.insertValues).returningAll().execute();
      } else if (this.operation === "update") {
        let q = db.updateTable(this.tableName as any).set(this.updateValues).returningAll();
        for (const f of this.filters) {
          if (f.type === "eq") q = q.where(f.column as any, "=", f.value);
        }
        data = await q.execute();
      } else if (this.operation === "delete") {
        let q = db.deleteFrom(this.tableName as any).returningAll();
        for (const f of this.filters) {
          if (f.type === "eq") q = q.where(f.column as any, "=", f.value);
        }
        data = await q.execute();
      }

      if (Array.isArray(data)) {
        data = data.map(item => {
          const parsed = { ...item };
          for (const key of Object.keys(parsed)) {
            const val = parsed[key];
            if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
              try {
                parsed[key] = JSON.parse(val);
              } catch {
                // Keep string
              }
            }
          }
          return parsed;
        });
      }

      let result = data;
      if (this.isSingle) {
        if (!data || data.length === 0) {
          throw new Error("No rows found");
        }
        result = data[0];
      } else if (this.isMaybeSingle) {
        result = data && data.length > 0 ? data[0] : null;
      }

      const payload = { data: result || null, error: null };
      if (onfulfilled) return onfulfilled(payload);
      return payload;
    } catch (error: any) {
      const payload = { data: null, error: { message: error.message } };
      if (onfulfilled) return onfulfilled(payload);
      if (onrejected) return onrejected(error);
      return payload;
    }
  }
}

export const createMockSupabaseClient = (): any => {
  return {
    from: (tableName: string) => new KyselySupabaseShim(tableName),
    rpc: async (fnName: string, args: any) => {
      return { data: null, error: null };
    },
    auth: {
      getUser: async () => {
        return {
          data: {
            user: {
              id: "193539af-996f-4cd3-873b-6dd15f1990be",
              email: "timothyoniel558@gmail.com",
            },
          },
          error: null,
        };
      },
      signInWithPassword: async ({ email }: { email: string }) => {
        return {
          data: {
            user: {
              id: email === "control01@plantcor.os" ? "8a4dd959-f1c9-48b1-9a6e-e64aba70da7c" : "193539af-996f-4cd3-873b-6dd15f1990be",
              email,
            },
          },
          error: null,
        };
      },
      signOut: async () => {
        return { error: null };
      },
      getSession: async () => {
        return { data: { session: {} }, error: null };
      },
      updateUser: async () => {
        return { data: { user: {} }, error: null };
      },
    },
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `/storage/${path}` } }),
        upload: async () => ({ data: {}, error: null }),
        remove: async () => ({ data: {}, error: null }),
      }),
    },
  };
};
