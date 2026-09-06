/**
 * MilkyWay Platform — Demo Seed Data
 * 
 * ARCHITECTURAL NOTICE:
 * This dataset provides realistic, deterministic supply-chain events and
 * anomaly records for the Officer Console UI preview.
 * 
 * In production deployment on Google Cloud Run:
 * - Event queries dispatch to Google BigQuery (append-only journal dataset).
 * - Investigation dossiers and notes persist to Cloud Firestore.
 * - Non-diagnostic AI investigation briefs query the Google ADK Agent via MCP.
 */

import {
  Officer,
  Facility,
  Vehicle,
  Batch,
  SupplyChainEvent,
  Anomaly,
  InvestigationCase,
  ActiveAlert
} from '../types/models';

export const SEED_OFFICER: Officer = {
  id: 'off-delhi-042',
  email: 'p.verma@foodsafety.gov.in',
  displayName: 'P. Verma',
  role: 'officer',
  badgeNumber: 'FSO-IND-9021',
  jurisdiction: 'North Zone Dairy Enforcement Division',
  district: 'Sonipat & Rohtak Sub-Districts',
  department: 'Food Safety & Standards Authority — State Enforcement Cell',
  clearanceLevel: 'L2_ENFORCEMENT',
  activeCaseCount: 4,
  createdAt: '2025-01-15T08:00:00Z',
  lastLoginAt: '2026-09-05T09:30:00Z'
};

export const SEED_FACILITIES: Facility[] = [
  {
    id: 'FAC-AMR-01',
    code: 'AMR-CC-102',
    name: 'Amritsar District Dairy Co-op Hub',
    type: 'COLLECTION_CENTER',
    district: 'Amritsar',
    state: 'Punjab',
    gpsCoordinates: { lat: 31.634, lng: 74.8723 },
    dailyCapacityLitres: 45000,
    currentIntakeLitres: 38200,
    activeBatchCount: 3,
    historicalAnomalyRatePercent: 1.2,
    status: 'OPERATIONAL'
  },
  {
    id: 'FAC-JAL-04',
    code: 'JAL-CH-204',
    name: 'Jalandhar Industrial Cold Chilling Plant',
    type: 'CHILLING_HUB',
    district: 'Jalandhar',
    state: 'Punjab',
    gpsCoordinates: { lat: 31.326, lng: 75.5762 },
    dailyCapacityLitres: 95000,
    currentIntakeLitres: 91400,
    activeBatchCount: 7,
    historicalAnomalyRatePercent: 4.8,
    status: 'FLAGGED'
  },
  {
    id: 'FAC-LUD-02',
    code: 'LUD-PR-302',
    name: 'Ludhiana Central Dairy Processing Facility',
    type: 'PROCESSING_PLANT',
    district: 'Ludhiana',
    state: 'Punjab',
    gpsCoordinates: { lat: 30.901, lng: 75.8573 },
    dailyCapacityLitres: 180000,
    currentIntakeLitres: 164000,
    activeBatchCount: 12,
    historicalAnomalyRatePercent: 8.4,
    status: 'INSPECTION_PENDING'
  },
  {
    id: 'FAC-SON-09',
    code: 'SON-DP-409',
    name: 'Sonipat Distribution Depot & Packaging Hub',
    type: 'PACKAGING_UNIT',
    district: 'Sonipat',
    state: 'Haryana',
    gpsCoordinates: { lat: 28.9931, lng: 77.0151 },
    dailyCapacityLitres: 120000,
    currentIntakeLitres: 112500,
    activeBatchCount: 5,
    historicalAnomalyRatePercent: 2.1,
    status: 'OPERATIONAL'
  }
];

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: 'VEH-PB08-9941',
    registrationNumber: 'PB-08-BK-9941',
    tankerCapacityLitres: 16000,
    temperatureSensorActive: true,
    gpsTrackerActive: true,
    currentStatus: 'DISCHARGING',
    assignedRoute: {
      originFacilityId: 'FAC-AMR-01',
      destinationFacilityId: 'FAC-JAL-04',
      departureTimestamp: '2026-09-05T06:15:00Z',
      expectedArrivalTimestamp: '2026-09-05T07:45:00Z',
      distanceKm: 82,
      expectedTransitDurationMinutes: 90
    },
    lastPingTimestamp: '2026-09-05T09:12:00Z',
    currentLocation: { lat: 31.328, lng: 75.578 }
  },
  {
    id: 'VEH-PB10-3320',
    registrationNumber: 'PB-10-CZ-3320',
    tankerCapacityLitres: 24000,
    temperatureSensorActive: true,
    gpsTrackerActive: true,
    currentStatus: 'IN_TRANSIT',
    assignedRoute: {
      originFacilityId: 'FAC-JAL-04',
      destinationFacilityId: 'FAC-LUD-02',
      departureTimestamp: '2026-09-05T07:30:00Z',
      expectedArrivalTimestamp: '2026-09-05T08:50:00Z',
      distanceKm: 61,
      expectedTransitDurationMinutes: 80
    },
    lastPingTimestamp: '2026-09-05T09:25:00Z',
    currentLocation: { lat: 31.054, lng: 75.721 }
  },
  {
    id: 'VEH-HR12-7718',
    registrationNumber: 'HR-12-AE-7718',
    tankerCapacityLitres: 20000,
    temperatureSensorActive: false,
    gpsTrackerActive: true,
    currentStatus: 'MAINTENANCE',
    lastPingTimestamp: '2026-09-04T18:00:00Z'
  }
];

