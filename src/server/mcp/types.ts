/**
 * MilkyWay MCP Investigation Tool Server - Type Definitions
 * 
 * Defines the EXACT FOUR investigation tools for the Model Context Protocol (MCP)
 * and ADK investigation agents.
 * 
 * ARCHITECTURAL CONSTRAINTS:
 * 1. Read-Only: Zero modifications, mutations, or deletions against the BigQuery journal.
 * 2. Non-Diagnostic: Only retrieves verified evidence; no conclusions or fraud claims.
 * 3. Structured Errors: Safe, uniform error payloads without stack traces or credentials.
 */

export interface McpToolError {
  code: 'INVALID_IDENTIFIER' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'DATABASE_FAILURE' | 'TOOL_TIMEOUT' | 'UNKNOWN_TOOL';
  message: string;
  field?: string;
  details?: string;
}

export interface McpToolResponse<T = any> {
  success: boolean;
  tool: string;
  data?: T;
  error?: McpToolError;
  executed_at: string;
  duration_ms: number;
}

// ---------------------------------------------------------------------------
// TOOL 1: trace_batch(batch_id)
// ---------------------------------------------------------------------------
export interface TraceBatchArgs {
  batch_id: string;
}

export interface TraceBatchResult {
  batch: {
    batch_id: string;
    origin_facility_id: string;
    initial_quantity_litres: number;
    created_at: string;
    status: string;
  };
  event_timeline: Array<{
    event_id: string;
    event_type: string;
    actor_id: string;
    facility_id: string | null;
    vehicle_id: string | null;
    quantity_litres: number;
    timestamp: string;
    latitude: number | null;
    longitude: number | null;
    metadata: Record<string, any>;
  }>;
  quantities: {
    initial_litres: number;
    final_recorded_litres: number;
    recorded_steps: Array<{
      event_type: string;
      quantity_litres: number;
      timestamp: string;
    }>;
    net_variance_litres: number;
  };
  facilities: Array<{
    facility_id: string;
    name: string;
    facility_type: string;
    location: string;
    role_in_batch: 'ORIGIN' | 'TRANSIT' | 'PROCESSING' | 'DESTINATION';
  }>;
  vehicles: Array<{
    vehicle_id: string;
    registration_number: string;
    vehicle_type: string;
    capacity_litres: number;
  }>;
  existing_anomalies: Array<{
    anomaly_id: string;
    type: string;
    severity: string;
    difference: number;
    observed_value: number;
    expected_value: number;
    investigation_signal: string;
    detected_at: string;
    status: string;
  }>;
}

// ---------------------------------------------------------------------------
// TOOL 2: get_facility_history(facility_id)
// ---------------------------------------------------------------------------
export interface GetFacilityHistoryArgs {
  facility_id: string;
  limit_events?: number;
}

export interface GetFacilityHistoryResult {
  facility: {
    facility_id: string;
    name: string;
    facility_type: string;
    location: string;
    latitude: number;
    longitude: number;
    active: boolean;
  };
  historical_batches: Array<{
    batch_id: string;
    initial_quantity_litres: number;
    created_at: string;
    status: string;
    role: 'ORIGIN' | 'TRANSIT_CHECKPOINT' | 'PROCESSING_SITE';
  }>;
  historical_anomalies: Array<{
    anomaly_id: string;
    batch_id: string;
    type: string;
    severity: string;
    difference: number;
    detected_at: string;
    investigation_signal: string;
  }>;
  relevant_events: Array<{
    event_id: string;
    batch_id: string;
    event_type: string;
    actor_id: string;
    vehicle_id: string | null;
    quantity_litres: number;
    timestamp: string;
  }>;
  previous_investigation_cases: Array<{
    case_id: string;
    batch_id: string;
    title: string;
    status: string;
    priority: string;
    opened_at: string;
  }>;
}

// ---------------------------------------------------------------------------
// TOOL 3: get_vehicle_history(vehicle_id)
// ---------------------------------------------------------------------------
export interface GetVehicleHistoryArgs {
  vehicle_id: string;
  limit_routes?: number;
}

