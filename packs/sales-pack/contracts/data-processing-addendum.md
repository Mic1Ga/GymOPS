# DATA PROCESSING ADDENDUM (DPA)

**Annex to the GymOps Master Services Agreement**

This DPA forms part of the MSA between Provider and Client and governs the handling of personal data processed in connection with the Software. It applies where Client is subject to one or more data-protection laws including: Thailand PDPA (B.E. 2562 / 2019), Australia Privacy Act 1988 (incl. APP), Indonesia PDP Law 27/2022, Philippines Data Privacy Act 10173 (2012), Vietnam PDPL (Decree 13/2023), Singapore PDPA 2012, EU GDPR, UK GDPR, and equivalent laws.

---

## 1. Definitions

Terms used in this DPA have the meanings given in the applicable data-protection law in Client's jurisdiction. Where multiple laws apply, the strictest definition governs for that data.

- **"Personal Data"**: any information relating to an identified or identifiable natural person (member, lead, staff member).
- **"Processing"**: any operation performed on Personal Data, including collection, storage, organisation, retrieval, transmission, or deletion.
- **"Data Subject"**: the natural person to whom Personal Data relates.
- **"Sub-processor"**: any third party engaged to process Personal Data on Client's behalf, including Third-Party AI Services.

---

## 2. Architectural Position — read this first

The Software's architecture is fundamental to this DPA:

2.1 **The Software runs entirely on Client's device.** All Personal Data is stored in the browser's IndexedDB on Client's hardware. **Provider has no technical access to Personal Data processed in the Software.**

2.2 **Therefore, under most data-protection laws, Provider is neither a Data Controller nor a Data Processor in relation to Client Data.** Provider is best characterised as a **software supplier** under contracts equivalent to off-the-shelf software licences (e.g. analogous to selling a spreadsheet application).

2.3 **Where Third-Party AI Services process Personal Data** (when Client uses the in-Software AI features), the relevant AI provider (Anthropic, OpenAI, etc.) acts as a Sub-processor of Client under Client's direct contract with that provider. Provider is not a party to that processing relationship.

2.4 **Where Personal Data flows to Meta, WhatsApp, SendGrid, Twilio, etc.** via Client's connected integrations, those providers process under Client's direct contractual relationship with them.

This Annex therefore primarily provides commitments and warranties from Provider about the Software's behaviour, rather than the traditional Controller-Processor obligations.

---

## 3. Provider's Commitments

3.1 **No data exfiltration.** Provider warrants that the Software, as delivered, does not transmit Client Data to any server controlled by Provider. Telemetry, analytics, and behavioural tracking are absent from the production build.

3.2 **Source-code verifiability.** The Software's full source code is published under MIT licence at github.com/sjgant80-hub/gymos. Client may audit at any time. Any change to the data-handling behaviour will be visible in the source code.

3.3 **Cryptographic controls.** The licence envelope mechanism uses Ed25519 signatures generated from a private key held only on Provider's secure hardware. Client may verify envelope authenticity using the public key embedded in the Software.

3.4 **Article 12 audit chain.** The Software includes a built-in SHA-256 prevHash audit chain compliant with EU AI Act Article 12 requirements. Client may export and verify this chain on demand to demonstrate record-keeping compliance to any regulator.

3.5 **Update integrity.** Software updates are delivered via the same public URL (GitHub Pages). Client may freeze the version by hosting their own copy of the HTML file — sovereignty extends to update timing.

---

## 4. Client's Obligations

4.1 **Lawful basis.** Client warrants that it has a lawful basis under its applicable data-protection law(s) for processing all Personal Data entered into the Software (consent, contract, legitimate interest, etc.).

4.2 **Data Subject rights.** Client is responsible for responding to all Data Subject requests (access, rectification, erasure, portability, objection). The Software provides export functions to facilitate compliance. Provider has no Data Subject-facing obligation.

4.3 **Consents for Third-Party AI Services.** Where Client uses the in-Software AI features, Personal Data will be transmitted to the chosen Third-Party AI Service. Client warrants that it has obtained any consents required under Applicable Law for this transmission. The Software displays a clear disclosure of which provider is being called.

4.4 **Retention.** Client controls retention — Personal Data persists in Client's browser until Client deletes it. Client is responsible for implementing retention policies consistent with Applicable Law (e.g. 6-month retention under EU AI Act Article 26 where applicable).

4.5 **Backups.** Client is responsible for backing up Personal Data via the Software's export function. Provider cannot restore Client Data because Provider never holds it.

4.6 **Cross-border transfers.** Where Personal Data is transmitted to Third-Party AI Services that may process outside Client's jurisdiction, Client is responsible for ensuring an adequate transfer mechanism is in place (e.g. Standard Contractual Clauses for GDPR, PDPA cross-border consent for Thailand, etc.). Client's contract with the Third-Party AI Service should address this directly.

---

## 5. Specific Jurisdictional Notes

### 5.1 Thailand · PDPA (B.E. 2562 / 2019)

- Client is the **Data Controller** under PDPA.
- Sections 19-26 obligations (lawful basis, notice, consent) sit entirely with Client.
- Section 27 cross-border transfer notice applies when Client uses Third-Party AI Services hosted outside Thailand — Client must inform Data Subjects.
- Provider is not a Data Processor under PDPA because Provider does not process on Client's behalf.

### 5.2 Australia · Privacy Act 1988