export const SEED_ANOMALIES: Anomaly[] = [
  {
    id: 'ANOM-DEMO-MB-330L',
    batchId: 'BATCH-DEMO-003-ANOMALOUS',
    facilityId: 'FAC-AMUL-03',
    type: 'MASS_BALANCE_EXCESSIVE_LOSS',
    title: 'Unexplained Mass-Balance Discrepancy (330 L Shortfall)',
    description: 'Deterministic mass-balance computation detected 330.0 L unexplained volume shortfall between expected processing output (980.0 L) and recorded dispatch (650.0 L, -33.67% variance). Permitted evaporation threshold is ±2.0%. Root cause requires physical inspection and facility log audit to verify.',
    detectedAt: '2026-09-05T11:45:30Z',
    severity: 'CRITICAL',
    deterministicMetric: {
      expectedQuantityLitres: 980,
      recordedQuantityLitres: 650,
      discrepancyLitres: -330,
      variancePercentage: -33.67,
      toleranceThresholdPercentage: 2.0,
      computationRule: 'Deterministic Mass Balance: Output Litres - Expected Output Litres (Tolerance: ±2.0%)'
    },
    evidenceConfidenceScore: 0.98,
    inspectionPriority: 'IMMEDIATE',
    status: 'UNDER_INVESTIGATION'
  },
  {
    id: 'ANOM-2026-0811',
    batchId: 'BATCH-2026-0901',
    facilityId: 'FAC-LUD-02',
    type: 'MASS_BALANCE_SURPLUS',
    title: 'Unexplained Inflow/Outflow Volume Expansion',
    description: 'Post-pasteurization volumetric meter reported 1,420 litres in excess of intake volume combined with registered thermal expansion limits (+3.8%).',
    detectedAt: '2026-09-05T08:42:15Z',
    severity: 'CRITICAL',
    deterministicMetric: {
      expectedQuantityLitres: 14200,
      recordedQuantityLitres: 15620,
      discrepancyLitres: 1420,
      variancePercentage: 10.0,
      toleranceThresholdPercentage: 1.5,
      computationRule: 'Deterministic Mass Balance: Output Litres - (Input Litres - Expected Shrinkage) > +1.5%'
    },
    evidenceConfidenceScore: 0.96,
    inspectionPriority: 'IMMEDIATE',
    status: 'ESCALATED_FOR_INSPECTION'
  },
  {
    id: 'ANOM-2026-0812',
    batchId: 'BATCH-2026-0894',
    facilityId: 'FAC-JAL-04',
    type: 'VELOCITY_IMPOSSIBILITY',
    title: 'Physically Impossible Highway Transit Duration',
    description: 'Tanker PB-10-CZ-3320 completed 82 km route between collection depot and chilling plant in 28 minutes (required average velocity 175.7 km/h).',
    detectedAt: '2026-09-05T07:44:00Z',
    severity: 'CRITICAL',
    deterministicMetric: {
      expectedQuantityLitres: 18000,
      recordedQuantityLitres: 18000,
      discrepancyLitres: 0,
      variancePercentage: 0.0,
      toleranceThresholdPercentage: 0.0,
      computationRule: 'Deterministic Velocity: Distance / (Arrival Timestamp - Dispatch Timestamp) > 85 km/h Commercial Tanker Cap'
    },
    evidenceConfidenceScore: 0.99,
    inspectionPriority: 'IMMEDIATE',
    status: 'UNDER_INVESTIGATION'
  },
  {
    id: 'ANOM-2026-0813',
    batchId: 'BATCH-2026-0887',
    facilityId: 'FAC-LUD-02',
    type: 'MASS_BALANCE_EXCESSIVE_LOSS',
    title: 'Elevated Process Loss Above Permitted Shrinkage Threshold',
    description: 'Chilling transfer logged an unaccounted loss of 890 litres (-6.2%), exceeding standard plant evaporation allowance (max 0.8%).',
    detectedAt: '2026-09-05T06:10:30Z',
    severity: 'HIGH',
    deterministicMetric: {
      expectedQuantityLitres: 14500,
      recordedQuantityLitres: 13610,
      discrepancyLitres: -890,
      variancePercentage: -6.14,
      toleranceThresholdPercentage: 0.8,
      computationRule: 'Deterministic Mass Balance: Input Litres - Output Litres > +0.8%'
    },
    evidenceConfidenceScore: 0.91,
    inspectionPriority: 'HIGH',
    status: 'UNDER_INVESTIGATION'
  },
  {
    id: 'ANOM-2026-0814',
    batchId: 'BATCH-2026-0870',
    facilityId: 'FAC-SON-09',
    type: 'TEMPERATURE_EXCURSION',
    title: 'Prolonged Cold-Chain Thermal Excursion',
    description: 'Holding silo sensor sustained readings above 8.4°C for 3 hours and 20 minutes prior to packaging dispatch.',
    detectedAt: '2026-09-04T22:15:00Z',
    severity: 'MEDIUM',
    deterministicMetric: {
      expectedQuantityLitres: 22000,
      recordedQuantityLitres: 22000,
      discrepancyLitres: 0,
      variancePercentage: 0.0,
      toleranceThresholdPercentage: 0.0,
      computationRule: 'Deterministic Cold-Chain Rule: Temperature > 7.0°C continuously for > 45 minutes'
    },
    evidenceConfidenceScore: 0.88,
    inspectionPriority: 'SCHEDULED',
    status: 'UNRESOLVED'
  }
];

