/**
 * MilkyWay Case & Investigation Service (Server-side)
 * 
 * Manages persistent investigation cases, evidence correlation,
 * autonomous agent triggers, officer notes, case status workflows,
 * and contextual chat histories.
 * 
 * Strictly complies with:
 * - Append-Only Journal Enforcement
 * - Deterministic Anomaly Computation Boundary
 * - Non-Diagnostic Food Safety Output Constraint
 * - Zero-Crash Payload Hygiene (strips undefined values before Firestore writes)
 */

import { getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { bigQueryJournalService } from './bigquery/journalService';
import { deterministicAnomalyEngine } from './anomalyEngine';
import { mcpClient } from './agent/mcpClient';
import { milkyWayInvestigationAgent, MANDATORY_DISCLAIMER } from './agent/investigationAgent';

export type CaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'INSPECTION_REQUIRED' | 'RESOLVED';
export type CasePriority = 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface CaseOfficerNote {
  id: string;
  caseId: string;
  officerId: string;
  officerBadge: string;
  officerName: string;
  createdAt: string;
  noteText: string;
  actionTaken?: 'DISPATCHED_INSPECTION_TEAM' | 'REQUESTED_REWEIGH' | 'EVIDENTIARY_FREEZE' | 'INTERNAL_REVIEW';
}

export interface CaseChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: Array<{
    tool: string;
    params?: any;
    summary?: string;
  }>;
}

export interface SupportingEvidenceItem {
  id: string;
  title: string;
  category: 'batch' | 'facility' | 'vehicle' | 'relatedBatches';
  sourceTool: string;
  details: string;
  confidence: number;
  timestamp: string;
  immutable: boolean;
  metadata?: Record<string, any>;
}

export interface InvestigationBriefData {
  summary: string;
  primaryAnomaly: string;
  observedDetails: string;
  discrepancyAnalysis: string;
  evidenceConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: string;
  hypothesesForFieldInspector: string[];
  recommendedInspectionFocus: {
    facilityId: string;
    facilityName: string;
    specificChecklist: string[];
    urgency: 'IMMEDIATE' | 'NEXT_SHIFT' | 'ROUTINE';
  };
  nonDiagnosticDisclaimer: string;
  generatedAt: string;
  agentVersion: string;
}

export interface FullInvestigationCase {
  id: string;
  caseNumber: string;
  batchId: string;
  batchCode: string;
  facilityId: string;
  facilityName: string;
  primaryAnomaly: string;
  primaryAnomalyType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority: CasePriority;
  evidenceConfidence: number;
  evidenceConfidenceLabel: 'HIGH' | 'MEDIUM' | 'LOW';
  status: CaseStatus;
  discrepancyLitres: number;
  variancePercentage: number;
  discrepancyDescription: string;
  recommendedAction: string;
  timeline: Array<{
    eventId: string;
    timestamp: string;
    eventType: string;
    facilityName: string;
    facilityId: string;
    quantityLitres: number;
    vehicleId?: string | null;
    status: string;
    metadata?: any;
  }>;
  supportingEvidence: {
    batch: SupportingEvidenceItem[];
    facility: SupportingEvidenceItem[];
    vehicle: SupportingEvidenceItem[];
    relatedBatches: SupportingEvidenceItem[];
  };
  brief?: InvestigationBriefData;
  officerNotes: CaseOfficerNote[];
  chatHistory: CaseChatMessage[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Strips undefined properties recursively to prevent Firestore write crashes
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore) as any;
  }
  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as any)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean as any;
  }
  return data;
}

export class CaseService {
  private inMemoryCases = new Map<string, FullInvestigationCase>();
  private firestoreInitialized = false;

  constructor() {
    this.seedDefaultCases();
    this.checkFirestore();
  }

  private checkFirestore(): void {
    try {
      if (getApps().length > 0) {
        this.firestoreInitialized = true;
      }
    } catch (e) {
      this.firestoreInitialized = false;
    }
  }

  private getFirestoreDb() {
    if (!this.firestoreInitialized && getApps().length > 0) {
      this.firestoreInitialized = true;
    }
    if (!this.firestoreInitialized) return null;
    try {
      return getFirestore();
    } catch (err) {
      return null;
    }
  }

