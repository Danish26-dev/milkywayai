/**
 * MilkyWay Deterministic Anomaly Detection Engine
 * 
 * ARCHITECTURAL CONSTRAINTS & COMPLIANCE:
 * 1. ZERO LLM / GEMINI USAGE: All anomaly detection and arithmetic calculations are 100% deterministic
 *    server-side code. Gemini is NEVER asked to perform arithmetic or infer anomalies from raw quantities.
 * 2. EXACTLY TWO MVP ANOMALY TYPES:
 *    - MASS_BALANCE: Inflow vs. expected vs. actual output using configurable shrinkage rates.
 *    - IMPOSSIBLE_MOVEMENT: Haversine distance / elapsed time implied speed audits against maximum velocity.
 * 3. NON-DIAGNOSTIC INVESTIGATION LANGUAGE:
 *    Uses strictly: "Supply-chain anomaly detected.", "Investigation signal.", "Unexplained quantity discrepancy.",
 *    "Physically implausible movement."
 *    NEVER asserts: "Adulteration detected", "Milk is adulterated", or percentage claims of adulteration.
 * 4. CONFIGURABLE DEMO CONFIGURATION:
 *    Thresholds and shrinkage rates are clearly designated as demo configuration, not universal scientific facts.
 */

import { BigQueryEvent, BigQueryFacility } from './bigquery/schema';

export type AnomalyType = 'MASS_BALANCE' | 'IMPOSSIBLE_MOVEMENT';
export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AnomalyStatus = 'OPEN_INVESTIGATION' | 'UNDER_REVIEW' | 'ESCALATED_FOR_INSPECTION' | 'RESOLVED_EXPLAINED';

/**
 * Standard Deterministic Anomaly Object
 */
export interface DeterministicAnomaly {
  anomaly_id: string;
  batch_id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  observed_value: number;
  expected_value: number;
  difference: number;
  supporting_events: string[];
  detected_at: string;
  status: AnomalyStatus;
  
  // Non-diagnostic investigation language & audit details
  title: string;
  investigation_signal: string;
  investigation_language: string;
  possible_explanations: string[];
  computation_rule: string;
  metadata?: Record<string, any>;
}

/**
 * Demo Configuration Table for Process Shrinkage & Tolerances
 * Configurable per process type. Designated as demo configuration.
 */
export interface ProcessShrinkageConfig {
  process_type: string;
  shrinkage_rate: number; // e.g. 0.02 for 2%
  tolerance_litres: number; // e.g. 15.0 L
  effective_from: string;
  is_demo_configuration: boolean;
  notes: string;
}

/**
 * Demo Configuration for Velocity & Physical Transit Audits
 */
export interface MovementAuditConfig {
  configured_plausible_max_speed: number; // km/h (e.g. 80.0 km/h for heavy insulated milk tankers)
  min_elapsed_seconds: number; // Minimum seconds between events to prevent division by zero / jitter
  effective_from: string;
  is_demo_configuration: boolean;
  notes: string;
}

/**
 * Default Demo Configuration Tables
 */
export const DEFAULT_PROCESS_CONFIGS: Record<string, ProcessShrinkageConfig> = {
  PASTEURIZATION: {
    process_type: 'PASTEURIZATION',
    shrinkage_rate: 0.02, // 2.0% demo shrinkage
    tolerance_litres: 15.0, // 15 L allowable discrepancy
    effective_from: '2026-01-01T00:00:00.000Z',
    is_demo_configuration: true,
    notes: 'Demo configuration for thermal evaporation and pipe clearance allowance. Not a universal constant.'
  },
  CHILLING: {
    process_type: 'CHILLING',
    shrinkage_rate: 0.005, // 0.5% demo shrinkage
    tolerance_litres: 10.0,
    effective_from: '2026-01-01T00:00:00.000Z',
    is_demo_configuration: true,
    notes: 'Demo configuration for bulk chilling vat transfer and sampling.'
  },
  DEFAULT: {
    process_type: 'DEFAULT',
    shrinkage_rate: 0.02, // 2.0% default shrinkage
    tolerance_litres: 15.0,
    effective_from: '2026-01-01T00:00:00.000Z',
    is_demo_configuration: true,
    notes: 'Standard demo baseline for unclassified processing stages.'
  }
};

export const DEFAULT_MOVEMENT_CONFIG: MovementAuditConfig = {
  configured_plausible_max_speed: 80.0, // 80.0 km/h max plausible speed for heavy milk tankers
  min_elapsed_seconds: 60, // 1 minute
  effective_from: '2026-01-01T00:00:00.000Z',
  is_demo_configuration: true,
  notes: 'Demo threshold for highway road tanker maximum physical speed. Requires GIS verification.'
};

/**
 * Haversine formula to compute great-circle distance between two GPS coordinates in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  
  const R = 6371.0; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Deterministic Anomaly Detection Engine
 */