export const SEED_BATCHES: Batch[] = [
  {
    id: 'BATCH-DEMO-003-ANOMALOUS',
    batchCode: 'MW-DEMO-26-003-ANOM',
    originFacilityId: 'FAC-ANAND-01',
    originFacilityName: 'Anand District Milk Producers Cooperative',
    currentFacilityId: 'FAC-AMUL-03',
    currentFacilityName: 'Amul Western Processing Mega-Plant',
    collectedLitres: 1000,
    currentRecordedLitres: 650,
    expectedLossLitres: 20,
    unaccountedDiscrepancyLitres: -330,
    createdAt: '2026-09-05T06:00:00Z',
    lastEventTimestamp: '2026-09-05T13:30:00Z',
    status: 'ANOMALY_FLAGGED',
    associatedAnomalyIds: ['ANOM-DEMO-MB-330L'],
    eventCount: 6
  },
  {
    id: 'BATCH-DEMO-001-CLEAN',
    batchCode: 'MW-DEMO-26-001-CLN',
    originFacilityId: 'FAC-ANAND-01',
    originFacilityName: 'Anand District Milk Producers Cooperative',
    currentFacilityId: 'FAC-AHMD-04',
    currentFacilityName: 'Ahmedabad Central Packaging & Distribution Depot',
    collectedLitres: 1200,
    currentRecordedLitres: 1178,
    expectedLossLitres: 22,
    unaccountedDiscrepancyLitres: 0,
    createdAt: '2026-09-04T05:00:00Z',
    lastEventTimestamp: '2026-09-04T12:45:00Z',
    status: 'NORMAL',
    associatedAnomalyIds: [],
    eventCount: 6
  },
  {
    id: 'BATCH-DEMO-002-CLEAN',
    batchCode: 'MW-DEMO-26-002-CLN',
    originFacilityId: 'FAC-ANAND-01',
    originFacilityName: 'Anand District Milk Producers Cooperative',
    currentFacilityId: 'FAC-AHMD-04',
    currentFacilityName: 'Ahmedabad Central Packaging & Distribution Depot',
    collectedLitres: 2400,
    currentRecordedLitres: 2358,
    expectedLossLitres: 42,
    unaccountedDiscrepancyLitres: 0,
    createdAt: '2026-09-04T08:00:00Z',
    lastEventTimestamp: '2026-09-04T16:00:00Z',
    status: 'NORMAL',
    associatedAnomalyIds: [],
    eventCount: 6
  },
  {
    id: 'BATCH-2026-0901',
    batchCode: 'MW-PB-26-0901',
    originFacilityId: 'FAC-AMR-01',
    originFacilityName: 'Amritsar District Dairy Co-op Hub',
    currentFacilityId: 'FAC-LUD-02',
    currentFacilityName: 'Ludhiana Central Dairy Processing Facility',
    collectedLitres: 14200,
    currentRecordedLitres: 15620,
    expectedLossLitres: 110,
    unaccountedDiscrepancyLitres: 1420,
    createdAt: '2026-09-05T05:00:00Z',
    lastEventTimestamp: '2026-09-05T08:42:15Z',
    status: 'SEALED_FOR_INSPECTION',
    associatedAnomalyIds: ['ANOM-2026-0811'],
    eventCount: 4
  },
  {
    id: 'BATCH-2026-0894',
    batchCode: 'MW-PB-26-0894',
    originFacilityId: 'FAC-AMR-01',
    originFacilityName: 'Amritsar District Dairy Co-op Hub',
    currentFacilityId: 'FAC-JAL-04',
    currentFacilityName: 'Jalandhar Industrial Cold Chilling Plant',
    collectedLitres: 18000,
    currentRecordedLitres: 18000,
    expectedLossLitres: 140,
    unaccountedDiscrepancyLitres: 0,
    createdAt: '2026-09-05T06:30:00Z',
    lastEventTimestamp: '2026-09-05T07:44:00Z',
    status: 'UNDER_ACTIVE_INVESTIGATION',
    associatedAnomalyIds: ['ANOM-2026-0812'],
    eventCount: 3
  },
  {
    id: 'BATCH-2026-0887',
    batchCode: 'MW-PB-26-0887',
    originFacilityId: 'FAC-JAL-04',
    originFacilityName: 'Jalandhar Industrial Cold Chilling Plant',
    currentFacilityId: 'FAC-LUD-02',
    currentFacilityName: 'Ludhiana Central Dairy Processing Facility',
    collectedLitres: 14500,
    currentRecordedLitres: 13610,
    expectedLossLitres: 95,
    unaccountedDiscrepancyLitres: -890,
    createdAt: '2026-09-05T04:15:00Z',
    lastEventTimestamp: '2026-09-05T06:10:30Z',
    status: 'ANOMALY_FLAGGED',
    associatedAnomalyIds: ['ANOM-2026-0813'],
    eventCount: 4
  },
  {
    id: 'BATCH-2026-0870',
    batchCode: 'MW-HR-26-0870',
    originFacilityId: 'FAC-SON-09',
    originFacilityName: 'Sonipat Distribution Depot & Packaging Hub',
    currentFacilityId: 'FAC-SON-09',
    currentFacilityName: 'Sonipat Distribution Depot & Packaging Hub',
    collectedLitres: 22000,
    currentRecordedLitres: 22000,
    expectedLossLitres: 180,
    unaccountedDiscrepancyLitres: 0,
    createdAt: '2026-09-04T18:00:00Z',
    lastEventTimestamp: '2026-09-04T22:15:00Z',
    status: 'ANOMALY_FLAGGED',
    associatedAnomalyIds: ['ANOM-2026-0814'],
    eventCount: 5
  },
  {
    id: 'BATCH-2026-0865',
    batchCode: 'MW-PB-26-0865',
    originFacilityId: 'FAC-AMR-01',
    originFacilityName: 'Amritsar District Dairy Co-op Hub',
    currentFacilityId: 'FAC-SON-09',
    currentFacilityName: 'Sonipat Distribution Depot & Packaging Hub',
    collectedLitres: 16500,
    currentRecordedLitres: 16420,
    expectedLossLitres: 90,
    unaccountedDiscrepancyLitres: 10,
    createdAt: '2026-09-04T12:00:00Z',
    lastEventTimestamp: '2026-09-05T02:30:00Z',
    status: 'NORMAL',
    associatedAnomalyIds: [],
    eventCount: 6
  }
];