export interface GetVehicleHistoryResult {
  vehicle: {
    vehicle_id: string;
    registration_number: string;
    vehicle_type: string;
    capacity_litres: number;
    active: boolean;
  };
  historical_routes: Array<{
    route_id: string;
    batch_id: string;
    origin_facility_id: string;
    destination_facility_id: string;
    departed_at: string;
    arrived_at: string;
    distance_km: number;
    implied_speed_kmh: number;
    is_implausible_speed: boolean;
  }>;
  historical_batches: Array<{
    batch_id: string;
    quantity_carried_litres: number;
    transit_date: string;
    has_recorded_anomaly: boolean;
  }>;
  movement_anomalies: Array<{
    anomaly_id: string;
    batch_id: string;
    severity: string;
    observed_speed_kmh: number;
    max_plausible_speed_kmh: number;
    difference: number;
    detected_at: string;
    investigation_signal: string;
    possible_explanations: string[];
  }>;
  relevant_events: Array<{
    event_id: string;
    batch_id: string;
    event_type: string;
    facility_id: string | null;
    quantity_litres: number;
    timestamp: string;
  }>;
}

// ---------------------------------------------------------------------------
// TOOL 4: get_related_batches(batch_id)
// ---------------------------------------------------------------------------
export interface GetRelatedBatchesArgs {
  batch_id: string;
  time_window_hours?: number; // defaults to 24 hours
}

export interface GetRelatedBatchesResult {
  target_batch_id: string;
  related_by_facility: Array<{
    batch_id: string;
    shared_facility_id: string;
    facility_name: string;
    created_at: string;
    status: string;
    has_anomaly: boolean;
  }>;
  related_by_vehicle: Array<{
    batch_id: string;
    shared_vehicle_id: string;
    vehicle_registration: string;
    transit_timestamp: string;
    has_anomaly: boolean;
  }>;
  related_by_time_window: Array<{
    batch_id: string;
    created_at: string;
    time_difference_hours: number;
    status: string;
    has_anomaly: boolean;
  }>;
  supply_chain_relationships: Array<{
    batch_id: string;
    relationship_type: 'CORRELATED_CORRECTION' | 'SHARED_ROUTE' | 'SAME_ORIGIN_RUN';
    details: string;
  }>;
  summary: {
    total_related_batches: number;
    anomalous_related_count: number;
    relationship_signals: string[];
  };
}

// ---------------------------------------------------------------------------
// MCP Protocol Manifest
// ---------------------------------------------------------------------------
export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export const MCP_TOOL_DEFINITIONS: McpToolDefinition[] = [
  {
    name: 'trace_batch',
    description: 'Retrieves complete verified supply-chain evidence for a milk batch: batch info, complete event timeline, quantities, facilities, vehicles, and existing anomalies. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        batch_id: {
          type: 'string',
          description: 'Unique identifier of the batch (e.g. BATCH-DEMO-001-CLEAN).'
        }
      },
      required: ['batch_id']
    }
  },
  {
    name: 'get_facility_history',
    description: 'Retrieves verified historical operations for a dairy facility: facility info, historical batches processed, historical anomalies, relevant supply-chain events, and previous investigation cases. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        facility_id: {
          type: 'string',
          description: 'Unique identifier of the facility (e.g. FAC-ANAND-01).'
        },
        limit_events: {
          type: 'number',
          description: 'Optional maximum number of relevant events to return (default 50).'
        }
      },
      required: ['facility_id']
    }
  },
  {
    name: 'get_vehicle_history',
    description: 'Retrieves verified transit history for a transport vehicle: vehicle info, historical routes, transported batches, movement anomalies, and relevant events. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        vehicle_id: {
          type: 'string',
          description: 'Unique identifier of the transport vehicle (e.g. VEH-GJ01-T8812).'
        },
        limit_routes: {
          type: 'number',
          description: 'Optional maximum number of historical routes to return (default 30).'
        }
      },
      required: ['vehicle_id']
    }
  },
  {
    name: 'get_related_batches',
    description: 'Finds batches related to a target batch by shared facility, shared vehicle, operational time window, or supply-chain correlation. Returns bounded relevant evidence only. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        batch_id: {
          type: 'string',
          description: 'Unique identifier of the target batch to inspect.'
        },
        time_window_hours: {
          type: 'number',
          description: 'Search time window radius in hours (default 24).'
        }
      },
      required: ['batch_id']
    }
  }
];
