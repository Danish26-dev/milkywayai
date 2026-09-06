/**
 * MilkyWay BigQuery Supply-Chain Event Journal — Schema & DDL
 * 
 * ARCHITECTURAL DIRECTIVES:
 * 1. BigQuery is NOT an OLTP database; it is an APPEND-ONLY SUPPLY-CHAIN EVENT JOURNAL.
 * 2. Events should never be destructively updated or deleted during normal operation.
 * 3. Corrections are represented as new compensating events referencing the original event ID.
 * 4. The browser NEVER queries BigQuery directly; only backend Cloud Run services have access.
 */

export interface BigQueryBatch {
  batch_id: string;
  origin_facility_id: string;
  initial_quantity_litres: number;
  created_at: string; // ISO 8601 Timestamp
  status: 'IN_TRANSIT' | 'COMPLETED' | 'FLAGGED_DISCREPANCY' | 'ANOMALY_DETECTED' | string;
}

export type SupplyChainEventType = 
  | 'MILK_COLLECTED'
  | 'TRANSFERRED'
  | 'PROCESSED'
  | 'STORED'
  | 'DISPATCHED'
  | 'RECEIVED'
  | string; // Extensible

/**
 * Canonical supply-chain event types accepted by the ingestion boundary.
 * The journal ingestion API validates event_type against exactly this list;
 * no new/incompatible event types may be introduced by clients.
 */
export const CANONICAL_EVENT_TYPES = [
  'MILK_COLLECTED',
  'TRANSFERRED',
  'PROCESSED',
  'STORED',
  'DISPATCHED',
  'RECEIVED'
] as const;

export interface BigQueryEvent {
  event_id: string;
  batch_id: string;
  event_type: SupplyChainEventType;
  actor_id: string;
  facility_id: string | null;
  vehicle_id: string | null;
  quantity_litres: number;
  timestamp: string; // ISO 8601 Timestamp
  latitude: number | null;
  longitude: number | null;
  metadata: string; // JSON string
  created_at: string; // ISO 8601 Timestamp
}

export interface BigQueryFacility {
  facility_id: string;
  name: string;
  facility_type: 'COLLECTION_CENTER' | 'CHILLING_HUB' | 'PROCESSING_PLANT' | 'DISTRIBUTION_DEPOT' | string;
  location: string;
  latitude: number;
  longitude: number;
  active: boolean;
  created_at: string;
}

export interface BigQueryVehicle {
  vehicle_id: string;
  registration_number: string;
  vehicle_type: 'INSULATED_TANKER' | 'REFRIGERATED_TANKER' | 'HEAVY_CHILLED_TANKER' | 'STANDARD_BULK_CARRIER' | string;
  capacity_litres: number;
  active: boolean;
  created_at: string;
}

export interface BigQueryAnomaly {
  anomaly_id: string;
  batch_id: string;
  // Canonical MVP anomaly types only: MASS_BALANCE | IMPOSSIBLE_MOVEMENT
  anomaly_type: 'MASS_BALANCE' | 'IMPOSSIBLE_MOVEMENT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  observed_value: number;
  expected_value: number;
  difference_value: number;
  evidence: string;
  detected_at: string;
  status: 'OPEN_INVESTIGATION' | 'UNDER_REVIEW' | 'ESCALATED_FOR_INSPECTION' | 'RESOLVED_EXPLAINED';
}

/**
 * BigQuery DDL Definitions for dataset provisioning
 */
export const BIGQUERY_DATASET_ID = 'milkyway_journal';