export const SEED_EVENTS: SupplyChainEvent[] = [
  // --- BATCH 3: ANOMALOUS (Input: 1000 L, Expected: 980 L, Actual: 650 L, Unaccounted: 330 L) ---
  {
    eventId: 'EVT-003-01',
    batchId: 'BATCH-DEMO-003-ANOMALOUS',
    eventType: 'MILK_COLLECTED',
    facilityId: 'FAC-ANAND-01',
    facilityName: 'Anand District Milk Producers Cooperative',
    recordedByOfficerOrOperatorId: 'ACT-OPERATOR-ANAND-01',
    timestamp: '2026-09-05T06:15:00Z',
    quantityLitres: 1000,
    fatPercentage: 4.2,
    snfPercentage: 8.6,
    temperatureCelsius: 4.3,
    cryptographicHash: '003a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc1',
    previousEventHash: '0000000000000000000000000000000000000000000000000000000000000000'
  },
  {
    eventId: 'EVT-003-02',
    batchId: 'BATCH-DEMO-003-ANOMALOUS',
    eventType: 'TRANSFERRED',
    facilityId: 'FAC-ANAND-01',
    facilityName: 'Anand District Milk Producers Cooperative',
    recordedByOfficerOrOperatorId: 'ACT-DRIVER-DESAI-14',
    timestamp: '2026-09-05T07:00:00Z',
    quantityLitres: 995,
    vehicleId: 'VEH-GJ23-T9904',
    temperatureCelsius: 4.4,
    cryptographicHash: '003b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc2',
    previousEventHash: '003a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc1'
  },
  {
    eventId: 'EVT-003-03',
    batchId: 'BATCH-DEMO-003-ANOMALOUS',
    eventType: 'STORED',
    facilityId: 'FAC-KAIRA-02',
    facilityName: 'Kaira Regional Chilling & Vat Storage Center',
    recordedByOfficerOrOperatorId: 'ACT-CHILLING-TECH-04',
    timestamp: '2026-09-05T08:15:00Z',
    quantityLitres: 995,
    vehicleId: 'VEH-GJ23-T9904',
    temperatureCelsius: 3.9,
    cryptographicHash: '003c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc3',
    previousEventHash: '003b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc2'
  },
  {
    eventId: 'EVT-003-04',
    batchId: 'BATCH-DEMO-003-ANOMALOUS',
    eventType: 'PROCESSED',
    facilityId: 'FAC-AMUL-03',
    facilityName: 'Amul Western Processing Mega-Plant',
    recordedByOfficerOrOperatorId: 'ACT-PLANT-OPERATOR-AMUL-03',
    timestamp: '2026-09-05T10:30:00Z',
    quantityLitres: 980, // Expected output: 980 L
    temperatureCelsius: 4.0,
    cryptographicHash: '003d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc4',
    previousEventHash: '003c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc3'
  },
  {
    eventId: 'EVT-003-05',
    batchId: 'BATCH-DEMO-003-ANOMALOUS',
    eventType: 'DISPATCHED',
    facilityId: 'FAC-AMUL-03',
    facilityName: 'Amul Western Processing Mega-Plant',
    recordedByOfficerOrOperatorId: 'ACT-DISPATCH-SUPERVISOR-09',
    timestamp: '2026-09-05T11:45:00Z',
    quantityLitres: 650, // Actual output: 650 L (Unaccounted: 330 L)
    vehicleId: 'VEH-GJ23-T9904',
    temperatureCelsius: 4.1,
    cryptographicHash: '003e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc5',
    previousEventHash: '003d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc4'
  },
  {
    eventId: 'EVT-003-06',
    batchId: 'BATCH-DEMO-003-ANOMALOUS',
    eventType: 'RECEIVED',
    facilityId: 'FAC-AHMD-04',
    facilityName: 'Ahmedabad Central Packaging & Distribution Depot',
    recordedByOfficerOrOperatorId: 'ACT-DEPOT-RECEIVER-AHMD-01',
    timestamp: '2026-09-05T13:30:00Z',
    quantityLitres: 645,
    vehicleId: 'VEH-GJ23-T9904',
    temperatureCelsius: 4.2,
    cryptographicHash: '003f60718293a4b5c6d7e8f90123456789abcdef0123456789abc6',
    previousEventHash: '003e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc5'
  },

  // --- BATCH 1: CLEAN (1200 L -> 1178 L) ---
  {
    eventId: 'EVT-001-01',
    batchId: 'BATCH-DEMO-001-CLEAN',
    eventType: 'MILK_COLLECTED',
    facilityId: 'FAC-ANAND-01',
    facilityName: 'Anand District Milk Producers Cooperative',
    recordedByOfficerOrOperatorId: 'ACT-OPERATOR-ANAND-01',
    timestamp: '2026-09-04T05:15:00Z',
    quantityLitres: 1200,
    fatPercentage: 4.3,
    snfPercentage: 8.7,
    temperatureCelsius: 4.2,
    cryptographicHash: '001a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc1',
    previousEventHash: '0000000000000000000000000000000000000000000000000000000000000000'
  },
  {
    eventId: 'EVT-001-02',
    batchId: 'BATCH-DEMO-001-CLEAN',
    eventType: 'TRANSFERRED',
    facilityId: 'FAC-ANAND-01',
    facilityName: 'Anand District Milk Producers Cooperative',
    recordedByOfficerOrOperatorId: 'ACT-DRIVER-PATEL-08',
    timestamp: '2026-09-04T06:00:00Z',
    quantityLitres: 1196,
    vehicleId: 'VEH-GJ01-T8812',
    temperatureCelsius: 4.3,
    cryptographicHash: '001b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc2',
    previousEventHash: '001a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc1'
  },
  {
    eventId: 'EVT-001-03',
    batchId: 'BATCH-DEMO-001-CLEAN',
    eventType: 'STORED',
    facilityId: 'FAC-KAIRA-02',
    facilityName: 'Kaira Regional Chilling & Vat Storage Center',
    recordedByOfficerOrOperatorId: 'ACT-CHILLING-TECH-04',
    timestamp: '2026-09-04T07:15:00Z',
    quantityLitres: 1196,
    vehicleId: 'VEH-GJ01-T8812',
    temperatureCelsius: 3.8,
    cryptographicHash: '001c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc3',
    previousEventHash: '001b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc2'
  },
  {
    eventId: 'EVT-001-04',
    batchId: 'BATCH-DEMO-001-CLEAN',
    eventType: 'PROCESSED',
    facilityId: 'FAC-AMUL-03',
    facilityName: 'Amul Western Processing Mega-Plant',
    recordedByOfficerOrOperatorId: 'ACT-PLANT-OPERATOR-AMUL-03',
    timestamp: '2026-09-04T09:30:00Z',
    quantityLitres: 1182,
    temperatureCelsius: 3.9,
    cryptographicHash: '001d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc4',
    previousEventHash: '001c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc3'
  },
  {
    eventId: 'EVT-001-05',
    batchId: 'BATCH-DEMO-001-CLEAN',
    eventType: 'DISPATCHED',
    facilityId: 'FAC-AMUL-03',
    facilityName: 'Amul Western Processing Mega-Plant',
    recordedByOfficerOrOperatorId: 'ACT-DISPATCH-SUPERVISOR-09',
    timestamp: '2026-09-04T11:00:00Z',
    quantityLitres: 1182,
    vehicleId: 'VEH-GJ07-T4421',
    temperatureCelsius: 3.9,
    cryptographicHash: '001e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc5',
    previousEventHash: '001d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc4'
  },
  {
    eventId: 'EVT-001-06',
    batchId: 'BATCH-DEMO-001-CLEAN',
    eventType: 'RECEIVED',
    facilityId: 'FAC-AHMD-04',
    facilityName: 'Ahmedabad Central Packaging & Distribution Depot',
    recordedByOfficerOrOperatorId: 'ACT-DEPOT-RECEIVER-AHMD-01',
    timestamp: '2026-09-04T12:45:00Z',
    quantityLitres: 1178,
    vehicleId: 'VEH-GJ07-T4421',
    temperatureCelsius: 4.1,
    cryptographicHash: '001f60718293a4b5c6d7e8f90123456789abcdef0123456789abc6',
    previousEventHash: '001e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc5'
  },

  // --- BATCH 2: CLEAN (2400 L -> 2358 L) ---
  {
    eventId: 'EVT-002-01',
    batchId: 'BATCH-DEMO-002-CLEAN',
    eventType: 'MILK_COLLECTED',
    facilityId: 'FAC-ANAND-01',
    facilityName: 'Anand District Milk Producers Cooperative',
    recordedByOfficerOrOperatorId: 'ACT-OPERATOR-ANAND-02',
    timestamp: '2026-09-04T08:15:00Z',
    quantityLitres: 2400,
    fatPercentage: 4.4,
    snfPercentage: 8.8,
    temperatureCelsius: 4.1,
    cryptographicHash: '002a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc1',
    previousEventHash: '0000000000000000000000000000000000000000000000000000000000000000'
  },
  {
    eventId: 'EVT-002-02',
    batchId: 'BATCH-DEMO-002-CLEAN',
    eventType: 'TRANSFERRED',
    facilityId: 'FAC-ANAND-01',
    facilityName: 'Anand District Milk Producers Cooperative',
    recordedByOfficerOrOperatorId: 'ACT-DRIVER-SINGH-11',
    timestamp: '2026-09-04T09:00:00Z',
    quantityLitres: 2392,
    vehicleId: 'VEH-GJ07-T4421',
    temperatureCelsius: 4.2,
    cryptographicHash: '002b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc2',
    previousEventHash: '002a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc1'
  },
  {
    eventId: 'EVT-002-03',
    batchId: 'BATCH-DEMO-002-CLEAN',
    eventType: 'STORED',
    facilityId: 'FAC-KAIRA-02',
    facilityName: 'Kaira Regional Chilling & Vat Storage Center',
    recordedByOfficerOrOperatorId: 'ACT-CHILLING-TECH-04',
    timestamp: '2026-09-04T10:15:00Z',
    quantityLitres: 2392,
    vehicleId: 'VEH-GJ07-T4421',
    temperatureCelsius: 3.7,
    cryptographicHash: '002c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc3',
    previousEventHash: '002b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc2'
  },
  {
    eventId: 'EVT-002-04',
    batchId: 'BATCH-DEMO-002-CLEAN',
    eventType: 'PROCESSED',
    facilityId: 'FAC-AMUL-03',
    facilityName: 'Amul Western Processing Mega-Plant',
    recordedByOfficerOrOperatorId: 'ACT-PLANT-OPERATOR-AMUL-03',
    timestamp: '2026-09-04T13:00:00Z',
    quantityLitres: 2365,
    temperatureCelsius: 3.8,
    cryptographicHash: '002d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc4',
    previousEventHash: '002c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc3'
  },
  {
    eventId: 'EVT-002-05',
    batchId: 'BATCH-DEMO-002-CLEAN',
    eventType: 'DISPATCHED',
    facilityId: 'FAC-AMUL-03',
    facilityName: 'Amul Western Processing Mega-Plant',
    recordedByOfficerOrOperatorId: 'ACT-DISPATCH-SUPERVISOR-09',
    timestamp: '2026-09-04T14:30:00Z',
    quantityLitres: 2365,
    vehicleId: 'VEH-GJ01-T8812',
    temperatureCelsius: 3.8,
    cryptographicHash: '002e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc5',
    previousEventHash: '002d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc4'
  },
  {
    eventId: 'EVT-002-06',
    batchId: 'BATCH-DEMO-002-CLEAN',
    eventType: 'RECEIVED',
    facilityId: 'FAC-AHMD-04',
    facilityName: 'Ahmedabad Central Packaging & Distribution Depot',
    recordedByOfficerOrOperatorId: 'ACT-DEPOT-RECEIVER-AHMD-01',
    timestamp: '2026-09-04T16:00:00Z',
    quantityLitres: 2358,
    vehicleId: 'VEH-GJ01-T8812',
    temperatureCelsius: 4.0,
    cryptographicHash: '002f60718293a4b5c6d7e8f90123456789abcdef0123456789abc6',
    previousEventHash: '002e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc5'
  },

  {
    eventId: 'EVT-2026-09-05-001',
    batchId: 'BATCH-2026-0901',
    eventType: 'PROCESSING_OUTPUT',
    facilityId: 'FAC-LUD-02',
    facilityName: 'Ludhiana Central Dairy Processing Facility',
    recordedByOfficerOrOperatorId: 'OP-LUD-8812',
    timestamp: '2026-09-05T08:42:15Z',
    quantityLitres: 15620,
    fatPercentage: 3.4,
    snfPercentage: 8.1,
    temperatureCelsius: 4.2,
    cryptographicHash: '3f78a69e9c8b671a5c4e12e02251bb68c7849d5a898b3f6f1947a1bc7e30d12e',
    previousEventHash: '8b4d3f2a1e9c8b7a6e5d4c3b2a1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e'
  },
  {
    eventId: 'EVT-2026-09-05-002',
    batchId: 'BATCH-2026-0894',
    eventType: 'TANKER_RECEIPT',
    facilityId: 'FAC-JAL-04',
    facilityName: 'Jalandhar Industrial Cold Chilling Plant',
    recordedByOfficerOrOperatorId: 'OP-JAL-4029',
    timestamp: '2026-09-05T07:44:00Z',
    quantityLitres: 18000,
    vehicleId: 'VEH-PB10-3320',
    temperatureCelsius: 4.8,
    cryptographicHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    previousEventHash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b'
  },
  {
    eventId: 'EVT-2026-09-05-003',
    batchId: 'BATCH-2026-0894',
    eventType: 'TANKER_DISPATCH',
    facilityId: 'FAC-AMR-01',
    facilityName: 'Amritsar District Dairy Co-op Hub',
    recordedByOfficerOrOperatorId: 'OP-AMR-1102',
    timestamp: '2026-09-05T07:16:00Z',
    quantityLitres: 18000,
    vehicleId: 'VEH-PB10-3320',
    temperatureCelsius: 4.1,
    cryptographicHash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    previousEventHash: '0000000000000000000000000000000000000000000000000000000000000000'
  },
  {
    eventId: 'EVT-2026-09-05-004',
    batchId: 'BATCH-2026-0901',
    eventType: 'PROCESSING_INTAKE',
    facilityId: 'FAC-LUD-02',
    facilityName: 'Ludhiana Central Dairy Processing Facility',
    recordedByOfficerOrOperatorId: 'OP-LUD-8812',
    timestamp: '2026-09-05T06:45:00Z',
    quantityLitres: 14200,
    temperatureCelsius: 4.5,
    cryptographicHash: '8b4d3f2a1e9c8b7a6e5d4c3b2a1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e',
    previousEventHash: '5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d'
  },
  {
    eventId: 'EVT-2026-09-05-005',
    batchId: 'BATCH-2026-0887',
    eventType: 'CHILLING_CHECKIN',
    facilityId: 'FAC-JAL-04',
    facilityName: 'Jalandhar Industrial Cold Chilling Plant',
    recordedByOfficerOrOperatorId: 'OP-JAL-4029',
    timestamp: '2026-09-05T06:10:30Z',
    quantityLitres: 13610,
    temperatureCelsius: 5.1,
    cryptographicHash: '112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00',
    previousEventHash: '99887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa'
  },
  {
    eventId: 'EVT-2026-09-05-006',
    batchId: 'BATCH-2026-0865',
    eventType: 'TANKER_RECEIPT',
    facilityId: 'FAC-SON-09',
    facilityName: 'Sonipat Distribution Depot & Packaging Hub',
    recordedByOfficerOrOperatorId: 'OP-SON-3190',
    timestamp: '2026-09-05T02:30:00Z',
    quantityLitres: 16420,
    vehicleId: 'VEH-PB08-9941',
    temperatureCelsius: 4.0,
    cryptographicHash: '44556677889900112233445566778899aabbccddeeff00112233445566778899',
    previousEventHash: '3344556677889900112233445566778899aabbccddeeff001122334455667788'
  }
];

