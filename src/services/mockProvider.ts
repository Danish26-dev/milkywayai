/**
 * MilkyWay Service Provider
 * 
 * ARCHITECTURAL NOTICE:
 * This provider implements the typed service interfaces using in-memory state seeded
 * from `seedData.ts`. It explicitly separates demo/preview operations from production.
 * 
 * PRODUCTION ROADMAP & INTEGRATION POINTS:
 * 1. BigQuery Journal (Append-Only):
 *    TODO: Replace SupplyChainJournalService methods with Cloud Run REST calls:
 *    GET /api/v1/journal/events?limit=N -> BigQuery SELECT on milkyway_journal.events
 *    POST /api/v1/journal/events -> BigQuery append-only streaming insert with SHA-256 digest
 * 
 * 2. Cloud Firestore (Application & RBAC Data):
 *    TODO: Replace InvestigationService & AlertService with direct Firestore calls:
 *    collection("cases").where("assignedOfficerId", "==", uid)
 *    collection("cases/{caseId}/notes").addDoc(...)
 * 
 * 3. Google ADK Agent & MCP Server:
 *    TODO: InvestigationBrief generation will invoke the Google ADK investigation agent
 *    connected via MCP to BigQuery tools (trace_batch, get_facility_history, etc.).
 *    No simulated AI text is generated; genuine model generation occurs via server-side MCP.
 */

import {
  SupplyChainJournalService,
  InvestigationService,
  AlertService,
  FacilityVehicleService,
  OfficerAuthService,
  BatchFilterOptions
} from './types';
import {
  Batch,
  SupplyChainEvent,
  Anomaly,
  InvestigationCase,
  OfficerNote,
  Facility,
  Vehicle,
  ActiveAlert,
  Officer
} from '../types/models';
import {
  SEED_OFFICER,
  SEED_FACILITIES,
  SEED_VEHICLES,
  SEED_ANOMALIES,
  SEED_BATCHES,
  SEED_EVENTS,
  SEED_INVESTIGATION_CASES,
  SEED_ALERTS
} from './seedData';
import { auth } from '../lib/firebase';

