/**
 * Deterministic Seed Generator for MilkyWay BigQuery Event Journal
 * 
 * CORE REQUIREMENTS:
 * 1. Generate 3 batches:
 *    - Batch 1: Clean (normal variance < 0.5%)
 *    - Batch 2: Clean (normal variance < 0.5%)
 *    - Batch 3: Anomalous with significant mass-balance discrepancy:
 *        Input: 1000 L
 *        Expected output: 980 L
 *        Actual output: 650 L
 *        Unaccounted: 330 L
 * 2. Complete lifecycle events for every batch:
 *    MILK_COLLECTED -> TRANSFERRED -> STORED -> PROCESSED -> DISPATCHED -> RECEIVED
 * 3. Every event contains valid timestamps, actors, facility, and vehicle details.
 * 4. Non-diagnostic constraint: Never describe discrepancies as proof of adulteration.
 */

import {
  BigQueryBatch,
  BigQueryEvent,
  BigQueryFacility,
  BigQueryVehicle,
  BigQueryAnomaly
} from './schema';

export interface BigQuerySeedDataset {
  facilities: BigQueryFacility[];
  vehicles: BigQueryVehicle[];
  batches: BigQueryBatch[];
  events: BigQueryEvent[];
  anomalies: BigQueryAnomaly[];
}