export class DeterministicAnomalyEngine {
  private processConfigs: Map<string, ProcessShrinkageConfig> = new Map();
  private movementConfig: MovementAuditConfig;

  constructor(
    initialProcessConfigs?: ProcessShrinkageConfig[],
    initialMovementConfig?: MovementAuditConfig
  ) {
    // Populate default demo configs
    Object.values(DEFAULT_PROCESS_CONFIGS).forEach(cfg => {
      this.processConfigs.set(cfg.process_type.toUpperCase(), { ...cfg });
    });

    if (initialProcessConfigs) {
      initialProcessConfigs.forEach(cfg => {
        this.processConfigs.set(cfg.process_type.toUpperCase(), { ...cfg });
      });
    }

    this.movementConfig = initialMovementConfig ? { ...initialMovementConfig } : { ...DEFAULT_MOVEMENT_CONFIG };
  }

  /**
   * Get all configurable process shrinkage parameters
   */
  public getProcessConfigs(): ProcessShrinkageConfig[] {
    return Array.from(this.processConfigs.values());
  }

  /**
   * Update or add a process configuration (Demo configuration only)
   */
  public setProcessConfig(config: ProcessShrinkageConfig): void {
    this.processConfigs.set(config.process_type.toUpperCase(), {
      ...config,
      is_demo_configuration: true
    });
  }

  /**
   * Get current movement audit configuration
   */
  public getMovementConfig(): MovementAuditConfig {
    return { ...this.movementConfig };
  }

  /**
   * Update movement audit configuration
   */
  public setMovementConfig(config: Partial<MovementAuditConfig>): void {
    this.movementConfig = {
      ...this.movementConfig,
      ...config,
      is_demo_configuration: true
    };
  }

  /**
   * Evaluates Mass-Balance Anomaly for a given batch and its chronologically ordered events.
   * 
   * FORMULA:
   * expected_output = input_quantity * (1 - shrinkage_rate)
   * unaccounted = expected_output - actual_output
   * Flag when: unaccounted > configured tolerance
   * 
   * SEVERITY DETERMINATION:
   * - HIGH: Unaccounted volume > 200 L OR variance > 20%
   * - MEDIUM: Unaccounted volume > 50 L OR variance > 5%
   * - LOW: Unaccounted volume > tolerance_litres
   */
  public evaluateMassBalance(
    batchId: string,
    initialQuantityLitres: number,
    events: BigQueryEvent[],
    processType: string = 'DEFAULT'
  ): DeterministicAnomaly | null {
    if (!events || events.length === 0 || initialQuantityLitres <= 0) {
      return null;
    }

    // Sort events chronologically
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Identify collection intake, processing, dispatch, and final received events
    const intakeEvent = sorted.find(e => e.event_type === 'MILK_COLLECTED' || e.event_type === 'FARM_MILK_COLLECTION') || sorted[0];
    const processedEvent = sorted.find(e => e.event_type === 'PROCESSED' || e.event_type === 'PROCESSING_INTAKE' || e.event_type === 'PROCESSING_OUTPUT');
    const dispatchedEvent = sorted.find(e => e.event_type === 'DISPATCHED' || e.event_type === 'TANKER_DISPATCH');
    const receivedEvent = [...sorted].reverse().find(e => e.event_type === 'RECEIVED' || e.event_type === 'CHILLING_CHECKIN');

    // Retrieve configured shrinkage rate
    const config = this.processConfigs.get(processType.toUpperCase()) || 
                   this.processConfigs.get('DEFAULT') || 
                   DEFAULT_PROCESS_CONFIGS.DEFAULT;

    const inputQuantity = intakeEvent ? intakeEvent.quantity_litres : initialQuantityLitres;
    
    // Formula: expected_output = input_quantity * (1 - shrinkage_rate)
    const expectedOutput = Number((inputQuantity * (1 - config.shrinkage_rate)).toFixed(2));

    // Determine actual recorded output volume
    // If dispatched event exists after processing, use dispatched or final received
    let actualOutput = inputQuantity;
    const supportingEventIds: string[] = [];

    if (intakeEvent) supportingEventIds.push(intakeEvent.event_id);
    if (processedEvent) supportingEventIds.push(processedEvent.event_id);
    if (dispatchedEvent) {
      actualOutput = dispatchedEvent.quantity_litres;
      supportingEventIds.push(dispatchedEvent.event_id);
    } else if (receivedEvent && receivedEvent !== intakeEvent) {
      actualOutput = receivedEvent.quantity_litres;
      supportingEventIds.push(receivedEvent.event_id);
    } else if (sorted.length > 1) {
      actualOutput = sorted[sorted.length - 1].quantity_litres;
      supportingEventIds.push(sorted[sorted.length - 1].event_id);
    }

    // Formula: unaccounted = expected_output - actual_output
    const unaccounted = Number((expectedOutput - actualOutput).toFixed(2));
    const variancePct = inputQuantity > 0 ? Number(((unaccounted / inputQuantity) * 100).toFixed(2)) : 0;

    // Flag condition: unaccounted > configured tolerance
    if (unaccounted > config.tolerance_litres) {
      // Deterministic severity rule
      let severity: AnomalySeverity = 'LOW';
      if (unaccounted > 200 || variancePct > 20) {
        severity = 'HIGH';
      } else if (unaccounted > 50 || variancePct > 5) {
        severity = 'MEDIUM';
      }

      return {
        anomaly_id: `ANOM-MB-${batchId}-${Date.now().toString(36)}`,
        batch_id: batchId,
        type: 'MASS_BALANCE',
        severity,
        observed_value: actualOutput,
        expected_value: expectedOutput,
        difference: unaccounted,
        supporting_events: supportingEventIds,
        detected_at: new Date().toISOString(),
        status: 'OPEN_INVESTIGATION',
        title: `Unexplained quantity discrepancy (${unaccounted} L unaccounted)`,
        investigation_signal: 'Supply-chain anomaly detected.',
        investigation_language: `Deterministic mass-balance computation detected an unexplained quantity discrepancy of ${unaccounted} L between expected processing output (${expectedOutput} L) and recorded output (${actualOutput} L) under configured shrinkage rate (${(config.shrinkage_rate * 100).toFixed(1)}%). Requires physical inspection and facility log audit to verify.`,
        possible_explanations: [
          'Unmetered volume transfer or line valve bypass',
          'Flow-meter calibration error or measurement drift',
          'Unregistered intermediate batch split or diversion',
          'Facility evaporation or tank bottom retention beyond standard parameter',
          'Data-entry discrepancy on dispatch manifest'
        ],
        computation_rule: `expected_output = input_quantity (${inputQuantity} L) × (1 - ${config.shrinkage_rate}) = ${expectedOutput} L; unaccounted = ${expectedOutput} L - ${actualOutput} L = ${unaccounted} L > tolerance (${config.tolerance_litres} L)`,
        metadata: {
          input_quantity_litres: inputQuantity,
          shrinkage_rate: config.shrinkage_rate,
          tolerance_litres: config.tolerance_litres,
          variance_percentage: variancePct,
          is_demo_configuration: true
        }
      };
    }

    return null;
  }

