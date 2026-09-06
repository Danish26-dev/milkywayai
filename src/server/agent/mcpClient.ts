/**
 * MilkyWay Investigation Agent - MCP Client Adapter
 * 
 * Bridges the Google ADK / Gemini Investigation Agent to the MilkyWay MCP Server.
 * Supports calling the four read-only investigation tools:
 * 1. trace_batch(batch_id)
 * 2. get_facility_history(facility_id, limit_events?)
 * 3. get_vehicle_history(vehicle_id, limit_routes?)
 * 4. get_related_batches(batch_id, time_window_hours?)
 * 
 * Guarantees:
 * - Read-only enforcement: Only queries the journal.
 * - Input validation & sanitization: Prevents SQLi and malformed identifiers.
 * - Structured error handling with timeouts.
 */

import {
  traceBatch,
  getFacilityHistory,
  getVehicleHistory,
  getRelatedBatches,
  withTimeout
} from '../mcp/investigationTools';
import {
  TraceBatchArgs,
  TraceBatchResult,
  GetFacilityHistoryArgs,
  GetFacilityHistoryResult,
  GetVehicleHistoryArgs,
  GetVehicleHistoryResult,
  GetRelatedBatchesArgs,
  GetRelatedBatchesResult
} from '../mcp/types';

export interface McpToolCallRecord {
  tool: string;
  args: Record<string, any>;
  timestamp: string;
  duration_ms: number;
  success: boolean;
  resultSummary?: string;
  error?: string;
}

export class MilkyWayMcpClient {
  private serviceBaseUrl: string;

  constructor(serviceBaseUrl = 'http://localhost:3000') {
    this.serviceBaseUrl = serviceBaseUrl;
  }

  /**
   * Tool 1: trace_batch
   */
  public async traceBatch(args: TraceBatchArgs): Promise<TraceBatchResult> {
    return withTimeout(traceBatch(args), 6000, 'trace_batch');
  }

  /**
   * Tool 2: get_facility_history
   */
  public async getFacilityHistory(args: GetFacilityHistoryArgs): Promise<GetFacilityHistoryResult> {
    return withTimeout(getFacilityHistory(args), 6000, 'get_facility_history');
  }

  /**
   * Tool 3: get_vehicle_history
   */
  public async getVehicleHistory(args: GetVehicleHistoryArgs): Promise<GetVehicleHistoryResult> {
    return withTimeout(getVehicleHistory(args), 6000, 'get_vehicle_history');
  }

  /**
   * Tool 4: get_related_batches
   */
  public async getRelatedBatches(args: GetRelatedBatchesArgs): Promise<GetRelatedBatchesResult> {
    return withTimeout(getRelatedBatches(args), 6000, 'get_related_batches');
  }

  /**
   * Generic tool dispatcher used by Gemini function calling loop
   */
  public async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
    switch (toolName) {
      case 'trace_batch':
        return this.traceBatch({ batch_id: String(args?.batch_id || '') });
      case 'get_facility_history':
        return this.getFacilityHistory({
          facility_id: String(args?.facility_id || ''),
          limit_events: typeof args?.limit_events === 'number' ? args.limit_events : undefined
        });
      case 'get_vehicle_history':
        return this.getVehicleHistory({
          vehicle_id: String(args?.vehicle_id || ''),
          limit_routes: typeof args?.limit_routes === 'number' ? args.limit_routes : undefined
        });
      case 'get_related_batches':
        return this.getRelatedBatches({
          batch_id: String(args?.batch_id || ''),
          time_window_hours: typeof args?.time_window_hours === 'number' ? args.time_window_hours : undefined
        });
      default:
        throw new Error(`Unknown MCP tool: '${toolName}'. Supported tools: trace_batch, get_facility_history, get_vehicle_history, get_related_batches.`);
    }
  }
}

export const mcpClient = new MilkyWayMcpClient();
