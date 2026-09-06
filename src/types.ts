export interface BatchRecord {
  id: string;
  facility: string;
  facilityName: string;
  inputLitres: number;
  expectedLossLitres: number;
  recordedOutputLitres: number;
  unaccountedLitres: number;
  status: 'DISCREPANCY_FLAGGED' | 'VERIFIED_NORMAL' | 'VELOCITY_ANOMALY';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  anomalyType: string;
  timestamp: string;
  vehicleId: string;
  route: string;
  evidence: string[];
  recommendedAction: string;
}

export interface SupplyChainNode {
  id: string;
  name: string;
  type: 'FARM' | 'COLLECTION' | 'PROCESSING' | 'DISTRIBUTION' | 'RETAIL';
  location: string;
  temperature: string;
  lastReading: string;
  status: 'normal' | 'flagged' | 'transit';
  metrics: {
    label: string;
    value: string;
  }[];
}

export interface InvestigationStep {
  step: number;
  tool: string;
  description: string;
  status: 'completed' | 'running' | 'pending';
  outputPreview: string;
  executionTimeMs: number;
}