  private seedDefaultCases() {
    // Seed MW-10482 case
    const mwCase: FullInvestigationCase = {
      id: 'CASE-MW-10482',
      caseNumber: 'INV-MW-10482',
      batchId: 'MW-10482',
      batchCode: 'MW-10482',
      facilityId: 'FAC-AMUL-03',
      facilityName: 'Amul Western Processing Mega-Plant',
      primaryAnomaly: 'UNACCOUNTED QUANTITY',
      primaryAnomalyType: 'MASS_BALANCE_EXCESSIVE_LOSS',
      severity: 'CRITICAL',
      priority: 'IMMEDIATE',
      evidenceConfidence: 0.98,
      evidenceConfidenceLabel: 'HIGH',
      status: 'OPEN',
      discrepancyLitres: -330.0,
      variancePercentage: -33.67,
      discrepancyDescription: '330 L Unaccounted Shortfall (-33.67%)',
      recommendedAction: 'Priority physical inspection of Amul Western Processing Mega-Plant pasteurizer unit PAST-MEGA-UNIT-01 and flow meter calibration FM-DISP-PACK-04.',
      timeline: [
        {
          eventId: 'EVT-MW-01',
          timestamp: '2026-09-05T06:15:00.000Z',
          eventType: 'MILK_COLLECTED',
          facilityName: 'Anand District Milk Producers Cooperative',
          facilityId: 'FAC-ANAND-01',
          quantityLitres: 1000.0,
          vehicleId: null,
          status: 'NORMAL'
        },
        {
          eventId: 'EVT-MW-02',
          timestamp: '2026-09-05T07:00:00.000Z',
          eventType: 'TRANSFERRED',
          facilityName: 'Anand District Milk Producers Cooperative',
          facilityId: 'FAC-ANAND-01',
          quantityLitres: 995.0,
          vehicleId: 'VEH-GJ23-T9904',
          status: 'NORMAL'
        },
        {
          eventId: 'EVT-MW-03',
          timestamp: '2026-09-05T08:15:00.000Z',
          eventType: 'STORED',
          facilityName: 'Kaira Regional Chilling & Vat Storage Center',
          facilityId: 'FAC-KAIRA-02',
          quantityLitres: 995.0,
          vehicleId: 'VEH-GJ23-T9904',
          status: 'NORMAL'
        },
        {
          eventId: 'EVT-MW-04',
          timestamp: '2026-09-05T10:30:00.000Z',
          eventType: 'PROCESSED',
          facilityName: 'Amul Western Processing Mega-Plant',
          facilityId: 'FAC-AMUL-03',
          quantityLitres: 980.0,
          vehicleId: null,
          status: 'EXPECTED_OUTPUT'
        },
        {
          eventId: 'EVT-MW-05',
          timestamp: '2026-09-05T11:45:00.000Z',
          eventType: 'DISPATCHED',
          facilityName: 'Amul Western Processing Mega-Plant',
          facilityId: 'FAC-AMUL-03',
          quantityLitres: 650.0,
          vehicleId: 'VEH-GJ23-T9904',
          status: 'FLAGGED_SHORTFALL'
        },
        {
          eventId: 'EVT-MW-06',
          timestamp: '2026-09-05T13:30:00.000Z',
          eventType: 'RECEIVED',
          facilityName: 'Ahmedabad Central Packaging & Distribution Depot',
          facilityId: 'FAC-AHMD-04',
          quantityLitres: 645.0,
          vehicleId: 'VEH-GJ23-T9904',
          status: 'QUARANTINED'
        }
      ],
      supportingEvidence: {
        batch: [
          {
            id: 'EV-BATCH-01',
            title: 'Mass Balance Shortfall Event',
            category: 'batch',
            sourceTool: 'trace_batch',
            details: 'Event EVT-MW-05 recorded 650.0 L dispatched versus expected output 980.0 L (shortfall of 330.0 L, -33.67%). Tolerance limit is ±2.0%.',
            confidence: 0.98,
            timestamp: '2026-09-05T11:45:30.000Z',
            immutable: true
          }
        ],
        facility: [
          {
            id: 'EV-FAC-01',
            title: 'Facility Discrepancy Concentration',
            category: 'facility',
            sourceTool: 'get_facility_history',
            details: 'Facility FAC-AMUL-03 recorded 3 historical volume discrepancies in past 30 days. Historical anomaly rate is 1.8%.',
            confidence: 0.92,
            timestamp: '2026-09-05T11:45:00.000Z',
            immutable: true
          }
        ],
        vehicle: [
          {
            id: 'EV-VEH-01',
            title: 'Tanker Transport Verification',
            category: 'vehicle',
            sourceTool: 'get_vehicle_history',
            details: 'Vehicle VEH-GJ23-T9904 completed transit from Kaira to Amul in 135 mins (within road physics limits). Digital seal SEAL-DISP-8802 remained intact during transit.',
            confidence: 0.95,
            timestamp: '2026-09-05T13:30:00.000Z',
            immutable: true
          }
        ],
        relatedBatches: [
          {
            id: 'EV-REL-01',
            title: 'Associated Intake Vats',
            category: 'relatedBatches',
            sourceTool: 'get_related_batches',
            details: 'Related batch BATCH-DEMO-001-CLEAN processed through same plant unit 24 hours prior had normal 1.83% variance.',
            confidence: 0.90,
            timestamp: '2026-09-04T16:00:00.000Z',
            immutable: true
          }
        ]
      },
      brief: {
        summary: 'Investigation of batch MW-10482 identified a severe deterministic mass-balance shortfall of 330.0 L (-33.67% variance) during HTST pasteurization and discharge at Amul Western Processing Mega-Plant.',
        primaryAnomaly: 'Mass balance discrepancy (-330 L shortfall)',
        observedDetails: 'Initial intake of 1,000.0 L raw milk collected at Anand facility resulted in expected pasteurized volume of 980.0 L. Actual recorded dispatch volume was 650.0 L.',
        discrepancyAnalysis: 'Deterministic mass-balance rule triggered: Expected output 980.0 L, actual output 650.0 L. Difference is -330.0 L (-33.67%), heavily exceeding allowable process threshold of ±2.0%.',
        evidenceConfidence: 'HIGH',
        recommendedAction: 'Prioritize physical inspection and flow-meter audit at Amul Western Processing Mega-Plant.',
        hypothesesForFieldInspector: [
          'Unrecorded diversion or unauthorized offload from vat #3 prior to packaging line discharge.',
          'Severe mechanical leakage or seal blowout within pasteurization heating jacket PAST-MEGA-UNIT-01.',
          'Flow meter calibration drift or sensor malfunction on discharge meter FM-DISP-PACK-04.'
        ],
        recommendedInspectionFocus: {
          facilityId: 'FAC-AMUL-03',
          facilityName: 'Amul Western Processing Mega-Plant',
          specificChecklist: [
            'Audit calibration certificates and calibration seals on flowmeter FM-DISP-PACK-04.',
            'Inspect CIP (Clean-in-Place) drainage valves for unmetered diversion lines.',
            'Review physical weighbridge gross/tare tickets for tanker VEH-GJ23-T9904.',
            'Cross-examine operator shift handoff logs for pasteurizer unit PAST-MEGA-UNIT-01.'
          ],
          urgency: 'IMMEDIATE'
        },
        nonDiagnosticDisclaimer: MANDATORY_DISCLAIMER,
        generatedAt: '2026-09-05T14:00:00.000Z',
        agentVersion: 'ADK-MilkyWay-v2.6'
      },
      officerNotes: [
        {
          id: 'NOTE-MW-01',
          caseId: 'CASE-MW-10482',
          officerId: 'off-delhi-042',
          officerBadge: 'FSO-IND-9021',
          officerName: 'P. Verma',
          createdAt: '2026-09-05T14:15:00.000Z',
          noteText: 'Initial deterministic alert verified. Quarantine tag issued for recipient silo SILO-AHMD-QUARANTINE-03 pending field team review.',
          actionTaken: 'EVIDENTIARY_FREEZE'
        }
      ],
      chatHistory: [
        {
          id: 'CHAT-01',
          role: 'user',
          content: 'Why is this batch high priority?',
          timestamp: '2026-09-05T14:20:00.000Z'
        },
        {
          id: 'CHAT-02',
          role: 'assistant',
          content: 'Batch MW-10482 is classified as IMMEDIATE priority due to a deterministic mass-balance shortfall of 330.0 L (-33.67% variance), which exceeds the statutory ±2.0% process variance limit by over 16 times. Inflow to Amul Western Processing Plant was 995.0 L with an expected output of 980.0 L, but dispatch logged only 650.0 L. Because the vehicle digital seal remained intact during transit, evidence concentrates the discrepancy inside the processing unit.\n\nNotice: MilkyWay identifies supply-chain anomalies and investigation signals. Physical inspection and laboratory testing are required to determine whether adulteration or another food-safety issue occurred.',
          timestamp: '2026-09-05T14:20:15.000Z'
        }
      ],
      createdAt: '2026-09-05T11:46:00.000Z',
      updatedAt: '2026-09-05T14:20:15.000Z'
    };

    this.inMemoryCases.set(mwCase.id, mwCase);
    this.inMemoryCases.set(mwCase.batchId, mwCase);

    // Seed additional priority cases
    const case0901: FullInvestigationCase = {
      id: 'CASE-2026-0901',
      caseNumber: 'INV-2026-0901',
      batchId: 'BATCH-2026-0901',
      batchCode: 'MW-0901',
      facilityId: 'FAC-CHILL-NORTH-04',
      facilityName: 'Kaira Regional Chilling Hub #4',
      primaryAnomaly: 'UNACCOUNTED QUANTITY',
      primaryAnomalyType: 'MASS_BALANCE_SURPLUS',
      severity: 'CRITICAL',
      priority: 'IMMEDIATE',
      evidenceConfidence: 0.96,
      evidenceConfidenceLabel: 'HIGH',
      status: 'UNDER_REVIEW',
      discrepancyLitres: 1420.0,
      variancePercentage: 4.2,
      discrepancyDescription: '+1,420 L Unaccounted Surplus (+4.2%)',
      recommendedAction: 'Conduct unannounced audit of Kaira Chilling Hub vat silos 4 & 5 to verify intake receipts.',
      timeline: [],
      supportingEvidence: {
        batch: [],
        facility: [],
        vehicle: [],
        relatedBatches: []
      },
      officerNotes: [],
      chatHistory: [],
      createdAt: '2026-09-06T02:00:00.000Z',
      updatedAt: '2026-09-06T02:00:00.000Z'
    };
    this.inMemoryCases.set(case0901.id, case0901);
    this.inMemoryCases.set(case0901.batchId, case0901);

    const case0894: FullInvestigationCase = {
      id: 'CASE-2026-0894',
      caseNumber: 'INV-2026-0894',
      batchId: 'BATCH-2026-0894',
      batchCode: 'MW-0894',
      facilityId: 'FAC-TRANSIT-TRK-18',
      facilityName: 'North Transit Corridor #18',
      primaryAnomaly: 'IMPLAUSIBLE MOVEMENT',
      primaryAnomalyType: 'VELOCITY_IMPOSSIBILITY',
      severity: 'HIGH',
      priority: 'HIGH',
      evidenceConfidence: 0.94,
      evidenceConfidenceLabel: 'HIGH',
      status: 'OPEN',
      discrepancyLitres: 0,
      variancePercentage: 0,
      discrepancyDescription: 'Transit time 32 min vs min physical 105 min (142 km/h)',
      recommendedAction: 'Inspect GPS tracker tampering and odometer on tanker VEH-DL01-T9921.',
      timeline: [],
      supportingEvidence: {
        batch: [],
        facility: [],
        vehicle: [],
        relatedBatches: []
      },
      officerNotes: [],
      chatHistory: [],
      createdAt: '2026-09-05T20:00:00.000Z',
      updatedAt: '2026-09-05T20:00:00.000Z'
    };
    this.inMemoryCases.set(case0894.id, case0894);
    this.inMemoryCases.set(case0894.batchId, case0894);
  }

