/**
 * MilkyWay Platform Data Models
 * Strict TypeScript interfaces for supply-chain entities, append-only events,
 * anomalies, and officer investigation dossiers.
 * 
 * Non-Diagnostic Food Safety Boundary:
 * MilkyWay detects unexplained supply-chain discrepancies and movement anomalies.
 * It does NOT determine whether milk is adulterated or make food-safety findings.
 */

export type UserRole = 'OFFICER' | 'ADMIN' | 'officer' | 'admin' | 'farmer' | 'auditor';

export interface FirestoreUser {
  uid: string;
  displayName: string;
  email: string;
  role: 'OFFICER' | 'ADMIN';
  createdAt: string;
  lastLoginAt: string;
  active: boolean;
  badgeNumber?: string;
  jurisdiction?: string;
  district?: string;
  department?: string;
  clearanceLevel?: 'L1_FIELD' | 'L2_ENFORCEMENT' | 'L3_DIRECTOR';
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  active?: boolean;
}

export interface Officer extends User {
  badgeNumber: string;
  jurisdiction: string;
  district: string;
  department: string;
  clearanceLevel: 'L1_FIELD' | 'L2_ENFORCEMENT' | 'L3_DIRECTOR';
  activeCaseCount: number;
}

export type FacilityType = 
  | 'COLLECTION_CENTER' 
  | 'CHILLING_HUB' 
  | 'PROCESSING_PLANT' 
  | 'PACKAGING_UNIT' 
  | 'DISTRIBUTION_DEPOT';