export const BIGQUERY_TABLE_SCHEMAS = {
  batches: [
    { name: 'batch_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique immutable identifier of the milk batch' },
    { name: 'origin_facility_id', type: 'STRING', mode: 'REQUIRED', description: 'Facility ID where batch was first collected' },
    { name: 'initial_quantity_litres', type: 'FLOAT64', mode: 'REQUIRED', description: 'Initial volume in litres at collection intake' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Creation timestamp of the batch' },
    { name: 'status', type: 'STRING', mode: 'REQUIRED', description: 'Lifecycle status of the batch' }
  ],
  events: [
    { name: 'event_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique immutable event identifier' },
    { name: 'batch_id', type: 'STRING', mode: 'REQUIRED', description: 'Associated batch identifier' },
    { name: 'event_type', type: 'STRING', mode: 'REQUIRED', description: 'Lifecycle event type (MILK_COLLECTED, TRANSFERRED, etc.)' },
    { name: 'actor_id', type: 'STRING', mode: 'REQUIRED', description: 'Officer, operator, or automated sensor actor identifier' },
    { name: 'facility_id', type: 'STRING', mode: 'NULLABLE', description: 'Associated physical facility ID' },
    { name: 'vehicle_id', type: 'STRING', mode: 'NULLABLE', description: 'Associated transport tanker ID' },
    { name: 'quantity_litres', type: 'FLOAT64', mode: 'REQUIRED', description: 'Volume in litres measured at event' },
    { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Physical event occurrence timestamp' },
    { name: 'latitude', type: 'FLOAT64', mode: 'NULLABLE', description: 'GPS Latitude of event location' },
    { name: 'longitude', type: 'FLOAT64', mode: 'NULLABLE', description: 'GPS Longitude of event location' },
    { name: 'metadata', type: 'STRING', mode: 'REQUIRED', description: 'JSON-serialized metadata (temperature, fat, snf, sealNumber)' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Journal ledger ingestion timestamp' }
  ],
  facilities: [
    { name: 'facility_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique facility identifier' },
    { name: 'name', type: 'STRING', mode: 'REQUIRED', description: 'Official registered name of facility' },
    { name: 'facility_type', type: 'STRING', mode: 'REQUIRED', description: 'Classification (COLLECTION_CENTER, CHILLING_HUB, etc.)' },
    { name: 'location', type: 'STRING', mode: 'REQUIRED', description: 'Geographic town/district and state' },
    { name: 'latitude', type: 'FLOAT64', mode: 'REQUIRED', description: 'GPS Latitude' },
    { name: 'longitude', type: 'FLOAT64', mode: 'REQUIRED', description: 'GPS Longitude' },
    { name: 'active', type: 'BOOL', mode: 'REQUIRED', description: 'Whether facility is currently operational' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Registration timestamp' }
  ],
  vehicles: [
    { name: 'vehicle_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique vehicle identifier' },
    { name: 'registration_number', type: 'STRING', mode: 'REQUIRED', description: 'Official transport registration number plate' },
    { name: 'vehicle_type', type: 'STRING', mode: 'REQUIRED', description: 'Tanker insulation and specification type' },
    { name: 'capacity_litres', type: 'FLOAT64', mode: 'REQUIRED', description: 'Max calibrated tanker volume in litres' },
    { name: 'active', type: 'BOOL', mode: 'REQUIRED', description: 'Whether vehicle is in active transit service' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Registration timestamp' }
  ],
  anomalies: [
    { name: 'anomaly_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique anomaly identifier' },
    { name: 'batch_id', type: 'STRING', mode: 'REQUIRED', description: 'Associated batch identifier' },
    { name: 'anomaly_type', type: 'STRING', mode: 'REQUIRED', description: 'Classification of the detected discrepancy' },
    { name: 'severity', type: 'STRING', mode: 'REQUIRED', description: 'Priority level (CRITICAL, HIGH, MEDIUM, LOW)' },
    { name: 'observed_value', type: 'FLOAT64', mode: 'REQUIRED', description: 'Empirically measured value in journal' },
    { name: 'expected_value', type: 'FLOAT64', mode: 'REQUIRED', description: 'Mathematically expected value based on mass balance' },
    { name: 'difference_value', type: 'FLOAT64', mode: 'REQUIRED', description: 'Unaccounted difference (observed - expected)' },
    { name: 'evidence', type: 'STRING', mode: 'REQUIRED', description: 'Deterministic computation evidence and audit note' },
    { name: 'detected_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Detection timestamp' },
    { name: 'status', type: 'STRING', mode: 'REQUIRED', description: 'Triage status (OPEN_INVESTIGATION, etc.)' }
  ]
};

export const BIGQUERY_DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS \`milkyway_journal.batches\` (
    batch_id STRING NOT NULL,
    origin_facility_id STRING NOT NULL,
    initial_quantity_litres FLOAT64 NOT NULL,
    created_at TIMESTAMP NOT NULL,
    status STRING NOT NULL
  ) OPTIONS (
    description = "Append-only journal of registered supply-chain milk batches"
  );`,

  `CREATE TABLE IF NOT EXISTS \`milkyway_journal.events\` (
    event_id STRING NOT NULL,
    batch_id STRING NOT NULL,
    event_type STRING NOT NULL,
    actor_id STRING NOT NULL,
    facility_id STRING,
    vehicle_id STRING,
    quantity_litres FLOAT64 NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    latitude FLOAT64,
    longitude FLOAT64,
    metadata STRING NOT NULL,
    created_at TIMESTAMP NOT NULL
  )
  PARTITION BY DATE(timestamp)
  CLUSTER BY batch_id, event_type
  OPTIONS (
    description = "Append-only supply chain event log. UPDATE and DELETE operations are forbidden."
  );`,

  `CREATE TABLE IF NOT EXISTS \`milkyway_journal.facilities\` (
    facility_id STRING NOT NULL,
    name STRING NOT NULL,
    facility_type STRING NOT NULL,
    location STRING NOT NULL,
    latitude FLOAT64 NOT NULL,
    longitude FLOAT64 NOT NULL,
    active BOOL NOT NULL,
    created_at TIMESTAMP NOT NULL
  ) OPTIONS (
    description = "Registered dairy collection centers, chilling plants, and processing units"
  );`,

  `CREATE TABLE IF NOT EXISTS \`milkyway_journal.vehicles\` (
    vehicle_id STRING NOT NULL,
    registration_number STRING NOT NULL,
    vehicle_type STRING NOT NULL,
    capacity_litres FLOAT64 NOT NULL,
    active BOOL NOT NULL,
    created_at TIMESTAMP NOT NULL
  ) OPTIONS (
    description = "Registered insulated milk transport tankers"
  );`,

  `CREATE TABLE IF NOT EXISTS \`milkyway_journal.anomalies\` (
    anomaly_id STRING NOT NULL,
    batch_id STRING NOT NULL,
    anomaly_type STRING NOT NULL,
    severity STRING NOT NULL,
    observed_value FLOAT64 NOT NULL,
    expected_value FLOAT64 NOT NULL,
    difference_value FLOAT64 NOT NULL,
    evidence STRING NOT NULL,
    detected_at TIMESTAMP NOT NULL,
    status STRING NOT NULL
  )
  CLUSTER BY batch_id, severity
  OPTIONS (
    description = "Deterministic mass-balance and velocity anomaly records"
  );`
];
