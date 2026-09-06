/**
 * MilkyWay MCP Investigation Tool Server
 * 
 * Standalone, Cloud Run-deployable Model Context Protocol (MCP) server.
 * Provides EXACTLY the four read-only investigation tools:
 * 1. trace_batch(batch_id)
 * 2. get_facility_history(facility_id)
 * 3. get_vehicle_history(vehicle_id)
 * 4. get_related_batches(batch_id)
 * 
 * SECURITY MANDATES:
 * - Every request requires a valid Firebase Officer/Admin token or trusted internal backend key.
 * - Least-privilege, read-only BigQuery query boundaries.
 * - Zero mutations, zero deletions, zero data invention, zero diagnostic conclusions.
 * - Structured errors without leaking credentials or stack traces.
 */

import express, { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import {
  MCP_TOOL_DEFINITIONS,
  McpToolError,
  McpToolResponse
} from './types';
import {
  traceBatch,
  getFacilityHistory,
  getVehicleHistory,
  getRelatedBatches,
  withTimeout,
  McpInvestigationError
} from './investigationTools';

export interface McpCallerContext {
  callerId: string;
  role: 'OFFICER' | 'ADMIN' | 'INTERNAL_SERVICE';
  authMethod: 'FIREBASE_TOKEN' | 'INTERNAL_SERVICE_KEY' | 'TEST_HARNESS';
}

export interface McpAuthenticatedRequest extends Request {
  mcpCaller?: McpCallerContext;
}

/**
 * Authentication Middleware for MCP Investigation Tool Server
 * Rejects unauthenticated, farmer, or untrusted requests.
 */
export async function authenticateMcpCaller(
  req: McpAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const serviceKeyHeader = req.headers['x-mcp-service-key'] as string | undefined;
  const internalSecret = process.env.MCP_INTERNAL_SERVICE_KEY || process.env.INTERNAL_SERVICE_SECRET;

  // 1. Check for Trusted Backend Internal Service Key (e.g. Cloud Run to Cloud Run service auth)
  if (serviceKeyHeader && internalSecret && serviceKeyHeader === internalSecret) {
    req.mcpCaller = {
      callerId: 'mcp-internal-service',
      role: 'INTERNAL_SERVICE',
      authMethod: 'INTERNAL_SERVICE_KEY'
    };
    return next();
  }

  // 2. Check Bearer Token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const errPayload: McpToolResponse = {
      success: false,
      tool: req.path.split('/').pop() || 'unknown',
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized request: Missing or invalid Authorization header. Valid Bearer token or service key required.'
      },
      executed_at: new Date().toISOString(),
      duration_ms: 0
    };
    res.status(401).json(errPayload);
    return;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    res.status(401).json({
      success: false,
      tool: req.path.split('/').pop() || 'unknown',
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized request: Empty Bearer token provided.'
      },
      executed_at: new Date().toISOString(),
      duration_ms: 0
    });
    return;
  }

  // 3. Test Harness Mock Tokens (Only permitted in non-production or test runs)
  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_TOKENS === 'true') {
    if (token === 'TEST_OFFICER_TOKEN_VALID') {
      req.mcpCaller = {
        callerId: 'test-officer-9021',
        role: 'OFFICER',
        authMethod: 'TEST_HARNESS'
      };
      return next();
    }
    if (token === 'TEST_ADMIN_TOKEN_VALID') {
      req.mcpCaller = {
        callerId: 'test-admin-01',
        role: 'ADMIN',
        authMethod: 'TEST_HARNESS'
      };
      return next();
    }
    if (token === 'TEST_FARMER_TOKEN') {
      // Explicitly reject farmer identity: farmer identities must never satisfy officer MCP tools
      res.status(403).json({
        success: false,
        tool: req.path.split('/').pop() || 'unknown',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized request: Role FARMER is not authorized to invoke MilkyWay officer MCP tools.'
        },
        executed_at: new Date().toISOString(),
        duration_ms: 0
      });
      return;
    }
  }

  // 4. Verify Firebase ID Token via Firebase Admin SDK
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const roleClaim = (decodedToken.role as string)?.toUpperCase();
    const email = (decodedToken.email || '').toLowerCase();

    const isOfficer = roleClaim === 'OFFICER' || roleClaim === 'ADMIN' || email.includes('foodsafety.gov.in') || email.includes('officer');
    
    if (!isOfficer) {
      res.status(403).json({
        success: false,
        tool: req.path.split('/').pop() || 'unknown',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Forbidden: Insufficient privileges. Only verified Food Safety Officers or Admins can access MCP investigation tools.'
        },
        executed_at: new Date().toISOString(),
        duration_ms: 0
      });
      return;
    }

    req.mcpCaller = {
      callerId: decodedToken.uid,
      role: roleClaim === 'ADMIN' ? 'ADMIN' : 'OFFICER',
      authMethod: 'FIREBASE_TOKEN'
    };
    return next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      tool: req.path.split('/').pop() || 'unknown',
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized request: Firebase token verification failed.',
        details: err.message
      },
      executed_at: new Date().toISOString(),
      duration_ms: 0
    });
  }
}

/**
 * Executes a tool by name with arguments and timeout protection
 */