export interface Facility {
  id: string;
  code: string;
  name: string;
  type: FacilityType;
  district: string;
  state: string;
  gpsCoordinates: {
    lat: number;
    lng: number;
  };
  dailyCapacityLitres: number;
  currentIntakeLitres: number;
  activeBatchCount: number;
  historicalAnomalyRatePercent: number;
  status: 'OPERATIONAL' | 'INSPECTION_PENDING' | 'FLAGGED';
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  tankerCapacityLitres: number;
  temperatureSensorActive: boolean;
  gpsTrackerActive: boolean;
  currentStatus: 'IN_TRANSIT' | 'DISCHARGING' | 'IDLE' | 'MAINTENANCE';
  assignedRoute?: {
    originFacilityId: string;
    destinationFacilityId: string;
    departureTimestamp: string;
    expectedArrivalTimestamp: string;
    distanceKm: number;
    expectedTransitDurationMinutes: number;
  };
  lastPingTimestamp: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export type SupplyChainEventType = 
  | 'MILK_COLLECTED'
  | 'TRANSFERRED'
  | 'PROCESSED'
  | 'STORED'
  | 'DISPATCHED'
  | 'RECEIVED'
  | 'FARM_MILK_COLLECTION' 
  | 'CHILLING_CHECKIN' 
  | 'TANKER_DISPATCH' 
  | 'TANKER_RECEIPT' 
  | 'PROCESSING_INTAKE' 
  | 'PROCESSING_OUTPUT' 
  | 'QUALITY_METRIC_LOGGED'
  | string;

/**
 * BigQuery Append-Only Supply-Chain Event
 * Critical rule: Events are immutable. Never updated or deleted.
 */
export interface SupplyChainEvent {
  eventId: string;
  batchId: string;
  eventType: SupplyChainEventType;
  facilityId: string;
  facilityName: string;
  recordedByOfficerOrOperatorId: string;
  timestamp: string;
  quantityLitres: number;
  fatPercentage?: number;
  snfPercentage?: number; // Solids-Not-Fat
  temperatureCelsius?: number;
  vehicleId?: string;
  gpsCoordinates?: {
    lat: number;
    lng: number;
  };
  cryptographicHash: string; // SHA-256 integrity digest of the event payload
  previousEventHash: string; // Blockchain-style chained tamper evidence
}

export type AnomalyType = 
  | 'MASS_BALANCE_SURPLUS'        // More milk exited than entered + expected variance
  | 'MASS_BALANCE_EXCESSIVE_LOSS' // Unexplained missing volume
  | 'VELOCITY_IMPOSSIBILITY'      // Tanker arrived faster than physical road transit allows
  | 'TEMPERATURE_EXCURSION'       // Cold-chain break > 7°C for extended duration
  | 'DILUTION_METRIC_DIVERGENCE'  // Discrepancy between reported SNF/Fat ratios
  | 'GHOST_TANKER_DISPATCH';      // Discharge logged without matching origin dispatch

export interface Anomaly {
  id: string;
  batchId: string;
  facilityId: string;
  type: AnomalyType;
  title: string;
  description: string;
  detectedAt: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  deterministicMetric: {
    expectedQuantityLitres: number;
    recordedQuantityLitres: number;
    discrepancyLitres: number;
    variancePercentage: number;
    toleranceThresholdPercentage: number;
    computationRule: string; // e.g., "Deterministic Mass Balance: Inflow - Outflow > +2.0%"
  };
  evidenceConfidenceScore: number; // 0.00 to 1.00
  inspectionPriority: 'IMMEDIATE' | 'HIGH' | 'SCHEDULED' | 'ROUTINE';
  status: 'UNRESOLVED' | 'UNDER_INVESTIGATION' | 'ESCALATED_FOR_INSPECTION' | 'RESOLVED_EXPLAINED';
}

export interface Batch {
  id: string;
  batchCode: string;
  originFacilityId: string;
  originFacilityName: string;
  currentFacilityId: string;
  currentFacilityName: string;
  collectedLitres: number;
  currentRecordedLitres: number;
  expectedLossLitres: number;
  unaccountedDiscrepancyLitres: number;
  createdAt: string;
  lastEventTimestamp: string;
  status: 'NORMAL' | 'ANOMALY_FLAGGED' | 'UNDER_ACTIVE_INVESTIGATION' | 'SEALED_FOR_INSPECTION';
  associatedAnomalyIds: string[];
  eventCount: number;
}

export type InvestigationCaseStatus = 
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'INSPECTION_REQUIRED'
  | 'RESOLVED'
  | 'QUEUED' 
  | 'ASSIGNED' 
  | 'ACTIVE_ANALYSIS' 
  | 'ESCALATED_TO_INSPECTION' 
  | 'INSPECTION_COMPLETED' 
  | 'CLOSED_EXPLAINED';

export interface InvestigationEvidence {
  id: string;
  caseId: string;
  title: string;
  type: 'MASS_BALANCE_AUDIT' | 'GPS_VELOCITY_LOG' | 'WEIGHBRIDGE_DISCREPANCY' | 'TANKER_SEAL_LOG';
  mcpToolSource: 'trace_batch' | 'get_facility_history' | 'get_vehicle_history' | 'get_related_batches';
  retrievedAt: string;
  details: string;
  structuredData: Record<string, unknown>;
  confidenceScore: number;
  verifiedImmutable: boolean;
}

export interface InvestigationBrief {
  id: string;
  caseId: string;
  generatedAt: string;
  agentVersion: string;
  summary: string;
  discrepancyAnalysis: string;
  hypothesesForFieldInspector: string[];
  recommendedInspectionFocus: {
    facilityId: string;
    facilityName: string;
    specificChecklist: string[];
    urgency: 'IMMEDIATE' | 'NEXT_SHIFT' | 'ROUTINE';
  };
  nonDiagnosticDisclaimer: string;
}

export interface OfficerNote {
  id: string;
  caseId: string;
  officerId: string;
  officerBadge: string;
  officerName: string;
  createdAt: string;
  noteText: string;
  actionTaken?: 'DISPATCHED_INSPECTION_TEAM' | 'REQUESTED_REWEIGH' | 'EVIDENTIARY_FREEZE' | 'INTERNAL_REVIEW';
}

export interface InvestigationCase {
  id: string;
  caseNumber: string;
  batchId: string;
  batchCode: string;
  facilityId: string;
  facilityName: string;
  primaryAnomalyId: string;
  primaryAnomalyType: AnomalyType;
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: InvestigationCaseStatus;
  discrepancyLitres: number;
  variancePercentage: number;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt: string;
  updatedAt: string;
  evidenceItems: InvestigationEvidence[];
  officerNotes: OfficerNote[];
  brief?: InvestigationBrief;
  physicalInspectionResult?: {
    inspectionDate: string;
    inspectingOfficerBadge: string;
    labSampleId?: string;
    officialFindings: string;
    disposition: 'FORMAL_ENFORCEMENT' | 'RECALIBRATION_REQUIRED' | 'FALSE_FLAG_EXPLAINED';
  };
}

export interface ActiveAlert {
  id: string;
  anomalyId: string;
  batchId: string;
  facilityId: string;
  facilityName: string;
  title: string;
  summary: string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  createdAt: string;
  isRead: boolean;
  inspectionPriority: 'IMMEDIATE' | 'HIGH' | 'SCHEDULED';
}