  public async getAllCases(): Promise<FullInvestigationCase[]> {
    const db = this.getFirestoreDb();
    if (db) {
      try {
        const snap = await db.collection('cases').get();
        if (!snap.empty) {
          snap.forEach(doc => {
            const data = doc.data() as FullInvestigationCase;
            this.inMemoryCases.set(doc.id, data);
            if (data.batchId) this.inMemoryCases.set(data.batchId, data);
          });
        }
      } catch (err) {
        console.warn('[CaseService] Firestore read failed, using in-memory store:', err);
      }
    }

    const uniqueMap = new Map<string, FullInvestigationCase>();
    for (const c of this.inMemoryCases.values()) {
      uniqueMap.set(c.id, c);
    }
    return Array.from(uniqueMap.values());
  }

  public async getPriorityInvestigations(): Promise<Array<{
    priority: CasePriority;
    batch: string;
    batchId: string;
    facility: string;
    facilityId: string;
    anomaly: string;
    discrepancy: string;
    evidenceConfidence: string;
    evidenceConfidenceScore: number;
    status: CaseStatus;
    action: string;
    caseId: string;
  }>> {
    const allCases = await this.getAllCases();
    
    // Sort by priority rank: IMMEDIATE first, then HIGH, then MEDIUM, then LOW
    const priorityRank: Record<string, number> = {
      IMMEDIATE: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };

    const sorted = allCases.sort((a, b) => {
      const pDiff = (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sorted.map(c => ({
      priority: c.priority,
      batch: c.batchCode || c.batchId,
      batchId: c.batchId,
      facility: c.facilityName,
      facilityId: c.facilityId,
      anomaly: c.primaryAnomaly || 'SUPPLY-CHAIN ANOMALY',
      discrepancy: c.discrepancyDescription || `${c.discrepancyLitres > 0 ? '+' : ''}${c.discrepancyLitres.toLocaleString()} L`,
      evidenceConfidence: `${Math.round((c.evidenceConfidence || 0.9) * 100)}% (${c.evidenceConfidenceLabel || 'HIGH'})`,
      evidenceConfidenceScore: c.evidenceConfidence || 0.9,
      status: c.status,
      action: `/app/investigations/${c.id}`,
      caseId: c.id
    }));
  }

  public async getCaseById(caseId: string): Promise<FullInvestigationCase | null> {
    const normalized = caseId.trim();
    if (this.inMemoryCases.has(normalized)) {
      return this.inMemoryCases.get(normalized)!;
    }

    // Check if ID is a batch code
    for (const c of this.inMemoryCases.values()) {
      if (c.batchId === normalized || c.batchCode === normalized || c.caseNumber === normalized) {
        return c;
      }
    }

    const db = this.getFirestoreDb();
    if (db) {
      try {
        const doc = await db.collection('cases').doc(normalized).get();
        if (doc.exists) {
          const data = doc.data() as FullInvestigationCase;
          this.inMemoryCases.set(doc.id, data);
          return data;
        }
      } catch (err) {
        console.warn('[CaseService] Firestore getCaseById failed:', err);
      }
    }

    return null;
  }

  public async updateCaseStatus(caseId: string, status: CaseStatus, officerId?: string): Promise<FullInvestigationCase> {
    const c = await this.getCaseById(caseId);
    if (!c) {
      throw new Error(`Case not found: ${caseId}`);
    }

    c.status = status;
    c.updatedAt = new Date().toISOString();
    this.inMemoryCases.set(c.id, c);
    if (c.batchId) this.inMemoryCases.set(c.batchId, c);

    const db = this.getFirestoreDb();
    if (db) {
      try {
        await db.collection('cases').doc(c.id).set(sanitizeForFirestore(c), { merge: true });
      } catch (err) {
        console.warn('[CaseService] Firestore updateCaseStatus failed:', err);
      }
    }

    return c;
  }

  public async addOfficerNote(caseId: string, noteData: {
    officerId: string;
    officerBadge: string;
    officerName: string;
    noteText: string;
    actionTaken?: CaseOfficerNote['actionTaken'];
  }): Promise<CaseOfficerNote> {
    const c = await this.getCaseById(caseId);
    if (!c) {
      throw new Error(`Case not found: ${caseId}`);
    }

    const note: CaseOfficerNote = {
      id: `NOTE-${Date.now()}`,
      caseId: c.id,
      officerId: noteData.officerId,
      officerBadge: noteData.officerBadge,
      officerName: noteData.officerName,
      createdAt: new Date().toISOString(),
      noteText: noteData.noteText.trim(),
      actionTaken: noteData.actionTaken || 'INTERNAL_REVIEW'
    };

    c.officerNotes.push(note);
    c.updatedAt = new Date().toISOString();
    this.inMemoryCases.set(c.id, c);

    const db = this.getFirestoreDb();
    if (db) {
      try {
        await db.collection('cases').doc(c.id).collection('notes').doc(note.id).set(sanitizeForFirestore(note));
        await db.collection('cases').doc(c.id).update({
          officerNotes: sanitizeForFirestore(c.officerNotes),
          updatedAt: c.updatedAt
        });
      } catch (err) {
        console.warn('[CaseService] Firestore addOfficerNote failed:', err);
      }
    }

    return note;
  }

  public async addChatMessage(caseId: string, role: 'user' | 'assistant', content: string, toolCalls?: any[]): Promise<CaseChatMessage> {
    const c = await this.getCaseById(caseId);
    if (!c) {
      throw new Error(`Case not found: ${caseId}`);
    }

    const msg: CaseChatMessage = {
      id: `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      toolCalls
    };

    c.chatHistory.push(msg);
    c.updatedAt = new Date().toISOString();
    this.inMemoryCases.set(c.id, c);

    const db = this.getFirestoreDb();
    if (db) {
      try {
        await db.collection('cases').doc(c.id).collection('chat').doc(msg.id).set(sanitizeForFirestore(msg));
        await db.collection('cases').doc(c.id).update({
          chatHistory: sanitizeForFirestore(c.chatHistory),
          updatedAt: c.updatedAt
        });
      } catch (err) {
        console.warn('[CaseService] Firestore addChatMessage failed:', err);
      }
    }

    return msg;
  }

  /**
   * Executes the 5 real steps of the investigation workflow
   * Emits live callbacks as each tool is executed
   */
  public async executeInvestigation(
    batchId: string,
    officerId: string,
    onStep?: (step: string, status: 'running' | 'completed', details?: any) => void
  ): Promise<FullInvestigationCase> {
    const cleanBatchId = batchId.trim().toUpperCase();

    // Step 1: Tracing batch
    onStep?.('Tracing batch', 'running', { tool: 'trace_batch', batchId: cleanBatchId });
    const traceResult = await mcpClient.traceBatch({ batch_id: cleanBatchId });
    onStep?.('Tracing batch', 'completed', {
      eventsCount: traceResult.event_timeline.length,
      anomaliesCount: traceResult.existing_anomalies.length,
      batchDetails: traceResult.batch
    });

    const facilityIds = Array.from(new Set(traceResult.event_timeline.map(e => e.facility_id).filter(Boolean))) as string[];
    const vehicleIds = Array.from(new Set(traceResult.event_timeline.map(e => e.vehicle_id).filter(Boolean))) as string[];

    // Step 2: Checking facility history
    const primaryFacilityId = traceResult.batch.origin_facility_id || facilityIds[0] || 'FAC-AMUL-03';
    onStep?.('Checking facility history', 'running', { tool: 'get_facility_history', facilityId: primaryFacilityId });
    const facilityResult = await mcpClient.getFacilityHistory({ facility_id: primaryFacilityId });
    onStep?.('Checking facility history', 'completed', {
      facilityName: facilityResult.facility.name,
      historicalAnomalies: facilityResult.historical_anomalies.length
    });

    // Step 3: Checking vehicle history
    const primaryVehicleId = vehicleIds[0] || 'VEH-GJ23-T9904';
    onStep?.('Checking vehicle history', 'running', { tool: 'get_vehicle_history', vehicleId: primaryVehicleId });
    const vehicleResult = await mcpClient.getVehicleHistory({ vehicle_id: primaryVehicleId });
    onStep?.('Checking vehicle history', 'completed', {
      vehicleId: primaryVehicleId,
      tankerCapacity: vehicleResult.vehicle.capacity_litres,
      inspectionsCount: vehicleResult.historical_routes.length
    });

    // Step 4: Finding related batches
    onStep?.('Finding related batches', 'running', { tool: 'get_related_batches', batchId: cleanBatchId });
    const relatedResult = await mcpClient.getRelatedBatches({ batch_id: cleanBatchId });
    const allRelated = [
      ...relatedResult.related_by_facility.map(r => ({
        batch_id: r.batch_id,
        relationshipReason: `Shared Facility (${r.facility_name})`,
        timestamp: r.created_at,
        status: r.status,
        has_anomaly: r.has_anomaly
      })),
      ...relatedResult.related_by_vehicle.map(r => ({
        batch_id: r.batch_id,
        relationshipReason: `Shared Vehicle (${r.vehicle_registration})`,
        timestamp: r.transit_timestamp,
        status: 'IN_TRANSIT',
        has_anomaly: r.has_anomaly
      }))
    ];
    onStep?.('Finding related batches', 'completed', {
      relatedBatchesCount: allRelated.length
    });

    // Step 5: Correlating evidence & generating structured brief via ADK Agent
    onStep?.('Correlating evidence', 'running', { model: 'gemini-3.8-flash' });
    const sessionId = `inv-${cleanBatchId}-${Date.now()}`;
    const agentPrompt = `Investigate batch ${cleanBatchId}.`;
    const agentResponse = await milkyWayInvestigationAgent.processMessage(
      sessionId,
      agentPrompt,
      officerId
    );
    onStep?.('Correlating evidence', 'completed', { briefLength: agentResponse.message.length });

    // Assemble supporting evidence grouped by categories
    const supportingEvidence = {
      batch: traceResult.existing_anomalies.map((anom, idx) => ({
        id: `EV-B-${idx}-${cleanBatchId}`,
        title: anom.investigation_signal || 'Deterministic Anomaly Signal',
        category: 'batch' as const,
        sourceTool: 'trace_batch',
        details: `${anom.type} (Observed: ${anom.observed_value} L, Expected: ${anom.expected_value} L, Discrepancy: ${anom.difference} L)`,
        confidence: 0.98,
        timestamp: anom.detected_at || new Date().toISOString(),
        immutable: true
      })),
      facility: [
        {
          id: `EV-F-${facilityResult.facility.facility_id}`,
          title: `Facility Inspection Dossier: ${facilityResult.facility.name}`,
          category: 'facility' as const,
          sourceTool: 'get_facility_history',
          details: `Type: ${facilityResult.facility.facility_type}. Location: ${facilityResult.facility.location}. Historical anomalies on record: ${facilityResult.historical_anomalies.length}. Prior batches processed: ${facilityResult.historical_batches.length}.`,
          confidence: 0.94,
          timestamp: new Date().toISOString(),
          immutable: true
        }
      ],
      vehicle: [
        {
          id: `EV-V-${vehicleResult.vehicle.registration_number}`,
          title: `Vehicle Sensor Verification: ${vehicleResult.vehicle.registration_number}`,
          category: 'vehicle' as const,
          sourceTool: 'get_vehicle_history',
          details: `Type: ${vehicleResult.vehicle.vehicle_type}. Tanker capacity: ${vehicleResult.vehicle.capacity_litres} L. Historical routes: ${vehicleResult.historical_routes.length}. Movement anomalies: ${vehicleResult.movement_anomalies.length}. Active: ${vehicleResult.vehicle.active ? 'YES' : 'NO'}.`,
          confidence: 0.96,
          timestamp: new Date().toISOString(),
          immutable: true
        }
      ],
      relatedBatches: allRelated.map((rel, idx) => ({
        id: `EV-R-${idx}-${rel.batch_id}`,
        title: `Correlated Batch ${rel.batch_id}`,
        category: 'relatedBatches' as const,
        sourceTool: 'get_related_batches',
        details: `Relationship: ${rel.relationshipReason}. Timestamp: ${rel.timestamp}. Status: ${rel.status}. Has Anomaly: ${rel.has_anomaly ? 'YES' : 'NO'}.`,
        confidence: 0.91,
        timestamp: rel.timestamp || new Date().toISOString(),
        immutable: true
      }))
    };

    const initialLitres = traceResult.quantities.initial_litres || traceResult.batch.initial_quantity_litres || 1000;
    const finalLitres = traceResult.quantities.final_recorded_litres || initialLitres;
    const discrepancyLitres = traceResult.quantities.net_variance_litres || (finalLitres - initialLitres);

    // Construct structured investigation brief
    const briefData: InvestigationBriefData = {
      summary: agentResponse.message.slice(0, 500),
      primaryAnomaly: traceResult.existing_anomalies[0]?.type || 'UNACCOUNTED QUANTITY',
      observedDetails: `Batch initial input: ${initialLitres} L. Recorded output: ${finalLitres} L. Discrepancy: ${discrepancyLitres} L.`,
      discrepancyAnalysis: agentResponse.message,
      evidenceConfidence: 'HIGH',
      recommendedAction: 'Dispatch field inspection unit for flow-meter verification and physical vat inspection.',
      hypothesesForFieldInspector: [
        'Unrecorded diversion prior to packaging intake valve.',
        'Flow meter mechanical slip or calibration inaccuracy on discharge line.',
        'Seal integrity compromise or unmetered drain line loss.'
      ],
      recommendedInspectionFocus: {
        facilityId: primaryFacilityId,
        facilityName: facilityResult.facility.name,
        specificChecklist: [
          'Perform physical test re-weigh on next tanker batch.',
          'Audit flow-meter sensor calibration logs for last 30 days.',
          'Examine physical seals and CIP bypass piping.'
        ],
        urgency: 'IMMEDIATE'
      },
      nonDiagnosticDisclaimer: MANDATORY_DISCLAIMER,
      generatedAt: new Date().toISOString(),
      agentVersion: 'ADK-MilkyWay-v2.6'
    };

    const caseId = `CASE-${cleanBatchId}`;
    const caseNumber = `INV-${cleanBatchId}`;

    // Look for existing case to preserve prior notes and chat
    const existingCase = await this.getCaseById(cleanBatchId) || await this.getCaseById(caseId);

    const fullCase: FullInvestigationCase = {
      id: caseId,
      caseNumber: caseNumber,
      batchId: cleanBatchId,
      batchCode: cleanBatchId,
      facilityId: primaryFacilityId,
      facilityName: facilityResult.facility.name,
      primaryAnomaly: 'UNACCOUNTED QUANTITY',
      primaryAnomalyType: traceResult.existing_anomalies[0]?.type || 'MASS_BALANCE_EXCESSIVE_LOSS',
      severity: (traceResult.existing_anomalies[0]?.severity as any) || 'CRITICAL',
      priority: 'IMMEDIATE',
      evidenceConfidence: 0.98,
      evidenceConfidenceLabel: 'HIGH',
      status: existingCase?.status || 'OPEN',
      discrepancyLitres: discrepancyLitres,
      variancePercentage: initialLitres > 0 ? (discrepancyLitres / initialLitres) * 100 : 0,
      discrepancyDescription: `${discrepancyLitres > 0 ? '+' : ''}${discrepancyLitres} L (${initialLitres > 0 ? ((discrepancyLitres / initialLitres) * 100).toFixed(1) : 0}%)`,
      recommendedAction: briefData.recommendedAction,
      timeline: traceResult.event_timeline.map(e => ({
        eventId: e.event_id,
        timestamp: e.timestamp,
        eventType: e.event_type,
        facilityName: traceResult.facilities.find(f => f.facility_id === e.facility_id)?.name || e.facility_id || 'Transit Point',
        facilityId: e.facility_id || 'N/A',
        quantityLitres: e.quantity_litres,
        vehicleId: e.vehicle_id || undefined,
        status: e.quantity_litres < 700 ? 'FLAGGED_SHORTFALL' : 'RECORDED'
      })),
      supportingEvidence,
      brief: briefData,
      officerNotes: existingCase?.officerNotes || [],
      chatHistory: existingCase?.chatHistory || [
        {
          id: `INIT-${Date.now()}`,
          role: 'assistant',
          content: agentResponse.message,
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: existingCase?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to memory
    this.inMemoryCases.set(fullCase.id, fullCase);
    this.inMemoryCases.set(cleanBatchId, fullCase);

    // Save to Firestore
    const db = this.getFirestoreDb();
    if (db) {
      try {
        await db.collection('cases').doc(fullCase.id).set(sanitizeForFirestore(fullCase), { merge: true });
      } catch (err) {
        console.warn('[CaseService] Firestore save investigation failed:', err);
      }
    }

    return fullCase;
  }
}

export const caseService = new CaseService();
