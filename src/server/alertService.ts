/**
 * MilkyWay Alert Service (server-side)
 *
 * Persists supply-chain anomaly alerts to alerts/{alertId}.
 * SECURITY:
 * - Officers only see alerts assigned to them; ADMIN sees all (server-enforced + rules).
 * - assignedOfficerUid comes from the verified token (or ADMIN-specified), never trusted from a client body.
 * - Status transitions: NEW -> ACKNOWLEDGED -> INVESTIGATING -> RESOLVED.
 */

import { firestoreRepository, StoredAlert, AlertStatus } from './firestoreRepository';

const VALID_STATUSES: AlertStatus[] = ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED'];

export class AlertService {
  private seeded = false;

  /**
   * Seeds one deterministic alert for MW-10482 assigned to the demo officer,
   * so the alerts view is consistent with the canonical demo case. Idempotent.
   */
  public async ensureSeed(): Promise<void> {
    if (this.seeded) return;
    this.seeded = true;
    const now = '2026-09-05T11:46:00.000Z';
    await firestoreRepository.upsertAlert({
      alertId: 'ALERT-MW-10482',
      batchId: 'MW-10482',
      caseId: 'CASE-MW-10482',
      assignedOfficerUid: 'seed-officer-01',
      severity: 'CRITICAL',
      anomalyType: 'MASS_BALANCE',
      status: 'NEW',
      createdAt: now,
      updatedAt: now
    });
  }

  public async listForOfficer(officerUid: string, isAdmin: boolean): Promise<StoredAlert[]> {
    await this.ensureSeed();
    return firestoreRepository.listAlertsForOfficer(officerUid, isAdmin);
  }

  /**
   * Creates an alert. assignedOfficerUid defaults to the authenticated caller unless an
   * ADMIN explicitly assigns another officer.
   */
  public async createAlert(params: {
    authUid: string;
    isAdmin: boolean;
    batchId: string;
    caseId?: string | null;
    severity: string;
    anomalyType: string;
    requestedAssigneeUid?: string;
  }): Promise<StoredAlert> {
    const assignedOfficerUid =
      params.isAdmin && params.requestedAssigneeUid ? params.requestedAssigneeUid : params.authUid;
    const now = new Date().toISOString();
    const alert: StoredAlert = {
      alertId: `ALERT-${params.batchId}-${Date.now()}`,
      batchId: params.batchId,
      caseId: params.caseId || null,
      assignedOfficerUid,
      severity: params.severity || 'MEDIUM',
      anomalyType: params.anomalyType || 'MASS_BALANCE',
      status: 'NEW',
      createdAt: now,
      updatedAt: now
    };
    return firestoreRepository.upsertAlert(alert);
  }

  /**
   * Updates alert status with server-side ownership enforcement.
   * Throws 'NOT_FOUND' / 'FORBIDDEN' / 'INVALID_STATUS'.
   */
  public async updateStatus(params: {
    alertId: string;
    status: string;
    authUid: string;
    isAdmin: boolean;
  }): Promise<StoredAlert> {
    const { alertId, status, authUid, isAdmin } = params;
    if (!VALID_STATUSES.includes(status as AlertStatus)) {
      throw new Error(`INVALID_STATUS: must be one of ${VALID_STATUSES.join(', ')}`);
    }
    const existing = await firestoreRepository.getAlert(alertId);
    if (!existing) throw new Error('NOT_FOUND: Alert not found.');
    if (!isAdmin && existing.assignedOfficerUid !== authUid) {
      throw new Error('FORBIDDEN: Not authorized to modify this alert.');
    }
    const updated = await firestoreRepository.updateAlertStatus(alertId, status as AlertStatus);
    return updated!;
  }
}

export const alertService = new AlertService();