export async function executeMcpTool(
  toolName: string,
  args: Record<string, any>,
  timeoutMs = 5000
): Promise<any> {
  switch (toolName) {
    case 'trace_batch':
      return await withTimeout(traceBatch(args as any), timeoutMs, 'trace_batch');
    case 'get_facility_history':
      return await withTimeout(getFacilityHistory(args as any), timeoutMs, 'get_facility_history');
    case 'get_vehicle_history':
      return await withTimeout(getVehicleHistory(args as any), timeoutMs, 'get_vehicle_history');
    case 'get_related_batches':
      return await withTimeout(getRelatedBatches(args as any), timeoutMs, 'get_related_batches');
    default:
      throw new McpInvestigationError(
        'UNKNOWN_TOOL',
        `Tool '${toolName}' is not recognized. Available tools: trace_batch, get_facility_history, get_vehicle_history, get_related_batches.`
      );
  }
}

/**
 * Creates the Express Application for the MCP Investigation Tool Server
 */
export function createMcpApp(): express.Application {
  const app = express();

  // Top-level body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Liveness & Readiness Probes for Cloud Run
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'milkyway-mcp-server',
      version: '1.0.0',
      tools_available: MCP_TOOL_DEFINITIONS.map(t => t.name),
      timestamp: new Date().toISOString()
    });
  });

  app.get('/mcp/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'milkyway-mcp-server',
      version: '1.0.0',
      tools_count: MCP_TOOL_DEFINITIONS.length,
      timestamp: new Date().toISOString()
    });
  });

  // Tool List endpoint (MCP Protocol discovery)
  app.get('/mcp/tools', (req, res) => {
    res.json({
      tools: MCP_TOOL_DEFINITIONS
    });
  });

  // Standard JSON-RPC 2.0 endpoint for MCP clients
  app.post('/mcp/rpc', authenticateMcpCaller, async (req: McpAuthenticatedRequest, res: Response) => {
    const start = Date.now();
    const { jsonrpc, id, method, params } = req.body || {};

    if (jsonrpc !== '2.0') {
      res.status(400).json({
        jsonrpc: '2.0',
        id: id || null,
        error: { code: -32600, message: 'Invalid Request: jsonrpc version 2.0 required.' }
      });
      return;
    }

    if (method === 'tools/list') {
      res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOL_DEFINITIONS
        }
      });
      return;
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      try {
        const data = await executeMcpTool(toolName, toolArgs);
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2)
              }
            ],
            data,
            duration_ms: Date.now() - start
          }
        });
      } catch (err: any) {
        const mcpError: McpToolError = err instanceof McpInvestigationError
          ? err.toMcpError()
          : { code: 'DATABASE_FAILURE', message: 'Internal tool execution error.' };

        res.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32000,
            message: mcpError.message,
            data: mcpError
          }
        });
      }
      return;
    }

    res.status(404).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method '${method}' not found.` }
    });
  });

  // REST Tool execution endpoints (for direct ADK agent calls)
  app.post('/mcp/tools/:toolName', authenticateMcpCaller, async (req: McpAuthenticatedRequest, res: Response) => {
    const start = Date.now();
    const toolName = req.params.toolName;
    const args = req.body || {};

    try {
      const data = await executeMcpTool(toolName, args);
      const response: McpToolResponse = {
        success: true,
        tool: toolName,
        data,
        executed_at: new Date().toISOString(),
        duration_ms: Date.now() - start
      };
      res.json(response);
    } catch (err: any) {
      const mcpError: McpToolError = err instanceof McpInvestigationError
        ? err.toMcpError()
        : { code: 'DATABASE_FAILURE', message: 'Database operation failed during tool execution.' };

      let statusCode = 500;
      if (mcpError.code === 'INVALID_IDENTIFIER') statusCode = 400;
      else if (mcpError.code === 'NOT_FOUND') statusCode = 404;
      else if (mcpError.code === 'UNAUTHORIZED') statusCode = 403;
      else if (mcpError.code === 'TOOL_TIMEOUT') statusCode = 504;
      else if (mcpError.code === 'UNKNOWN_TOOL') statusCode = 404;

      const response: McpToolResponse = {
        success: false,
        tool: toolName,
        error: mcpError,
        executed_at: new Date().toISOString(),
        duration_ms: Date.now() - start
      };

      res.status(statusCode).json(response);
    }
  });

  return app;
}

/**
 * Boots the MCP Server as a standalone Cloud Run service if executed directly
 */
export function startMcpServer(port = Number(process.env.MCP_PORT || process.env.PORT || 8080)) {
  const app = createMcpApp();
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`[MilkyWay MCP Server] Cloud Run investigation tool server running on port ${port}`);
    console.log(`[MilkyWay MCP Server] Available tools: ${MCP_TOOL_DEFINITIONS.map(t => t.name).join(', ')}`);
  });

  // Graceful shutdown handling for Cloud Run container lifecycle
  process.on('SIGTERM', () => {
    console.log('[MilkyWay MCP Server] SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('[MilkyWay MCP Server] HTTP server closed gracefully');
      process.exit(0);
    });
  });

  return server;
}

// Auto-boot when run as the primary script: tsx src/server/mcp/mcpServer.ts
if (process.argv[1]?.endsWith('mcpServer.ts') || process.argv[1]?.endsWith('mcpServer.js')) {
  startMcpServer();
}
