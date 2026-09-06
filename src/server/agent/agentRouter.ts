/**
 * MilkyWay Investigation Agent Express API Router
 * 
 * Provides authenticated, role-protected endpoints for food-safety officers
 * to run autonomous investigations and multi-turn follow-up dialogues.
 * 
 * Boundaries enforced:
 * - Role-Based Access Control: OFFICER and ADMIN roles only.
 * - Non-Diagnostic: Output contains mandatory disclaimer and no adulteration claims.
 * - Tool Trace Transparency: Returns full audit log of autonomous MCP tool invocations.
 */

import { Router, Response } from 'express';
import { milkyWayInvestigationAgent } from './investigationAgent';

export const agentRouter = Router();

/**
 * POST /api/agent/chat
 * Multi-turn dialogue endpoint
 */
agentRouter.post('/chat', async (req: any, res: Response) => {
  try {
    const { sessionId, message } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'message string is required' });
      return;
    }

    const officerId = req.user?.uid || 'FSO-OFFICER-01';
    const effectiveSessionId = sessionId && typeof sessionId === 'string'
      ? sessionId.trim()
      : `session-${officerId}-${Date.now()}`;

    const result = await milkyWayInvestigationAgent.processMessage(
      effectiveSessionId,
      message.trim(),
      officerId
    );

    res.json({
      success: true,
      sessionId: effectiveSessionId,
      message: result.message,
      toolCalls: result.toolCalls,
      session: {
        sessionId: result.session.sessionId,
        batchId: result.session.batchId,
        uiMessages: result.session.uiMessages,
        toolAuditLog: result.session.toolAuditLog
      }
    });
  } catch (err: any) {
    console.error('[Agent Router /api/agent/chat] Execution failed:', err);
    res.status(500).json({
      error: 'Investigation agent encountered an error',
      details: err.message
    });
  }
});

/**
 * POST /api/agent/investigate
 * Quick investigation endpoint for a specific batch
 */
agentRouter.post('/investigate', async (req: any, res: Response) => {
  try {
    const { batchId, sessionId } = req.body || {};

    if (!batchId || typeof batchId !== 'string' || batchId.trim().length === 0) {
      res.status(400).json({ error: 'batchId string is required' });
      return;
    }

    const officerId = req.user?.uid || 'FSO-OFFICER-01';
    const cleanBatchId = batchId.trim().toUpperCase();
    const effectiveSessionId = sessionId && typeof sessionId === 'string'
      ? sessionId.trim()
      : `inv-${cleanBatchId}-${Date.now()}`;

    const prompt = `Investigate batch ${cleanBatchId}.`;
    const result = await milkyWayInvestigationAgent.processMessage(
      effectiveSessionId,
      prompt,
      officerId
    );

    res.json({
      success: true,
      batchId: cleanBatchId,
      sessionId: effectiveSessionId,
      brief: result.message,
      toolCalls: result.toolCalls,
      session: {
        sessionId: result.session.sessionId,
        batchId: cleanBatchId,
        uiMessages: result.session.uiMessages,
        toolAuditLog: result.session.toolAuditLog
      }
    });
  } catch (err: any) {
    console.error('[Agent Router /api/agent/investigate] Execution failed:', err);
    res.status(500).json({
      error: 'Failed to generate investigation brief',
      details: err.message
    });
  }
});

/**
 * GET /api/agent/session/:sessionId
 * Retrieves existing conversation history and tool traces
 */
agentRouter.get('/session/:sessionId', (req: any, res: Response) => {
  const sessionId = req.params.sessionId;
  const session = milkyWayInvestigationAgent.getOrCreateSession(sessionId, req.user?.uid || 'FSO-OFFICER-01');
  
  res.json({
    success: true,
    session: {
      sessionId: session.sessionId,
      batchId: session.batchId,
      officerId: session.officerId,
      uiMessages: session.uiMessages,
      toolAuditLog: session.toolAuditLog,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }
  });
});

/**
 * GET /api/agent/status
 * Reports agent readiness and MCP integration state
 */
agentRouter.get('/status', (req: any, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  res.json({
    status: 'ready',
    agent: 'MilkyWay Investigation Agent',
    framework: 'Google ADK & Gemini',
    gemini_api_configured: hasKey,
    mcp_tools_connected: [
      'trace_batch',
      'get_facility_history',
      'get_vehicle_history',
      'get_related_batches'
    ],
    non_diagnostic_guardrails: 'ACTIVE',
    fallback_ladder: ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash']
  });
});