  /**
   * Evaluates Impossible Movement Anomalies for consecutive location events in a batch.
   * 
   * FORMULA:
   * distance / elapsed_time = implied_speed
   * Flag when: implied_speed > configured_plausible_max_speed
   * 
   * SEVERITY DETERMINATION:
   * - HIGH: implied_speed > 150 km/h (Physically impossible for heavy road tanker)
   * - MEDIUM: implied_speed > 100 km/h (Exceeds regulatory and heavy transit limits)
   * - LOW: implied_speed > configured_plausible_max_speed (80 km/h)
   * 
   * NON-DIAGNOSTIC POLICY:
   * Do not claim the event is fraudulent.
   * Possible explanations include:
   * - Data-entry error
   * - Incorrect timestamp
   * - GPS problem
   * - Incorrect facility record
   * - Suspicious movement
   */
  public evaluateImpossibleMovements(
    batchId: string,
    events: BigQueryEvent[],
    facilitiesMap?: Map<string, BigQueryFacility>
  ): DeterministicAnomaly[] {
    if (!events || events.length < 2) {
      return [];
    }

    const anomalies: DeterministicAnomaly[] = [];

    // Sort chronologically
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const prev = sorted[i];
      const curr = sorted[i + 1];

      // Resolve GPS coordinates: from event directly or from facility mapping
      let lat1 = prev.latitude;
      let lon1 = prev.longitude;
      let lat2 = curr.latitude;
      let lon2 = curr.longitude;

      if ((lat1 == null || lon1 == null) && prev.facility_id && facilitiesMap) {
        const fac = facilitiesMap.get(prev.facility_id);
        if (fac) {
          lat1 = fac.latitude;
          lon1 = fac.longitude;
        }
      }

      if ((lat2 == null || lon2 == null) && curr.facility_id && facilitiesMap) {
        const fac = facilitiesMap.get(curr.facility_id);
        if (fac) {
          lat2 = fac.latitude;
          lon2 = fac.longitude;
        }
      }

      // If either coordinate is still unknown, cannot compute distance
      if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
        continue;
      }

