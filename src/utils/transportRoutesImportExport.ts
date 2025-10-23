import * as XLSX from "xlsx";
import Papa from "papaparse";
import { supabase } from "@/lib/supabaseClient";
// Reduce TypeScript type complexity when interacting with Supabase responses.
type SimpleResponse = { data: any[] | null; error: any };

export type ImportOptions = {
  validate?: boolean;
  continueOnError?: boolean;
  importMode?: "add" | "replace" | "update";
  upsertBy?: "id" | "route_code" | "name";
};

export type ExportOptions = {
  format: "xlsx" | "csv" | "json";
  filename?: string;
  selectedFields?: string[];
  filters?: {
    status?: string;
    country?: string;
  };
};

export async function importTransportRoutes(file: File, options: ImportOptions) {
  const { validate = true, continueOnError = false, importMode = "add", upsertBy = "route_code" } = options || {};

  let routes: any[] = [];
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "xlsx" || ext === "xls") {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    routes = XLSX.utils.sheet_to_json(sheet);
  } else if (ext === "csv") {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    routes = parsed.data as any[];
  } else if (ext === "json") {
    routes = JSON.parse(await file.text());
  } else {
    throw new Error("Unsupported file format");
  }

  const validRows: any[] = [];
  const invalidRows: { route: any; errors: string[] }[] = [];

  for (const raw of routes) {
    // Normalize common aliases from different export templates
    const route = normalizeImportRow(raw);

    const required = ["name", "country", "start_location", "end_location"];
    const missing = required.filter((r) => !route[r]);

    if (validate && missing.length) {
      invalidRows.push({ route: raw, errors: missing });
      if (!continueOnError) continue;
    }

    const cleanData = {
      route_code: route.route_code || route.code || generateCode(route),
      name: route.name,
      country: route.country,
      transfer_type: sanitizeTransferType(route.transfer_type || route.transferType || "One-Way"),
      start_location: route.start_location || route.startLocation,
      end_location: route.end_location || route.endLocation,
      // Fields that exist in the view but not in the actual table are removed:
      // - currency (removed previously)
      // - intermediate_stops (stored in separate table)
      // - transport_types (stored in separate table)
      // - sightseeing_options (stored in separate table)
      status: sanitizeStatus(route.status || "active"),
      notes: route.description || route.notes || "",
      enable_sightseeing: route.enable_sightseeing === true || route.enableSightseeing === true || route.enableSightseeing === "true",
    };

    validRows.push(cleanData);
  }

  if (importMode === "replace") {
    const { error: delError } = await supabase
      .from("transport_routes")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (delError) throw delError;
  }

  if (validRows.length) {
    if (importMode === "update") {
      // Upsert by route_code or provided key
      const conflictTarget = upsertBy;
      // Supabase JS upsert uses insert with onConflict option via PostgREST query param
      const { error } = await supabase
        .from("transport_routes")
        .upsert(validRows, { onConflict: conflictTarget, ignoreDuplicates: false })
        .select("id");
      if (error) throw error;
    } else {
      const { error } = await supabase.from("transport_routes").insert(validRows);
      if (error) throw error;
    }
  }

  return { validCount: validRows.length, invalidCount: invalidRows.length, invalidRows };
}

// Preview-only parsing helper used by Import UI before confirming DB writes
export async function parseTransportRoutes(file: File, options: ImportOptions) {
  const { validate = true, continueOnError = false } = options || {};

  let routes: any[] = [];
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "xlsx" || ext === "xls") {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    routes = XLSX.utils.sheet_to_json(sheet);
  } else if (ext === "csv") {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    routes = parsed.data as any[];
  } else if (ext === "json") {
    routes = JSON.parse(await file.text());
  } else {
    throw new Error("Unsupported file format");
  }

  const validRows: any[] = [];
  const invalidRows: { route: any; errors: string[] }[] = [];

  for (const raw of routes) {
    const route = normalizeImportRow(raw);
    const required = ["name", "country", "start_location", "end_location"];
    const missing = required.filter((r) => !route[r]);

    if (validate && missing.length) {
      invalidRows.push({ route: raw, errors: missing });
      if (!continueOnError) continue;
    }

    const cleanData = {
      route_code: route.route_code || route.code || generateCode(route),
      name: route.name,
      country: route.country,
      currency: route.currency || "฿",
      transfer_type: sanitizeTransferType(route.transfer_type || route.transferType || "One-Way"),
      start_location: route.start_location || route.startLocation,
      end_location: route.end_location || route.endLocation,
      intermediate_stops: parseJSON(route.intermediate_stops ?? route.intermediateStops),
      transport_types: parseJSON(route.transport_types ?? route.transportTypes),
      enable_sightseeing: route.enable_sightseeing === true || route.enableSightseeing === true || route.enableSightseeing === "true",
      sightseeing_options: parseJSON(route.sightseeing_options ?? route.sightseeingOptions),
      status: sanitizeStatus(route.status || "active"),
      notes: route.description || route.notes || "",
    };

    validRows.push(cleanData);
  }

  return { validRows, invalidRows };
}