export const SEED_INVESTIGATION_CASES: InvestigationCase[] = [
  {
    id: 'CASE-2026-041',
    caseNumber: 'INV-FSO-2026-041',
    batchId: 'BATCH-2026-0901',
    batchCode: 'MW-PB-26-0901',
    facilityId: 'FAC-LUD-02',
    facilityName: 'Ludhiana Central Dairy Processing Facility',
    primaryAnomalyId: 'ANOM-2026-0811',
    primaryAnomalyType: 'MASS_BALANCE_SURPLUS',
    priority: 'IMMEDIATE',
    status: 'ESCALATED_TO_INSPECTION',
    discrepancyLitres: 1420,
    variancePercentage: 10.0,
    assignedOfficerId: 'off-delhi-042',
    assignedOfficerName: 'P. Verma',
    createdAt: '2026-09-05T08:50:00Z',
    updatedAt: '2026-09-05T09:15:00Z',
    evidenceItems: [
      {
        id: 'EVD-041-1',
        caseId: 'CASE-2026-041',
        title: 'BigQuery Append-Only Inflow/Outflow Mass Balance Audit',
        type: 'MASS_BALANCE_AUDIT',
        mcpToolSource: 'trace_batch',
        retrievedAt: '2026-09-05T08:52:00Z',
        details: 'Intake event EVT-2026-09-05-004 logged 14,200 L. Pasteurization output event EVT-2026-09-05-001 logged 15,620 L without matching intermediate blend events.',
        structuredData: {
          inflowLitres: 14200,
          outflowLitres: 15620,
          unaccountedLitres: 1420,
          variancePercent: 10.0
        },
        confidenceScore: 0.98,
        verifiedImmutable: true
      },
      {
        id: 'EVD-041-2',
        caseId: 'CASE-2026-041',
        title: 'Weighbridge Gross Tare Discrepancy Log',
        type: 'WEIGHBRIDGE_DISCREPANCY',
        mcpToolSource: 'get_facility_history',
        retrievedAt: '2026-09-05T09:01:00Z',
        details: 'Discharging bay 3 automated weighbridge recorded gross tare weight matching 14,250 L, while in-line flow meter reported 15,620 L.',
        structuredData: {
          scaleTareDiffLitres: 1370,
          bayNumber: 3
        },
        confidenceScore: 0.94,
        verifiedImmutable: true
      }
    ],
    officerNotes: [
      {
        id: 'NOTE-041-1',
        caseId: 'CASE-2026-041',
        officerId: 'off-delhi-042',
        officerBadge: 'FSO-IND-9021',
        officerName: 'P. Verma',
        createdAt: '2026-09-05T09:05:00Z',
        noteText: 'Discrepancy exceeds permissible process expansion limits by over 8x. Automated hold order placed on storage Silo-04 pending physical verification of blending manifold.',
        actionTaken: 'EVIDENTIARY_FREEZE'
      },
      {
        id: 'NOTE-041-2',
        caseId: 'CASE-2026-041',
        officerId: 'off-delhi-042',
        officerBadge: 'FSO-IND-9021',
        officerName: 'P. Verma',
        createdAt: '2026-09-05T09:15:00Z',
        noteText: 'Field team dispatched to Ludhiana Central Facility for physical seal inspection and lab sampling. MilkyWay highlighted Silo-04 and transfer manifold B.',
        actionTaken: 'DISPATCHED_INSPECTION_TEAM'
      }
    ],
    brief: {
      id: 'BRF-041',
      caseId: 'CASE-2026-041',
      generatedAt: '2026-09-05T08:55:00Z',
      agentVersion: 'ADK-MilkyWay-Agent-v1.2',
      summary: 'High-confidence volume discrepancy detected at Ludhiana Central Dairy Processing Facility for batch MW-PB-26-0901. Output volume exceeds recorded intake by +1,420 litres (+10.0%).',
      discrepancyAnalysis: 'Deterministic mass-balance computation detected an unverified volume gain. Neither thermal coefficient adjustments nor routine processing additives account for an expansion of this magnitude.',
      hypothesesForFieldInspector: [
        'Unmetered diluent or external liquid introduced at transfer manifold B prior to pasteurizer input.',
        'Flow meter calibration drift at discharge line Silo-04 requiring recalibration against certified standard volume.',
        'Unrecorded batch blending from secondary buffer tank.'
      ],
      recommendedInspectionFocus: {
        facilityId: 'FAC-LUD-02',
        facilityName: 'Ludhiana Central Dairy Processing Facility',
        specificChecklist: [
          'Inspect physical seals on Blending Manifold B and Silo-04 discharge valves.',
          'Execute certified volumetric draw on Flow Meter FM-LUD-12.',
          'Secure split representative milk samples from Silo-04 for accredited laboratory compositional analysis.'
        ],
        urgency: 'IMMEDIATE'
      },
      nonDiagnosticDisclaimer: 'MilkyWay identifies unexplained supply-chain discrepancies and movement anomalies to prioritize physical inspections. This brief does NOT determine whether milk is adulterated or contaminated; physical inspection and laboratory testing are required.'
    }
  },
  {
    id: 'CASE-2026-042',
    caseNumber: 'INV-FSO-2026-042',
    batchId: 'BATCH-2026-0894',
    batchCode: 'MW-PB-26-0894',
    facilityId: 'FAC-JAL-04',
    facilityName: 'Jalandhar Industrial Cold Chilling Plant',
    primaryAnomalyId: 'ANOM-2026-0812',
    primaryAnomalyType: 'VELOCITY_IMPOSSIBILITY',
    priority: 'IMMEDIATE',
    status: 'ACTIVE_ANALYSIS',
    discrepancyLitres: 0,
    variancePercentage: 0.0,
    assignedOfficerId: 'off-delhi-042',
    assignedOfficerName: 'P. Verma',
    createdAt: '2026-09-05T07:50:00Z',
    updatedAt: '2026-09-05T08:20:00Z',
    evidenceItems: [
      {
        id: 'EVD-042-1',
        caseId: 'CASE-2026-042',
        title: 'Highway GPS Velocity Audit',
        type: 'GPS_VELOCITY_LOG',
        mcpToolSource: 'get_vehicle_history',
        retrievedAt: '2026-09-05T07:52:00Z',
        details: 'Transit time recorded as 28 minutes for 82 km corridor between Amritsar and Jalandhar, implying an impossible sustained speed of 175.7 km/h.',
        structuredData: {
          recordedTransitMinutes: 28,
          minimumPhysicalTransitMinutes: 75,
          distanceKm: 82
        },
        confidenceScore: 0.99,
        verifiedImmutable: true
      }
    ],
    officerNotes: [
      {
        id: 'NOTE-042-1',
        caseId: 'CASE-2026-042',
        officerId: 'off-delhi-042',
        officerBadge: 'FSO-IND-9021',
        officerName: 'P. Verma',
        createdAt: '2026-09-05T08:15:00Z',
        noteText: 'Reviewing toll plaza fastag transit timestamps to verify if tanker physically departed at the logged dispatch timestamp or if dispatch was pre-logged retrospectively.',
        actionTaken: 'INTERNAL_REVIEW'
      }
    ]
  },
  {
    id: 'CASE-2026-043',
    caseNumber: 'INV-FSO-2026-043',
    batchId: 'BATCH-2026-0887',
    batchCode: 'MW-PB-26-0887',
    facilityId: 'FAC-LUD-02',
    facilityName: 'Ludhiana Central Dairy Processing Facility',
    primaryAnomalyId: 'ANOM-2026-0813',
    primaryAnomalyType: 'MASS_BALANCE_EXCESSIVE_LOSS',
    priority: 'HIGH',
    status: 'ASSIGNED',
    discrepancyLitres: -890,
    variancePercentage: -6.14,
    assignedOfficerId: 'off-delhi-042',
    assignedOfficerName: 'P. Verma',
    createdAt: '2026-09-05T06:20:00Z',
    updatedAt: '2026-09-05T06:30:00Z',
    evidenceItems: [],
    officerNotes: []
  },
  {
    id: 'CASE-2026-044',
    caseNumber: 'INV-FSO-2026-044',
    batchId: 'BATCH-2026-0870',
    batchCode: 'MW-HR-26-0870',
    facilityId: 'FAC-SON-09',
    facilityName: 'Sonipat Distribution Depot & Packaging Hub',
    primaryAnomalyId: 'ANOM-2026-0814',
    primaryAnomalyType: 'TEMPERATURE_EXCURSION',
    priority: 'MEDIUM',
    status: 'QUEUED',
    discrepancyLitres: 0,
    variancePercentage: 0.0,
    createdAt: '2026-09-04T22:30:00Z',
    updatedAt: '2026-09-04T22:30:00Z',
    evidenceItems: [],
    officerNotes: []
  }
];