      const distanceKm = calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);
      
      // Calculate elapsed time in hours
      const timePrev = new Date(prev.timestamp).getTime();
      const timeCurr = new Date(curr.timestamp).getTime();
      const elapsedSeconds = (timeCurr - timePrev) / 1000;

      // Skip stationary / same-point events with zero distance
      if (distanceKm < 0.5) {
        continue;
      }

      // Timestamp anomaly or zero elapsed time
      if (elapsedSeconds <= 0) {
        anomalies.push({
          anomaly_id: `ANOM-MV-TS-${batchId}-${i}-${Date.now().toString(36)}`,
          batch_id: batchId,
          type: 'IMPOSSIBLE_MOVEMENT',
          severity: 'HIGH',
          observed_value: 0,
          expected_value: 1,
          difference: elapsedSeconds,
          supporting_events: [prev.event_id, curr.event_id],
          detected_at: new Date().toISOString(),
          status: 'OPEN_INVESTIGATION',
          title: `Physically implausible movement (${distanceKm} km with non-positive elapsed time)`,
          investigation_signal: 'Investigation signal.',
          investigation_language: `Physically implausible movement detected: consecutive events at locations ${distanceKm} km apart have simultaneous or reversed timestamps (${prev.timestamp} vs ${curr.timestamp}).`,
          possible_explanations: [
            'Data-entry error',
            'Incorrect timestamp',
            'GPS problem',
            'Incorrect facility record',
            'Suspicious movement'
          ],
          computation_rule: `distance = ${distanceKm} km; elapsed_time = ${elapsedSeconds} s <= 0 (Non-positive time delta between locations)`,
          metadata: {
            distance_km: distanceKm,
            elapsed_seconds: elapsedSeconds,
            origin_event_id: prev.event_id,
            destination_event_id: curr.event_id
          }
        });
        continue;
      }

      const elapsedHours = elapsedSeconds / 3600;
      const impliedSpeed = Number((distanceKm / elapsedHours).toFixed(2));
      const maxSpeed = this.movementConfig.configured_plausible_max_speed;

      // Flag when implied_speed > configured_plausible_max_speed
      if (impliedSpeed > maxSpeed) {
        let severity: AnomalySeverity = 'LOW';
        if (impliedSpeed > 150) {
          severity = 'HIGH';
        } else if (impliedSpeed > 100) {
          severity = 'MEDIUM';
        }

        const difference = Number((impliedSpeed - maxSpeed).toFixed(2));

        anomalies.push({
          anomaly_id: `ANOM-MV-${batchId}-${i}-${Date.now().toString(36)}`,
          batch_id: batchId,
          type: 'IMPOSSIBLE_MOVEMENT',
          severity,
          observed_value: impliedSpeed,
          expected_value: maxSpeed,
          difference,
          supporting_events: [prev.event_id, curr.event_id],
          detected_at: new Date().toISOString(),
          status: 'OPEN_INVESTIGATION',
          title: `Physically implausible movement (${impliedSpeed} km/h vs max ${maxSpeed} km/h)`,
          investigation_signal: 'Investigation signal.',
          investigation_language: `Physically implausible movement detected: consecutive transit events indicate implied speed of ${impliedSpeed} km/h over ${distanceKm} km in ${(elapsedSeconds / 60).toFixed(1)} minutes, exceeding configured maximum plausible speed (${maxSpeed} km/h).`,
          possible_explanations: [
            'Data-entry error',
            'Incorrect timestamp',
            'GPS problem',
            'Incorrect facility record',
            'Suspicious movement'
          ],
          computation_rule: `implied_speed = distance (${distanceKm} km) / elapsed_time (${elapsedHours.toFixed(2)} h) = ${impliedSpeed} km/h > configured_max (${maxSpeed} km/h)`,
          metadata: {
            distance_km: distanceKm,
            elapsed_minutes: Number((elapsedSeconds / 60).toFixed(1)),
            implied_speed_kmh: impliedSpeed,
            configured_plausible_max_speed: maxSpeed,
            origin_event: prev.event_id,
            destination_event: curr.event_id,
            is_demo_configuration: true
          }
        });
      }
    }

    return anomalies;
  }

  /**
   * Evaluates all deterministic anomalies for a given batch.
   */
  public evaluateBatch(
    batchId: string,
    initialQuantityLitres: number,
    events: BigQueryEvent[],
    facilitiesMap?: Map<string, BigQueryFacility>,
    processType: string = 'DEFAULT'
  ): DeterministicAnomaly[] {
    const results: DeterministicAnomaly[] = [];

    // 1. Mass Balance Evaluation
    const mbAnomaly = this.evaluateMassBalance(batchId, initialQuantityLitres, events, processType);
    if (mbAnomaly) {
      results.push(mbAnomaly);
    }

    // 2. Impossible Movement Evaluation
    const mvAnomalies = this.evaluateImpossibleMovements(batchId, events, facilitiesMap);
    results.push(...mvAnomalies);

    return results;
  }
}

// Global deterministic anomaly engine singleton instance
export const deterministicAnomalyEngine = new DeterministicAnomalyEngine();