export function generateDeterministicSeed(): BigQuerySeedDataset {
  // 1. Registered Facilities
  const facilities: BigQueryFacility[] = [
    {
      facility_id: 'FAC-ANAND-01',
      name: 'Anand District Milk Producers Cooperative',
      facility_type: 'COLLECTION_CENTER',
      location: 'Anand, Gujarat',
      latitude: 22.5645,
      longitude: 72.9289,
      active: true,
      created_at: '2026-01-10T00:00:00.000Z'
    },
    {
      facility_id: 'FAC-KAIRA-02',
      name: 'Kaira Regional Chilling & Vat Storage Center',
      facility_type: 'CHILLING_HUB',
      location: 'Kaira, Gujarat',
      latitude: 22.7533,
      longitude: 72.6822,
      active: true,
      created_at: '2026-01-15T00:00:00.000Z'
    },
    {
      facility_id: 'FAC-AMUL-03',
      name: 'Amul Western Processing Mega-Plant',
      facility_type: 'PROCESSING_PLANT',
      location: 'Gandhinagar, Gujarat',
      latitude: 23.2156,
      longitude: 72.6369,
      active: true,
      created_at: '2026-02-01T00:00:00.000Z'
    },
    {
      facility_id: 'FAC-AHMD-04',
      name: 'Ahmedabad Central Packaging & Distribution Depot',
      facility_type: 'DISTRIBUTION_DEPOT',
      location: 'Ahmedabad, Gujarat',
      latitude: 23.0225,
      longitude: 72.5714,
      active: true,
      created_at: '2026-02-15T00:00:00.000Z'
    }
  ];

  // 2. Registered Vehicles
  const vehicles: BigQueryVehicle[] = [
    {
      vehicle_id: 'VEH-GJ01-T8812',
      registration_number: 'GJ-01-T-8812',
      vehicle_type: 'INSULATED_TANKER',
      capacity_litres: 12000,
      active: true,
      created_at: '2026-01-12T00:00:00.000Z'
    },
    {
      vehicle_id: 'VEH-GJ07-T4421',
      registration_number: 'GJ-07-T-4421',
      vehicle_type: 'HEAVY_CHILLED_TANKER',
      capacity_litres: 18000,
      active: true,
      created_at: '2026-01-18T00:00:00.000Z'
    },
    {
      vehicle_id: 'VEH-GJ23-T9904',
      registration_number: 'GJ-23-T-9904',
      vehicle_type: 'STANDARD_BULK_CARRIER',
      capacity_litres: 8000,
      active: true,
      created_at: '2026-02-05T00:00:00.000Z'
    }
  ];

  // 3. Batches
  const batches: BigQueryBatch[] = [
    {
      batch_id: 'BATCH-DEMO-001-CLEAN',
      origin_facility_id: 'FAC-ANAND-01',
      initial_quantity_litres: 1200.0,
      created_at: '2026-09-04T05:00:00.000Z',
      status: 'COMPLETED'
    },
    {
      batch_id: 'BATCH-DEMO-002-CLEAN',
      origin_facility_id: 'FAC-ANAND-01',
      initial_quantity_litres: 2400.0,
      created_at: '2026-09-04T08:00:00.000Z',
      status: 'COMPLETED'
    },
    {
      batch_id: 'BATCH-DEMO-003-ANOMALOUS',
      origin_facility_id: 'FAC-ANAND-01',
      initial_quantity_litres: 1000.0,
      created_at: '2026-09-05T06:00:00.000Z',
      status: 'FLAGGED_DISCREPANCY'
    },
    {
      batch_id: 'MW-10482',
      origin_facility_id: 'FAC-ANAND-01',
      initial_quantity_litres: 1000.0,
      created_at: '2026-09-05T06:00:00.000Z',
      status: 'FLAGGED_DISCREPANCY'
    }
  ];

  // 4. Complete Lifecycle Events for Each Batch
  const events: BigQueryEvent[] = [
    // --- BATCH 1: CLEAN (1200 L collected -> 1178 L received, within standard 1.83% process allowance) ---
    {
      event_id: 'EVT-001-01',
      batch_id: 'BATCH-DEMO-001-CLEAN',
      event_type: 'MILK_COLLECTED',
      actor_id: 'ACT-OPERATOR-ANAND-01',
      facility_id: 'FAC-ANAND-01',
      vehicle_id: null,
      quantity_litres: 1200.0,
      timestamp: '2026-09-04T05:15:00.000Z',
      latitude: 22.5645,
      longitude: 72.9289,
      metadata: JSON.stringify({
        notes: 'Morning collection from verified dairy farmers in Anand cooperative circle',
        temperature_celsius: 4.2,
        fat_pct: 4.3,
        snf_pct: 8.7,
        seal_id: 'SEAL-AN-99120'
      }),
      created_at: '2026-09-04T05:15:12.000Z'
    },
    {
      event_id: 'EVT-001-02',
      batch_id: 'BATCH-DEMO-001-CLEAN',
      event_type: 'TRANSFERRED',
      actor_id: 'ACT-DRIVER-PATEL-08',
      facility_id: 'FAC-ANAND-01',
      vehicle_id: 'VEH-GJ01-T8812',
      quantity_litres: 1196.0, // 4L normal transfer hose retention (0.33%)
      timestamp: '2026-09-04T06:00:00.000Z',
      latitude: 22.5645,
      longitude: 72.9289,
      metadata: JSON.stringify({
        transfer_method: 'Hermetic suction pump transfer',
        flow_meter_id: 'FM-AN-PUMP-02',
        temperature_celsius: 4.3
      }),
      created_at: '2026-09-04T06:00:20.000Z'
    },
    {
      event_id: 'EVT-001-03',
      batch_id: 'BATCH-DEMO-001-CLEAN',
      event_type: 'STORED',
      actor_id: 'ACT-CHILLING-TECH-04',
      facility_id: 'FAC-KAIRA-02',
      vehicle_id: 'VEH-GJ01-T8812',
      quantity_litres: 1196.0,
      timestamp: '2026-09-04T07:15:00.000Z',
      latitude: 22.7533,
      longitude: 72.6822,
      metadata: JSON.stringify({
        vat_id: 'VAT-SILO-02',
        chilling_temp_celsius: 3.8,
        storage_duration_minutes: 135
      }),
      created_at: '2026-09-04T07:15:45.000Z'
    },
    {
      event_id: 'EVT-001-04',
      batch_id: 'BATCH-DEMO-001-CLEAN',
      event_type: 'PROCESSED',
      actor_id: 'ACT-PLANT-OPERATOR-AMUL-03',
      facility_id: 'FAC-AMUL-03',
      vehicle_id: null,
      quantity_litres: 1182.0, // 14L standard separator/pasteurization loss (1.17%)
      timestamp: '2026-09-04T09:30:00.000Z',
      latitude: 23.2156,
      longitude: 72.6369,
      metadata: JSON.stringify({
        process_step: 'HTST Pasteurization and Homogenization',
        pasteurizer_unit: 'PAST-MEGA-UNIT-01',
        inflow_litres: 1196.0,
        outflow_litres: 1182.0,
        evaporative_loss_pct: 1.17
      }),
      created_at: '2026-09-04T09:30:30.000Z'
    },
    {
      event_id: 'EVT-001-05',
      batch_id: 'BATCH-DEMO-001-CLEAN',
      event_type: 'DISPATCHED',
      actor_id: 'ACT-DISPATCH-SUPERVISOR-09',
      facility_id: 'FAC-AMUL-03',
      vehicle_id: 'VEH-GJ07-T4421',
      quantity_litres: 1182.0,
      timestamp: '2026-09-04T11:00:00.000Z',
      latitude: 23.2156,
      longitude: 72.6369,
      metadata: JSON.stringify({
        destination_facility: 'FAC-AHMD-04',
        tanker_seal_no: 'SEAL-DISP-4401',
        temperature_celsius: 3.9
      }),
      created_at: '2026-09-04T11:00:15.000Z'
    },
    {
      event_id: 'EVT-001-06',
      batch_id: 'BATCH-DEMO-001-CLEAN',
      event_type: 'RECEIVED',
      actor_id: 'ACT-DEPOT-RECEIVER-AHMD-01',
      facility_id: 'FAC-AHMD-04',
      vehicle_id: 'VEH-GJ07-T4421',
      quantity_litres: 1178.0, // 4L minor discharge adhesion loss (0.33%)
      timestamp: '2026-09-04T12:45:00.000Z',
      latitude: 23.0225,
      longitude: 72.5714,
      metadata: JSON.stringify({
        intake_tank: 'SILO-AHMD-NORTH-01',
        intact_seal_verified: true,
        temperature_celsius: 4.1,
        mass_balance_reconciled: true,
        total_process_shrinkage_litres: 22.0,
        shrinkage_pct: 1.83
      }),
      created_at: '2026-09-04T12:45:50.000Z'
    },

    // --- BATCH 2: CLEAN (2400 L collected -> 2358 L received, within standard 1.75% process allowance) ---
    {
      event_id: 'EVT-002-01',
      batch_id: 'BATCH-DEMO-002-CLEAN',
      event_type: 'MILK_COLLECTED',
      actor_id: 'ACT-OPERATOR-ANAND-02',
      facility_id: 'FAC-ANAND-01',
      vehicle_id: null,
      quantity_litres: 2400.0,
      timestamp: '2026-09-04T08:15:00.000Z',
      latitude: 22.5645,
      longitude: 72.9289,
      metadata: JSON.stringify({
        notes: 'Mid-morning consolidated batch from Anand North zone vats',
        temperature_celsius: 4.1,
        fat_pct: 4.4,
        snf_pct: 8.8,
        seal_id: 'SEAL-AN-99201'
      }),
      created_at: '2026-09-04T08:15:20.000Z'
    },
    {
      event_id: 'EVT-002-02',
      batch_id: 'BATCH-DEMO-002-CLEAN',
      event_type: 'TRANSFERRED',
      actor_id: 'ACT-DRIVER-SINGH-11',
      facility_id: 'FAC-ANAND-01',
      vehicle_id: 'VEH-GJ07-T4421',
      quantity_litres: 2392.0, // 8L transfer line retention (0.33%)
      timestamp: '2026-09-04T09:00:00.000Z',
      latitude: 22.5645,
      longitude: 72.9289,
      metadata: JSON.stringify({
        flow_meter_id: 'FM-AN-PUMP-01',
        temperature_celsius: 4.2
      }),
      created_at: '2026-09-04T09:00:35.000Z'
    },
    {
      event_id: 'EVT-002-03',
      batch_id: 'BATCH-DEMO-002-CLEAN',
      event_type: 'STORED',
      actor_id: 'ACT-CHILLING-TECH-04',
      facility_id: 'FAC-KAIRA-02',
      vehicle_id: 'VEH-GJ07-T4421',
      quantity_litres: 2392.0,
      timestamp: '2026-09-04T10:15:00.000Z',
      latitude: 22.7533,
      longitude: 72.6822,
      metadata: JSON.stringify({
        vat_id: 'VAT-SILO-04',
        chilling_temp_celsius: 3.7
      }),
      created_at: '2026-09-04T10:15:10.000Z'
    },
    {
      event_id: 'EVT-002-04',
      batch_id: 'BATCH-DEMO-002-CLEAN',
      event_type: 'PROCESSED',
      actor_id: 'ACT-PLANT-OPERATOR-AMUL-03',
      facility_id: 'FAC-AMUL-03',
      vehicle_id: null,
      quantity_litres: 2365.0, // 27L standard processing loss (1.13%)
      timestamp: '2026-09-04T13:00:00.000Z',
      latitude: 23.2156,
      longitude: 72.6369,
      metadata: JSON.stringify({
        process_step: 'Clarification, Pasteurization & Standardizing',
        pasteurizer_unit: 'PAST-MEGA-UNIT-02',
        inflow_litres: 2392.0,
        outflow_litres: 2365.0
      }),
      created_at: '2026-09-04T13:00:40.000Z'
    },
    {
      event_id: 'EVT-002-05',
      batch_id: 'BATCH-DEMO-002-CLEAN',
      event_type: 'DISPATCHED',
      actor_id: 'ACT-DISPATCH-SUPERVISOR-09',
      facility_id: 'FAC-AMUL-03',
      vehicle_id: 'VEH-GJ01-T8812',
      quantity_litres: 2365.0,
      timestamp: '2026-09-04T14:30:00.000Z',
      latitude: 23.2156,
      longitude: 72.6369,
      metadata: JSON.stringify({
        destination_facility: 'FAC-AHMD-04',
        tanker_seal_no: 'SEAL-DISP-4498',
        temperature_celsius: 3.8
      }),
      created_at: '2026-09-04T14:30:15.000Z'
    },
    {
      event_id: 'EVT-002-06',
      batch_id: 'BATCH-DEMO-002-CLEAN',
      event_type: 'RECEIVED',
      actor_id: 'ACT-DEPOT-RECEIVER-AHMD-01',
      facility_id: 'FAC-AHMD-04',
      vehicle_id: 'VEH-GJ01-T8812',
      quantity_litres: 2358.0, // 7L wall drainage loss (0.30%)
      timestamp: '2026-09-04T16:00:00.000Z',
      latitude: 23.0225,
      longitude: 72.5714,
      metadata: JSON.stringify({
        intake_tank: 'SILO-AHMD-SOUTH-02',
        intact_seal_verified: true,
        temperature_celsius: 4.0,
        mass_balance_reconciled: true,
        total_process_shrinkage_litres: 42.0,
        shrinkage_pct: 1.75
      }),
      created_at: '2026-09-04T16:00:55.000Z'
    },

    // --- BATCH 3: ANOMALOUS (Input: 1000 L -> Expected: 980 L -> Actual: 650 L -> Unaccounted: 330 L) ---
    {
      event_id: 'EVT-003-01',
      batch_id: 'BATCH-DEMO-003-ANOMALOUS',
      event_type: 'MILK_COLLECTED',
      actor_id: 'ACT-OPERATOR-ANAND-01',
      facility_id: 'FAC-ANAND-01',
      vehicle_id: null,
      quantity_litres: 1000.0, // Initial input: 1000 L
      timestamp: '2026-09-05T06:15:00.000Z',
      latitude: 22.5645,
      longitude: 72.9289,
      metadata: JSON.stringify({
        batch_description: 'Consolidated intake vat #3',
        initial_input_litres: 1000.0,
        temperature_celsius: 4.3,
        fat_pct: 4.2,
        snf_pct: 8.6,
        seal_id: 'SEAL-AN-99411'
      }),
      created_at: '2026-09-05T06:15:10.000Z'
    },
    {
      event_id: 'EVT-003-02',
      batch_id: 'BATCH-DEMO-003-ANOMALOUS',
      event_type: 'TRANSFERRED',
      actor_id: 'ACT-DRIVER-DESAI-14',
      facility_id: 'FAC-ANAND-01',
      vehicle_id: 'VEH-GJ23-T9904',
      quantity_litres: 995.0, // 5L normal transfer line clearance (0.5%)
      timestamp: '2026-09-05T07:00:00.000Z',
      latitude: 22.5645,
      longitude: 72.9289,
      metadata: JSON.stringify({
        flow_meter_id: 'FM-AN-PUMP-03',
        tanker_id: 'VEH-GJ23-T9904',
        temperature_celsius: 4.4
      }),
      created_at: '2026-09-05T07:00:25.000Z'
    },
    {
      event_id: 'EVT-003-03',
      batch_id: 'BATCH-DEMO-003-ANOMALOUS',
      event_type: 'STORED',
      actor_id: 'ACT-CHILLING-TECH-04',
      facility_id: 'FAC-KAIRA-02',
      vehicle_id: 'VEH-GJ23-T9904',
      quantity_litres: 995.0,
      timestamp: '2026-09-05T08:15:00.000Z',
      latitude: 22.7533,
      longitude: 72.6822,
      metadata: JSON.stringify({
        vat_id: 'VAT-SILO-05',
        temperature_celsius: 3.9
      }),
      created_at: '2026-09-05T08:15:30.000Z'
    },
    {
      event_id: 'EVT-003-04',
      batch_id: 'BATCH-DEMO-003-ANOMALOUS',
      event_type: 'PROCESSED',
      actor_id: 'ACT-PLANT-OPERATOR-AMUL-03',
      facility_id: 'FAC-AMUL-03',
      vehicle_id: null,
      quantity_litres: 980.0, // Expected output: 980 L after registered 15-20L processing shrinkage
      timestamp: '2026-09-05T10:30:00.000Z',
      latitude: 23.2156,
      longitude: 72.6369,
      metadata: JSON.stringify({
        process_step: 'Pasteurization Intake & Processing',
        pasteurizer_unit: 'PAST-MEGA-UNIT-01',
        inflow_litres: 995.0,
        expected_output_litres: 980.0, // Expected: 980 L
        registered_processing_tolerance_pct: 2.0
      }),
      created_at: '2026-09-05T10:30:15.000Z'
    },
    {
      event_id: 'EVT-003-05',
      batch_id: 'BATCH-DEMO-003-ANOMALOUS',
      event_type: 'DISPATCHED',
      actor_id: 'ACT-DISPATCH-SUPERVISOR-09',
      facility_id: 'FAC-AMUL-03',
      vehicle_id: 'VEH-GJ23-T9904',
      quantity_litres: 650.0, // Actual output: 650 L (Discrepancy: 330 L unaccounted!)
      timestamp: '2026-09-05T11:45:00.000Z',
      latitude: 23.2156,
      longitude: 72.6369,
      metadata: JSON.stringify({
        flowmeter_id: 'FM-DISP-PACK-04',
        observed_quantity_litres: 650.0, // Actual: 650 L
        expected_quantity_litres: 980.0, // Expected: 980 L
        unaccounted_discrepancy_litres: 330.0, // Unaccounted: 330 L
        discrepancy_percentage: -33.67,
        anomaly_flag: 'FLAG_MASS_BALANCE',
        destination_facility: 'FAC-AHMD-04',
        tanker_seal_no: 'SEAL-DISP-8802'
      }),
      created_at: '2026-09-05T11:45:30.000Z'
    },
    {
      event_id: 'EVT-003-06',
      batch_id: 'BATCH-DEMO-003-ANOMALOUS',
      event_type: 'RECEIVED',
      actor_id: 'ACT-DEPOT-RECEIVER-AHMD-01',
      facility_id: 'FAC-AHMD-04',
      vehicle_id: 'VEH-GJ23-T9904',
      quantity_litres: 645.0, // Final volume received: 645 L
      timestamp: '2026-09-05T13:30:00.000Z',
      latitude: 23.0225,
      longitude: 72.5714,
      metadata: JSON.stringify({
        intake_tank: 'SILO-AHMD-QUARANTINE-03',
        status_note: 'Quarantine silo assignment triggered by upstream volume discrepancy flag',
        temperature_celsius: 4.2,
        mass_balance_flagged: true
      }),
      created_at: '2026-09-05T13:30:45.000Z'
    },
    // --- BATCH MW-10482: Identical verified anomaly records for direct prompt resolution ---
    {
      event_id: 'EVT-MW-01',
      batch_id: 'MW-10482',
      event_type: 'MILK_COLLECTED',
      actor_id: 'ACT-OPERATOR-ANAND-01',
      facility_id: 'FAC-ANAND-01',
      vehicle_id: null,
      quantity_litres: 1000.0,
      timestamp: '2026-09-05T06:15:00.000Z',
      latitude: 22.5645,
      longitude: 72.9289,
      metadata: JSON.stringify({
        batch_description: 'Consolidated intake vat #3',
        initial_input_litres: 1000.0,
        temperature_celsius: 4.3,
        fat_pct: 4.2,
        snf_pct: 8.6,
        seal_id: 'SEAL-AN-99411'
      }),
      created_at: '2026-09-05T06:15:10.000Z'
    },
    {
      event_id: 'EVT-MW-02',
      batch_id: 'MW-10482',
      event_type: 'TRANSFERRED',
      actor_id: 'ACT-DRIVER-DESAI-14',
      facility_id: 'FAC-ANAND-01',
      vehicle_id: 'VEH-GJ23-T9904',
      quantity_litres: 995.0,
      timestamp: '2026-09-05T07:00:00.000Z',
      latitude: 22.5645,
      longitude: 72.9289,
      metadata: JSON.stringify({
        flow_meter_id: 'FM-AN-PUMP-03',
        tanker_id: 'VEH-GJ23-T9904',
        temperature_celsius: 4.4
      }),
      created_at: '2026-09-05T07:00:25.000Z'
    },
    {
      event_id: 'EVT-MW-03',
      batch_id: 'MW-10482',
      event_type: 'STORED',
      actor_id: 'ACT-CHILLING-TECH-04',
      facility_id: 'FAC-KAIRA-02',
      vehicle_id: 'VEH-GJ23-T9904',
      quantity_litres: 995.0,
      timestamp: '2026-09-05T08:15:00.000Z',
      latitude: 22.7533,
      longitude: 72.6822,
      metadata: JSON.stringify({
        vat_id: 'VAT-SILO-05',
        temperature_celsius: 3.9
      }),
      created_at: '2026-09-05T08:15:30.000Z'
    },
    {
      event_id: 'EVT-MW-04',
      batch_id: 'MW-10482',
      event_type: 'PROCESSED',
      actor_id: 'ACT-PLANT-OPERATOR-AMUL-03',
      facility_id: 'FAC-AMUL-03',
      vehicle_id: null,
      quantity_litres: 980.0,
      timestamp: '2026-09-05T10:30:00.000Z',
      latitude: 23.2156,
      longitude: 72.6369,
      metadata: JSON.stringify({
        process_step: 'Pasteurization Intake & Processing',
        pasteurizer_unit: 'PAST-MEGA-UNIT-01',
        inflow_litres: 995.0,
        expected_output_litres: 980.0,
        registered_processing_tolerance_pct: 2.0
      }),
      created_at: '2026-09-05T10:30:15.000Z'
    },
    {
      event_id: 'EVT-MW-05',
      batch_id: 'MW-10482',
      event_type: 'DISPATCHED',
      actor_id: 'ACT-DISPATCH-SUPERVISOR-09',
      facility_id: 'FAC-AMUL-03',
      vehicle_id: 'VEH-GJ23-T9904',
      quantity_litres: 650.0,
      timestamp: '2026-09-05T11:45:00.000Z',
      latitude: 23.2156,
      longitude: 72.6369,
      metadata: JSON.stringify({
        flowmeter_id: 'FM-DISP-PACK-04',
        observed_quantity_litres: 650.0,
        expected_quantity_litres: 980.0,
        unaccounted_discrepancy_litres: 330.0,
        discrepancy_percentage: -33.67,
        anomaly_flag: 'FLAG_MASS_BALANCE',
        destination_facility: 'FAC-AHMD-04',
        tanker_seal_no: 'SEAL-DISP-8802'
      }),
      created_at: '2026-09-05T11:45:30.000Z'
    },
    {
      event_id: 'EVT-MW-06',
      batch_id: 'MW-10482',
      event_type: 'RECEIVED',
      actor_id: 'ACT-DEPOT-RECEIVER-AHMD-01',
      facility_id: 'FAC-AHMD-04',
      vehicle_id: 'VEH-GJ23-T9904',
      quantity_litres: 645.0,
      timestamp: '2026-09-05T13:30:00.000Z',
      latitude: 23.0225,
      longitude: 72.5714,
      metadata: JSON.stringify({
        intake_tank: 'SILO-AHMD-QUARANTINE-03',
        status_note: 'Quarantine silo assignment triggered by upstream volume discrepancy flag',
        temperature_celsius: 4.2,
        mass_balance_flagged: true
      }),
      created_at: '2026-09-05T13:30:45.000Z'
    }
  ];

  // 5. Deterministic Anomalies Record
  const anomalies: BigQueryAnomaly[] = [
    {
      anomaly_id: 'ANOM-DEMO-MB-330L',
      batch_id: 'BATCH-DEMO-003-ANOMALOUS',
      anomaly_type: 'MASS_BALANCE',
      severity: 'CRITICAL',
      observed_value: 650.0,
      expected_value: 980.0,
      difference_value: -330.0,
      evidence: 'Deterministic mass-balance computation detected 330.0 L unexplained volume shortfall between expected processing output (980.0 L) and recorded dispatch (650.0 L, -33.67% variance). Standard process tolerance threshold is ±2.0%. Root cause requires physical inspection and facility log audit to verify.',
      detected_at: '2026-09-05T11:45:30.000Z',
      status: 'OPEN_INVESTIGATION'
    },
    {
      anomaly_id: 'ANOM-MW-10482-MB',
      batch_id: 'MW-10482',
      anomaly_type: 'MASS_BALANCE',
      severity: 'CRITICAL',
      observed_value: 650.0,
      expected_value: 980.0,
      difference_value: -330.0,
      evidence: 'Deterministic mass-balance computation detected 330.0 L unexplained volume shortfall between expected processing output (980.0 L) and recorded dispatch (650.0 L, -33.67% variance). Standard process tolerance threshold is ±2.0%. Physical inspection and laboratory testing are required to determine whether adulteration or another food-safety issue occurred.',
      detected_at: '2026-09-05T11:45:30.000Z',
      status: 'OPEN_INVESTIGATION'
    }
  ];

  return {
    facilities,
    vehicles,
    batches,
    events,
    anomalies
  };
}