export const SEED_ALERTS: ActiveAlert[] = [
  {
    id: 'ALT-001',
    anomalyId: 'ANOM-2026-0811',
    batchId: 'BATCH-2026-0901',
    facilityId: 'FAC-LUD-02',
    facilityName: 'Ludhiana Central Dairy Processing Facility',
    title: 'Surplus Mass Balance Discrepancy (+1,420 L)',
    summary: 'Post-pasteurization volume exceeds intake by +10.0%. Escalated for immediate physical facility inspection.',
    severity: 'CRITICAL',
    createdAt: '2026-09-05T08:42:15Z',
    isRead: false,
    inspectionPriority: 'IMMEDIATE'
  },
  {
    id: 'ALT-002',
    anomalyId: 'ANOM-2026-0812',
    batchId: 'BATCH-2026-0894',
    facilityId: 'FAC-JAL-04',
    facilityName: 'Jalandhar Industrial Cold Chilling Plant',
    title: 'Highway Transit Velocity Impossibility (175.7 km/h)',
    summary: 'Tanker transit logged in 28 mins for 82 km highway route. Possible retrospective check-in or route diversion.',
    severity: 'CRITICAL',
    createdAt: '2026-09-05T07:44:00Z',
    isRead: false,
    inspectionPriority: 'IMMEDIATE'
  },
  {
    id: 'ALT-003',
    anomalyId: 'ANOM-2026-0813',
    batchId: 'BATCH-2026-0887',
    facilityId: 'FAC-LUD-02',
    facilityName: 'Ludhiana Central Dairy Processing Facility',
    title: 'Excessive Process Shrinkage Loss (-890 L)',
    summary: 'Transfer volume loss exceeds permissible evaporation threshold by 7.7x.',
    severity: 'WARNING',
    createdAt: '2026-09-05T06:10:30Z',
    isRead: true,
    inspectionPriority: 'HIGH'
  },
  {
    id: 'ALT-004',
    anomalyId: 'ANOM-2026-0814',
    batchId: 'BATCH-2026-0870',
    facilityId: 'FAC-SON-09',
    facilityName: 'Sonipat Distribution Depot & Packaging Hub',
    title: 'Cold-Chain Thermal Excursion (> 8.4°C for 3h 20m)',
    summary: 'Storage Silo-02 thermal excursion logged prior to retail packaging dispatch.',
    severity: 'ADVISORY',
    createdAt: '2026-09-04T22:15:00Z',
    isRead: true,
    inspectionPriority: 'SCHEDULED'
  }
];