export async function exportTransportRoutes(options: ExportOptions) {
  const { format, filename, selectedFields, filters } = options || ({} as ExportOptions);
  const baseFilename = filename || `transport_routes_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${format}`;

  // Use an "any"-typed client to avoid deep generic instantiation on chained PostgREST queries
  const sb: any = supabase;

  // Build query with filters using typed base tables
  let routesQuery = sb.from("transport_routes").select("*");
  const statusFilter = filters?.status && filters.status !== 'any' ? filters.status : undefined;
  const countryFilter = filters?.country && filters.country.trim().length ? filters.country.trim() : undefined;
  if (statusFilter) {
    routesQuery = routesQuery.eq("status", statusFilter);
  }
  if (countryFilter) {
    routesQuery = routesQuery.eq("country", countryFilter);
  }

  const { data: routes, error: routesError } = await routesQuery;
  if (routesError) throw routesError;

  const routeList = Array.isArray(routes) ? routes : [];
  // eslint-disable-next-line no-console
  console.debug('[ExportRoutes] Filters:', { status: statusFilter, country: countryFilter }, 'routeCount:', routeList.length);
  const routeIds = routeList.map((r: any) => r.id).filter(Boolean);

  // Fetch related JSON-array sources and aggregate by route_id
  let stopsByRoute: Record<string, any[]> = {};
  let typesByRoute: Record<string, any[]> = {};
  let sightByRoute: Record<string, any[]> = {};

  if (routeIds.length) {
    // Avoid deep generic tuple inference from Promise.all and Supabase types
    const stopsRes = (await sb
      .from("intermediate_stops")
      .select("*")
      .in("route_id", routeIds)) as unknown as SimpleResponse;

    // Detect whether transport_types has a route_id column in current schema
    const transportTypesColumnCheck = await sb
      .from("transport_types")
      .select("route_id")
      .limit(0);
    const hasTransportTypesRouteId = !transportTypesColumnCheck.error;

    let typesRes: SimpleResponse = { data: null, error: null } as any;
    if (hasTransportTypesRouteId) {
      typesRes = (await sb
        .from("transport_types")
        .select("*")
        .in("route_id", routeIds)) as unknown as SimpleResponse;
    }

    const sightRes = (await sb
      .from("sightseeing_options")
      .select("*")
      .in("route_id", routeIds)) as unknown as SimpleResponse;

    if (stopsRes.error) throw stopsRes.error;
    if (hasTransportTypesRouteId && typesRes.error) throw typesRes.error;
    if (sightRes.error) throw sightRes.error;

    for (const s of stopsRes.data || []) {
      const rid = (s as any).route_id;
      if (!stopsByRoute[rid]) stopsByRoute[rid] = [];
      stopsByRoute[rid].push(s);
    }
    if (hasTransportTypesRouteId) {
      for (const t of typesRes.data || []) {
        const rid = (t as any).route_id;
        if (!typesByRoute[rid]) typesByRoute[rid] = [];
        typesByRoute[rid].push(t);
      }
    } else {
      // Fallback: many schemas store transport types inline as JSON in transport_routes
      for (const r of routeList) {
        const rid = (r as any).id;
        const inline = (r as any).transport_types ?? (r as any).vehicle_types ?? [];
        typesByRoute[rid] = Array.isArray(inline) ? inline : [];
      }
    }
    for (const o of sightRes.data || []) {
      const rid = (o as any).route_id;
      if (!sightByRoute[rid]) sightByRoute[rid] = [];
      sightByRoute[rid].push(o);
    }
    // eslint-disable-next-line no-console
    console.debug('[ExportRoutes] Aggregations:', {
      stops: stopsRes.data?.length || 0,
      types: hasTransportTypesRouteId ? (typesRes.data?.length || 0) : 'inline-json',
      sight: sightRes.data?.length || 0,
    });
  }

  const rows = routeList.map((r: any) => mapRouteToExportRow(r, { stopsByRoute, typesByRoute, sightByRoute }));

  // Reduce to selected fields if provided
  const finalRows = Array.isArray(selectedFields) && selectedFields.length
    ? rows.map((row) => pickFields(row, selectedFields))
    : rows;

  // eslint-disable-next-line no-console
  console.debug('[ExportRoutes] Final rows:', finalRows.length, 'Selected fields:', selectedFields);

  if (format === "json") {
    const blob = new Blob([JSON.stringify(finalRows, null, 2)], { type: "application/json" });
    return { blob, filename: baseFilename, meta: { filters, routeCount: routeList.length, rowsCount: finalRows.length } };
  }

  if (format === "csv") {
    const csv = Papa.unparse(finalRows, { quotes: false });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    return { blob, filename: baseFilename, meta: { filters, routeCount: routeList.length, rowsCount: finalRows.length } };
  }

  // xlsx
  const wb = XLSX.utils.book_new();
  // Cast to any[] to prevent generic instantiation depth issues in json_to_sheet
  const ws = XLSX.utils.json_to_sheet(((finalRows.length ? finalRows : [{}]) as unknown) as any[]);
  XLSX.utils.book_append_sheet(wb, ws, "Routes");
  const xlsxBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([xlsxBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  return { blob, filename: baseFilename, meta: { filters, routeCount: routeList.length, rowsCount: finalRows.length } };
}

function parseJSON(val: any) {
  try {
    if (val == null) return [];
    if (typeof val === "string") return JSON.parse(val);
    return Array.isArray(val) ? val : [];
  } catch {
    return [];
  }
}

function generateCode(route: any) {
  const start = (route.start_location || route.startLocation || "").slice(0, 3).toUpperCase();
  const end = (route.end_location || route.endLocation || "").slice(0, 3).toUpperCase();
  const rand = Math.floor(Math.random() * 999).toString().padStart(3, "0");
  return `${start}-${end}-${rand}`;
}

function sanitizeTransferType(val: string) {
  const map: Record<string, string> = {
    "one-way": "One-Way",
    "round-trip": "Round-Trip",
    "multi-stop": "Multi-Stop",
    "en route": "en route",
  };
  const key = String(val || "One-Way").toLowerCase();
  return map[key] || val;
}

function sanitizeStatus(val: string) {
  const key = String(val || "active").toLowerCase();
  return key === "inactive" ? "inactive" : "active";
}

function normalizeImportRow(raw: any) {
  const obj = { ...raw };
  // Map common UI field names to db-like keys
  if (obj.code && !obj.route_code) obj.route_code = obj.code;
  if (obj.transferType && !obj.transfer_type) obj.transfer_type = obj.transferType;
  if (obj.startLocation && !obj.start_location) obj.start_location = obj.startLocation;
  if (obj.endLocation && !obj.end_location) obj.end_location = obj.endLocation;
  if (obj.intermediateStops && !obj.intermediate_stops) obj.intermediate_stops = obj.intermediateStops;
  if (obj.transportTypes && !obj.transport_types) obj.transport_types = obj.transportTypes;
  if (obj.sightseeingOptions && !obj.sightseeing_options) obj.sightseeing_options = obj.sightseeingOptions;
  if (obj.enableSightseeing && obj.enableSightseeing !== undefined && obj.enable_sightseeing === undefined) obj.enable_sightseeing = obj.enableSightseeing;
  return obj;
}

function mapRouteToExportRow(
  r: any,
  maps?: {
    stopsByRoute?: Record<string, any[]>;
    typesByRoute?: Record<string, any[]>;
    sightByRoute?: Record<string, any[]>;
  }
) {
  return {
    id: r.id,
    code: r.route_code,
    name: r.name ?? r.route_name,
    country: r.country,
    currency: r.currency ?? "฿",
    transferType: r.transfer_type,
    startLocation: r.start_location,
    endLocation: r.end_location,
    intermediateStops: JSON.stringify(
      (maps?.stopsByRoute && maps.stopsByRoute[r.id]) ?? (r.intermediate_stops ?? [])
    ),
    transportTypes: JSON.stringify(
      (maps?.typesByRoute && maps.typesByRoute[r.id]) ?? (r.transport_types ?? r.vehicle_types ?? [])
    ),
    enableSightseeing: Boolean(r.enable_sightseeing),
    sightseeingOptions: JSON.stringify(
      (maps?.sightByRoute && maps.sightByRoute[r.id]) ?? (r.sightseeing_options ?? [])
    ),
    status: r.status,
    price: r.price ?? null,
    distance: r.distance ?? null,
    duration: r.duration ?? "",
    description: r.description ?? r.notes ?? "",
  };
}

function pickFields(row: Record<string, any>, fields: string[]) {
  const out: Record<string, any> = {};
  for (const f of fields) {
    out[f] = row[f];
  }
  return out;
}