- Client is responsible for compliance with the Australian Privacy Principles (APPs).
- APP 8 (cross-border disclosure) applies when Client uses overseas Third-Party AI Services — Client must take reasonable steps to ensure overseas recipients comply.
- The Software's on-device storage assists APP 11 (security) compliance materially — no central database to be breached.

### 5.3 Indonesia · PDP Law 27/2022

- Client is the Data Controller (Pengendali Data Pribadi).
- Article 28 cross-border transfer obligations apply only if Client uses Third-Party AI Services outside Indonesia — Client's responsibility.
- Article 35 record-keeping is satisfied by the Software's audit chain.

### 5.4 Philippines · DPA 10173 (2012)

- Client is the Personal Information Controller (PIC).
- Provider is not a Personal Information Processor (PIP) under Section 14 because Provider does not process on Client's behalf.
- NPC Circular 16-01 record-keeping requirements satisfied by audit chain export.

### 5.5 Vietnam · PDPL (Decree 13/2023)

- Client is the Data Controlling Party (Bên Kiểm soát Dữ liệu).
- Article 25 cross-border transfer applies when Client uses Third-Party AI Services — Client's responsibility to register transfers with the Ministry of Public Security if required.
- Article 28 obligations on data security audits — Software's audit chain export satisfies the technical evidence requirement.

### 5.6 Singapore · PDPA 2012

- Client is the Organisation under PDPA.
- Provider is not a Data Intermediary under Section 4(1) because Provider does not process on Client's behalf.
- Data Breach Notification Obligation (Section 26C) — Client's sole responsibility; breach scope is bounded by Client's device.

### 5.7 EU / UK · GDPR / UK GDPR

- Client is the Controller under Article 4(7).
- Provider is best characterised as a **software supplier**, not a Processor under Article 4(8), as Provider does not process Personal Data on Client's behalf.
- Where Client uses Third-Party AI Services, those providers act as Processors under Client's direct contract with them.
- Article 28(3) Processor terms apply between Client and the chosen Third-Party AI Service, not between Client and Provider.
- Article 30 records of processing — Client must maintain (Provider does not have visibility).
- Article 32 security — the on-device architecture provides material assistance with appropriate technical and organisational measures.

---

## 6. Sub-processors (Provider Side)

Provider does not engage sub-processors that process Client Data on Provider's behalf, because Provider has no access to Client Data. The Software's deployment infrastructure (GitHub Pages for hosting the HTML file, signing key management on Provider's hardware) does not involve Personal Data.

Provider's tooling sub-processors (used to deliver Provider's own business operations — not Client Data) include:
- GitHub Inc. (source code hosting)
- {{ Provider's email provider }}
- {{ Provider's accounting tool }}

These do not process Client Data.

---

## 7. Sub-processors (Client Side)

When Client uses the in-Software features that connect to third parties, the following may act as Sub-processors of Client (not of Provider). Client's contract with each governs the relationship:

| Sub-processor | Service | Personal Data processed | Location |
|---|---|---|---|
| Anthropic PBC | Claude API (AI generation) | Member descriptions, lead notes, content drafts | US |
| OpenAI L.L.C. | GPT API (AI generation) | Same | US |
| Google LLC | Gemini API (AI generation) | Same | US / EU |
| Meta Platforms Inc. | Pages API (social posting) | Post content + member-facing replies | US / EU |
| WhatsApp Business | Message delivery | Messages, phone numbers | Where WhatsApp processes |
| Twilio Inc. | SMS delivery | Phone numbers, message content | US / EU |
| SendGrid (Twilio) | Email delivery | Email addresses, message content | US / EU |
| Google LLC | Google My Business (review replies) | Public review content | US |

Client is responsible for executing the appropriate DPAs / SCCs / TIAs with each.

---

## 8. Security Incident Notification

8.1 **Provider-side incident** (e.g. compromise of Provider's signing key): Provider will notify Client without undue delay, and in any case within 72 hours of becoming aware of the incident. Notification will include the nature of the incident, mitigation steps, and any recommended Client action.

8.2 **Client-side incident** (loss of Client's device, browser breach, leaked export file): Client is responsible for assessing, notifying authorities and Data Subjects, and remediating under Applicable Law.

---

## 9. Data Subject Requests

When Client receives a Data Subject request (access, rectification, erasure, portability), Client may:
- Export the requested data via the in-Software export function;
- Delete the relevant records directly within the Software;
- Use the audit chain export to verify completeness of erasure.

Provider has no ability to action Data Subject requests on Client's behalf because Provider has no access.

---

## 10. Audits

Client may audit the Software's source code at any time (it is open source). Client may not audit Provider's premises or business operations under this DPA — those are not relevant to Client Data, which never leaves Client's device.

---

## 11. Termination of Processing

When the MSA terminates:
- Personal Data remains on Client's device. Provider takes no action with respect to Personal Data.
- Client may continue using the Software (subject to envelope expiry as set out in the MSA).
- Client is responsible for any erasure required under Applicable Law upon end of business need or upon Data Subject request.

---

## 12. Order of Precedence

In case of conflict, the order of precedence is:
1. Applicable mandatory data-protection law
2. This DPA
3. The MSA
4. The AUP
5. The Order Form

---

**SIGNED IN AGREEMENT WITH THE MSA**:

For Provider: ____________________________  Date: _____________

For Client: ______________________________  Date: _____________

---

◊·κ=1 · DPA · jurisdiction sections expanded once research returns verified specifics · always have a local data-protection lawyer review for first deployment in each jurisdiction
