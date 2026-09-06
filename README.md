# MilkyWay — Milk Supply-Chain Anomaly Detection & Investigation Platform

> **"Trace every litre. Find every discrepancy."**
> **"Know where to look before you send an inspector."**

MilkyWay is an enterprise food-safety intelligence and supply-chain anomaly detection platform designed specifically for Food Safety Officers.

---

### Critical Regulatory & Positioning Boundary

> **IMPORTANT:**
> MilkyWay does **NOT** test milk, does **NOT** perform chemical laboratory analyses, and does **NOT** determine whether milk is adulterated.
> 
> Its sole purpose is to track the movement and quantity of milk through the physical supply chain, detect unexplained input/output mass discrepancies and impossible velocities, and help Food Safety Officers prioritize and deploy physical inspections with forensic evidence.
> 
> **Actual adulteration testing happens only after an authorized authority conducts physical inspection and laboratory testing.**

**The Core Concept:**
```
JOURNAL → TRACE → DETECT → INVESTIGATE → INSPECT
```

---

## 1. System Architecture

```
┌─────────────────┐       ┌────────────────────────┐       ┌───────────────────────┐
│ Dairy Farms /   │       │ BigQuery Event Journal │       │ Deterministic Engine  │
│ Collection Vats │ ────> │ (Write-Once Provenance)│ ────> │ (Mass-Balance & Math) │
└─────────────────┘       └────────────────────────┘       └───────────┬───────────┘
                                                                       │
                                                            Flagged Discrepancies
                                                                       ▼
┌─────────────────┐       ┌────────────────────────┐       ┌───────────────────────┐
│ Food Safety     │ <──── │ Structured Dossier     │ <──── │ Gemini Investigation  │
│ Officer Action  │       │ & Inspection Priority  │       │ Agent (Scoped MCP)    │
└─────────────────┘       └────────────────────────┘       └───────────────────────┘
```

1. **Append-Only Supply Journal**: BigQuery write-once event tables record batch custody, dispatch volumes, chilling temperatures, and delivery manifests. Zero in-place `UPDATE` or `DELETE` operations are permitted.
2. **Deterministic Mass-Balance Engine**: Mathematically reconciles input volume against expected process loss (e.g. 2.0% chilling tolerance) and recorded output. AI models are never asked to calculate or guess whether volume is missing.
3. **Agentic MCP Investigation**: Gemini 3.6 Flash uses scoped, read-only MCP tools (`trace_batch`, `get_facility_history`, `get_vehicle_history`, `get_related_batches`) to compile evidentiary briefs.
4. **Human Authority Primacy**: "MilkyWay supports investigation. Authorities make the final decision."

---

## 2. Threat Model Summary (The 5 Threat Zones)

| Threat Zone | Identified Vulnerability Risk | Engineered Countermeasure |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious farmer payload, crafted weight ticket, prompt injection via free-text delivery notes. | Strict Zod schema validation; deterministic math executed upstream of LLM; free-text notes treated strictly as passive string data. |
| **2. Planning & Reasoning** | Agent manipulated into skipping required MCP tools or hallucinating an adulteration finding. | Deterministic state engine mandates tool invocation sequence; non-diagnostic output guardrails forbid adulteration claims. |
| **3. Tool Execution** | Privilege escalation via MCP tools; invoking `get_facility_history` outside officer jurisdiction. | Context-bound authorization token validated at MCP server boundary; parameter format validation on all facility IDs. |
| **4. Memory & State** | Cross-role data leak: farmer discovering confidential regional anomaly investigation dossiers. | Firestore security rules partition `/cases/` to authenticated officer claim lookups only; client-side isolation. |
| **5. Inter-System Comms** | BigQuery credential exposure; Gemini API token leaked in client bundle or network payload. | All AI and BigQuery operations proxied via Cloud Run backend; Secret Manager IAM binding restricts token access. |

---

## 3. Cloud Infrastructure & Security Configuration

### Prerequisites
1. Install the [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install).
2. Authenticate and set your active Google Cloud project:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. Enable required Google Cloud APIs:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     bigquery.googleapis.com
   ```

---

### Secret Manager Configuration
Operational credentials, including the Gemini API key and service accounts, are never committed to repositories or injected into client bundles.

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the Cloud Run compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### Firestore Security Rules
Ensure owner-bound isolation and strict Role-Based Access Control (RBAC) preventing unauthorized reads into anomaly investigation cases:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /cases/{caseId} {
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'officer';
    }
  }
}
```

---

## 4. Cloud Run Deployment

Deploy the MilkyWay application container directly to Google Cloud Run:

```bash
# Build and deploy service
gcloud run deploy milkyway-platform \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --min-instances=1 \
  --memory=1Gi \
  --port=3000
```

### Verification Binding Label
To register the service for automated challenge verification, apply the mandatory resource label:

```bash
gcloud run services update milkyway-platform \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 5. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Start development server (Port 3000)
npm run dev
```

Visit `http://localhost:3000` to preview the platform.

---

## 6. Regulatory Verification & Test Protocol

1. **Mass-Balance Determinism**: Verify that adjusting scenario inputs computes exact arithmetic shortfalls (`Input - Loss - Output`) without calling LLM endpoints.
2. **Investigation Synthesis**: Verify that clicking *Re-Run Investigation Sequence* iterates sequentially across the 6 MCP tools before presenting the structured brief.
3. **Non-Diagnostic Compliance**: Confirm that all outputs use terms such as *investigation signal*, *unexplained discrepancy*, and *prioritize physical inspection*, avoiding unauthorized diagnostic assertions.