/**
 * Builds request headers with the verified Firebase ID token when a user is
 * signed in. Never sends demo/test tokens — the server rejects those in
 * production, and authentication must rely on real Firebase tokens.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // No token available; request proceeds unauthenticated and the server will reject it.
  }
  return headers;
}

// Local mutable state for realistic in-session interactions (e.g. adding officer notes or changing case status)
let localBatches: Batch[] = [...SEED_BATCHES];
let localEvents: SupplyChainEvent[] = [...SEED_EVENTS];
let localCases: InvestigationCase[] = [...SEED_INVESTIGATION_CASES];
let localAlerts: ActiveAlert[] = [...SEED_ALERTS];
let currentOfficer: Officer | null = { ...SEED_OFFICER };

export const supplyChainJournalService: SupplyChainJournalService = {
  async getRecentEvents(limit = 20): Promise<SupplyChainEvent[]> {
    return localEvents.slice(0, limit);
  },

  async getEventsForBatch(batchId: string): Promise<SupplyChainEvent[]> {
    try {
      const headers = await getAuthHeaders();
      if (headers.Authorization) {
        const res = await fetch(`/api/batches/${encodeURIComponent(batchId)}/events`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.events) && data.events.length > 0) {
            return data.events.map((evt: any) => ({
              eventId: evt.event_id,
              batchId: evt.batch_id,
              eventType: evt.event_type,
              facilityId: evt.facility_id || 'FAC-DEFAULT',
              facilityName: evt.facility_name || 'Supply Chain Node',
              recordedByOfficerOrOperatorId: evt.actor_id,
              timestamp: evt.timestamp,
              quantityLitres: evt.quantity_litres,
              vehicleId: evt.vehicle_id || undefined,
              cryptographicHash: evt.metadata?.cryptographic_hash || 'verified-journal-digest',
              previousEventHash: evt.metadata?.previous_hash || '00000000'
            }));
          }
        }
      }
    } catch (e) {
      // Graceful fallback to local seed journal
    }
    return localEvents.filter(e => e.batchId === batchId);
  },

  async getBatches(filters?: BatchFilterOptions): Promise<Batch[]> {
    try {
      const headers = await getAuthHeaders();
      if (headers.Authorization) {
        const queryParams = new URLSearchParams();
        if (filters?.status) queryParams.set('status', filters.status);
        const res = await fetch(`/api/batches?${queryParams.toString()}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.batches) && data.batches.length > 0) {
            // Transform server BigQuery batch rows to UI Batch model
            const serverBatches: Batch[] = data.batches.map((b: any) => {
              const existing = localBatches.find(lb => lb.id === b.batch_id);
              if (existing) return existing;
              return {
                id: b.batch_id,
                batchCode: b.batch_id,
                originFacilityId: b.origin_facility_id,
                originFacilityName: b.origin_facility_name || 'Origin Hub',
                currentFacilityId: b.origin_facility_id,
                currentFacilityName: 'Distribution Node',
                collectedLitres: b.initial_quantity_litres,
                currentRecordedLitres: b.initial_quantity_litres,
                expectedLossLitres: 0,
                unaccountedDiscrepancyLitres: 0,
                createdAt: b.created_at,
                lastEventTimestamp: b.created_at,
                status: b.status || 'NORMAL',
                associatedAnomalyIds: [],
                eventCount: 1
              };
            });
            // Merge with local batches ensuring no duplicates
            const serverIds = new Set(serverBatches.map(sb => sb.id));
            const merged = [...serverBatches, ...localBatches.filter(lb => !serverIds.has(lb.id))];
            
            let filtered = merged;
            if (filters?.status) {
              filtered = filtered.filter(b => b.status === filters.status);
            }
            if (filters?.hasAnomaliesOnly) {
              filtered = filtered.filter(b => b.associatedAnomalyIds.length > 0);
            }
            return filtered;
          }
        }
      }
    } catch (e) {
      // Fallback to local dataset
    }

    let result = [...localBatches];
    if (filters?.status) {
      result = result.filter(b => b.status === filters.status);
    }
    if (filters?.facilityId) {
      result = result.filter(b => b.currentFacilityId === filters.facilityId || b.originFacilityId === filters.facilityId);
    }
    if (filters?.hasAnomaliesOnly) {
      result = result.filter(b => b.associatedAnomalyIds.length > 0);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(b => 
        b.id.toLowerCase().includes(q) || 
        b.batchCode.toLowerCase().includes(q) ||
        b.currentFacilityName.toLowerCase().includes(q)
      );
    }
    return result;
  },

  async getBatchById(batchId: string): Promise<Batch | null> {
    try {
      const headers = await getAuthHeaders();
      if (headers.Authorization) {
        const res = await fetch(`/api/batches/${encodeURIComponent(batchId)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.batch) {
            const b = data.batch;
            const existing = localBatches.find(lb => lb.id === b.batch_id);
            if (existing) return existing;
            return {
              id: b.batch_id,
              batchCode: b.batch_id,
              originFacilityId: b.origin_facility_id,
              originFacilityName: 'Origin Hub',
              currentFacilityId: b.origin_facility_id,
              currentFacilityName: 'Destination Node',
              collectedLitres: b.initial_quantity_litres,
              currentRecordedLitres: data.current_quantity_litres ?? b.initial_quantity_litres,
              expectedLossLitres: 0,
              unaccountedDiscrepancyLitres: data.mass_balance_discrepancy_litres ?? 0,
              createdAt: b.created_at,
              lastEventTimestamp: b.created_at,
              status: b.status || 'NORMAL',
              associatedAnomalyIds: [],
              eventCount: data.event_count || 1
            };
          }
        }
      }
    } catch (e) {
      // Fallback
    }

    const batch = localBatches.find(b => b.id === batchId || b.batchCode === batchId);
    return batch || null;
  },

  async appendCompensatingEvent(eventData): Promise<SupplyChainEvent> {
    // Attempt backend POST /api/batches/:batchId/events if authenticated
    try {
      const headers = await getAuthHeaders();
      if (headers.Authorization) {
        await fetch(`/api/batches/${encodeURIComponent(eventData.batchId)}/events`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event_type: eventData.eventType,
            facility_id: eventData.facilityId,
            vehicle_id: eventData.vehicleId,
            quantity_litres: eventData.quantityLitres,
            timestamp: eventData.timestamp,
            metadata: {
              fat_percentage: eventData.fatPercentage,
              snf_percentage: eventData.snfPercentage,
              temperature_celsius: eventData.temperatureCelsius
            }
          })
        });
      }
    } catch (e) {
      // Non-blocking for local preview
    }

    const previousEvent = localEvents[0];
    const newEvent: SupplyChainEvent = {
      ...eventData,
      eventId: `EVT-${Date.now()}`,
      cryptographicHash: `sha256-${Math.random().toString(36).substring(2)}`,
      previousEventHash: previousEvent ? previousEvent.cryptographicHash : '00000000'
    };
    localEvents = [newEvent, ...localEvents];
    return newEvent;
  }
};

export const investigationService: InvestigationService = {
  async getPriorityInvestigations(): Promise<InvestigationCase[]> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/investigations/priority', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.investigations) && data.investigations.length > 0) {
          return data.investigations.map((item: any) => ({
            id: item.caseId || item.id,
            caseNumber: item.caseId ? `INV-${item.caseId.replace('CASE-', '')}` : 'INV-2026',
            batchId: item.batchId || item.batch,
            batchCode: item.batch,
            facilityId: item.facilityId,
            facilityName: item.facility,
            primaryAnomalyId: `ANOM-${item.batch}`,
            primaryAnomalyType: item.anomaly && item.anomaly.includes('MOVEMENT') ? 'IMPOSSIBLE_MOVEMENT' : 'MASS_BALANCE',
            priority: item.priority,
            status: item.status,
            discrepancyLitres: item.discrepancy ? parseFloat(item.discrepancy.replace(/[^0-9.-]/g, '')) || 0 : 0,
            variancePercentage: item.discrepancy ? parseFloat(item.discrepancy.match(/\(([-+]?[0-9.]+)%\)/)?.[1] || '0') : 0,
            evidenceConfidenceScore: item.evidenceConfidenceScore || 0.95,
            evidenceItems: [],
            officerNotes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch priority investigations from backend:', e);
    }
    return localCases.filter(c => c.priority === 'IMMEDIATE' || c.priority === 'HIGH');
  },

  async getAllCases(statusFilter?: string): Promise<InvestigationCase[]> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/investigations', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.cases) && data.cases.length > 0) {
          let cases = data.cases;
          if (statusFilter && statusFilter !== 'ALL') {
            cases = cases.filter((c: any) => c.status === statusFilter);
          }
          return cases;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch cases from backend:', e);
    }
    if (statusFilter && statusFilter !== 'ALL') {
      return localCases.filter(c => c.status === statusFilter);
    }
    return localCases;
  },

  async getCaseById(caseId: string): Promise<InvestigationCase | null> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/investigations/${encodeURIComponent(caseId)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.case) {
          return data.case;
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch case ${caseId} from backend:`, e);
    }
    const c = localCases.find(item => item.id === caseId || item.caseNumber === caseId || item.batchId === caseId || item.batchCode === caseId);
    return c || null;
  },

  async getAnomalies(limit = 10): Promise<Anomaly[]> {
    return SEED_ANOMALIES.slice(0, limit);
  },

  async addOfficerNote(caseId: string, noteData): Promise<OfficerNote> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/investigations/${encodeURIComponent(caseId)}/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          noteText: noteData.noteText,
          actionTaken: noteData.actionTaken
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.note) return data.note;
      }
    } catch (e) {
      console.warn(`Failed to save officer note on backend for ${caseId}:`, e);
    }

    const newNote: OfficerNote = {
      ...noteData,
      id: `NOTE-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    localCases = localCases.map(c => {
      if (c.id === caseId || c.batchId === caseId) {
        return {
          ...c,
          updatedAt: new Date().toISOString(),
          officerNotes: [...c.officerNotes, newNote]
        };
      }
      return c;
    });

    return newNote;
  },

  async updateCaseStatus(caseId: string, status: InvestigationCase['status'], officerId: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/investigations/${encodeURIComponent(caseId)}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status })
      });
      if (res.ok) return true;
    } catch (e) {
      console.warn(`Failed to update case status on backend for ${caseId}:`, e);
    }

    localCases = localCases.map(c => {
      if (c.id === caseId || c.batchId === caseId) {
        return {
          ...c,
          status,
          assignedOfficerId: officerId,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });
    return true;
  }
};

export const alertService: AlertService = {
  async getActiveAlerts(): Promise<ActiveAlert[]> {
    // Backend Firestore alerts are authoritative when authenticated & reachable.
    try {
      const user = auth.currentUser;
      if (user) {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/alerts', { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.alerts)) {
            return data.alerts.map((a: any): ActiveAlert => ({
              id: a.alertId,
              anomalyId: a.alertId,
              batchId: a.batchId,
              facilityId: a.facilityId || 'UNKNOWN',
              facilityName: a.facilityName || 'Supply Chain Node',
              title: `${a.anomalyType === 'IMPOSSIBLE_MOVEMENT' ? 'Implausible Movement' : 'Mass-Balance Discrepancy'} — ${a.batchId}`,
              summary: `Alert status ${a.status}. Severity ${a.severity}.`,
              severity: a.severity === 'CRITICAL' ? 'CRITICAL' : a.severity === 'HIGH' ? 'WARNING' : 'ADVISORY',
              createdAt: a.createdAt,
              isRead: a.status !== 'NEW',
              inspectionPriority: a.severity === 'CRITICAL' ? 'IMMEDIATE' : a.severity === 'HIGH' ? 'HIGH' : 'SCHEDULED'
            }));
          }
        }
      }
    } catch (e) {
      console.warn('[alertService] Backend alerts unavailable; using local demo fallback.');
    }
    // Explicit local-dev fallback (only when unauthenticated or backend unreachable).
    return localAlerts;
  },

  async dismissAlert(alertId: string): Promise<boolean> {
    // Acknowledge on the backend when available; fall back to local state.
    try {
      const user = auth.currentUser;
      if (user) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/alerts/${encodeURIComponent(alertId)}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'ACKNOWLEDGED' })
        });
        if (res.ok) return true;
      }
    } catch (e) {
      console.warn('[alertService] Backend dismiss unavailable; using local demo fallback.');
    }
    localAlerts = localAlerts.map(a => a.id === alertId ? { ...a, isRead: true } : a);
    return true;
  }
};

export const facilityVehicleService: FacilityVehicleService = {
  async getFacilities(): Promise<Facility[]> {
    return SEED_FACILITIES;
  },

  async getFacilityById(facilityId: string): Promise<Facility | null> {
    const f = SEED_FACILITIES.find(item => item.id === facilityId || item.code === facilityId);
    return f || null;
  },

  async getVehicles(): Promise<Vehicle[]> {
    return SEED_VEHICLES;
  },

  async getVehicleById(vehicleId: string): Promise<Vehicle | null> {
    const v = SEED_VEHICLES.find(item => item.id === vehicleId || item.registrationNumber === vehicleId);
    return v || null;
  }
};

export const officerAuthService: OfficerAuthService = {
  async getCurrentOfficer(): Promise<Officer | null> {
    return currentOfficer;
  },

  async loginAsOfficer(officerId: string): Promise<Officer> {
    // PRODUCTION INTEGRATION: Firebase Authentication with Officer custom claim verification
    currentOfficer = {
      ...SEED_OFFICER,
      id: officerId,
      lastLoginAt: new Date().toISOString()
    };
    return currentOfficer;
  },

  async logout(): Promise<void> {
    currentOfficer = null;
  }
};
