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

### Gemini via Vertex AI + ADC (no API key)
Production Gemini access uses **Vertex AI** authenticated with **Application Default
Credentials (ADC)** — the attached Cloud Run runtime service account. There is **no
Gemini API key** and **no service-account JSON** anywhere. The backend builds the
client as `new GoogleGenAI({ vertexai: true, project, location })`
(see `src/server/geminiAuth.ts` and `src/server/geminiClient.ts`).

- Project: `milkyway-507714`
- Location: `GEMINI_LOCATION` (default `us-central1`)
- Model: `GEMINI_MODEL` (default `gemini-2.5-flash`)

If Vertex AI is unavailable, the backend returns `AI_UNAVAILABLE` and never fabricates output.

Enable the API and grant least-privilege IAM to the runtime service account:

```bash
PROJECT_ID=milkyway-507714
RUNTIME_SA="milkyway-run@${PROJECT_ID}.iam.gserviceaccount.com"

# Enable Vertex AI
gcloud services enable aiplatform.googleapis.com --project="$PROJECT_ID"

# Create the runtime service account (once)
gcloud iam service-accounts create milkyway-run \
  --display-name="MilkyWay Cloud Run runtime" --project="$PROJECT_ID"

# Vertex AI access (least privilege) — the ONLY role needed for Gemini
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/aiplatform.user"
```

The runtime service account also needs Firebase/Firestore access for token verification,
custom claims, and case persistence (e.g. `roles/datastore.user` and
`roles/firebaseauth.admin`) — never broad project Owner/Editor. No
`roles/secretmanager.secretAccessor` is required for Gemini anymore.

> Secret Manager remains available for genuine future secrets (`src/server/secretProvider.ts`),
> but is no longer used to store a Gemini API key.

---

### Application Default Credentials (ADC)
No JSON service-account key is stored in the repository. Authentication uses ADC:

- **Cloud Run**: the attached runtime service account identity (above).
- **Local development** (uses Vertex AI by default):
  ```bash
  gcloud auth application-default login
  gcloud config set project milkyway-507714
  ```
  Optionally, set `GEMINI_API_KEY` in `.env` and leave `GEMINI_USE_VERTEX` unset to use
  the Gemini Developer API locally instead of Vertex AI. Production never uses a key.

### Firestore Security Rules
The authoritative, claim-based rules live in [`firestore.rules`](./firestore.rules) and are
machine-verifiable via the emulator (`npm run test:rules`). Roles come from verified
Firebase custom claims (`request.auth.token.role`), never from client-writable documents.

---

## 4. Cloud Run Deployment

Deploy the MilkyWay application container directly to Google Cloud Run:

> Note (Stage 3A): the Gemini key is retrieved at runtime from Secret Manager by the
> application (via ADC), so `--set-secrets` for the Gemini key is NOT required. Attach the
> dedicated runtime service account instead. Full Cloud Run packaging/deployment is Stage 3.

```bash
# Build and deploy service (illustrative; full deployment is a later stage)
gcloud run deploy milkyway-platform \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account="milkyway-run@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --set-env-vars="NODE_ENV=production" \
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

---

## Firestore Security Rules — Emulator Verification (Stage 2.5)

The real `firestore.rules` are machine-verified with `@firebase/rules-unit-testing`
against the Firebase Firestore Emulator (no mocked authorization).

Prerequisites:
- A Java runtime (JDK 11+). The Firestore emulator is a Java application.
- `firebase-tools` (installed as a devDependency).

Run the rules test suite:
```bash
npm run test:rules
```
This launches the Firestore emulator via `firebase emulators:exec` and executes
`src/server/firestoreRules.emulator.test.ts`, which asserts, using authenticated
contexts with custom claims (officerA / officerB / admin), that:
- users cannot change their own `role`/`uid` or self-promote to ADMIN;
- officers can only read/update their own or shared cases (no `assignedOfficerUid` hijack);
- officer notes, chat summaries, and alerts are owner-isolated;
- admin has the intended elevated access.

Other suites (no Java required):
```bash
npm test            # anomaly engine, MCP, agent, auth, cross-user isolation
npm run lint        # tsc --noEmit
```
