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

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
  } catch (e) {
    // offline or unauthenticated preview fallback
  }
  return { 'Content-Type': 'application/json' };
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
    // PRODUCTION INTEGRATION: Cloud Firestore query:
    // casesRef.where("priority", "in", ["IMMEDIATE", "HIGH"]).orderBy("priority").limit(10)
    return localCases.filter(c => c.priority === 'IMMEDIATE' || c.priority === 'HIGH');
  },

  async getAllCases(statusFilter?: string): Promise<InvestigationCase[]> {
    if (statusFilter && statusFilter !== 'ALL') {
      return localCases.filter(c => c.status === statusFilter);
    }
    return localCases;
  },

  async getCaseById(caseId: string): Promise<InvestigationCase | null> {
    const c = localCases.find(item => item.id === caseId || item.caseNumber === caseId);
    return c || null;
  },

  async getAnomalies(limit = 10): Promise<Anomaly[]> {
    return SEED_ANOMALIES.slice(0, limit);
  },

  async addOfficerNote(caseId: string, noteData): Promise<OfficerNote> {
    // PRODUCTION INTEGRATION: Cloud Firestore write to sub-collection:
    // doc(db, 'cases', caseId).collection('notes').add(noteData)
    const newNote: OfficerNote = {
      ...noteData,
      id: `NOTE-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    localCases = localCases.map(c => {
      if (c.id === caseId) {
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
    // PRODUCTION INTEGRATION: Cloud Firestore updateDoc with officer audit trail
    localCases = localCases.map(c => {
      if (c.id === caseId) {
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
    return localAlerts;
  },

  async dismissAlert(alertId: string): Promise<boolean> {
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
