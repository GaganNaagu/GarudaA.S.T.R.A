# **GARUDA A.S.T.R.A.** 

## **Major Project Upgrade Report** 

_AI-Assisted Missing Person Recovery & Safe Return Network_ 

GARUDA A.S.T.R.A. — Major Project Upgrade Report 

### **1. Purpose of the Upgrade** 

The purpose of the major-project upgrade is to move Garuda A.S.T.R.A. beyond a basic face-recognition workflow and develop it into an AI-assisted missing-person investigation and decision-support system. 

The existing face-recognition pipeline remains the foundation. The upgrades add intelligence around candidate sightings, evidence, investigation history, spatial/temporal correlation, alerts and search prioritization. 

### **2. Upgrade Strategy** 

The project should not be expanded by adding unrelated AI models. The recommended strategy is to make the existing system more useful, explainable, measurable and investigation-oriented. 

The major upgrade changes the system concept from: 

##### **CCTV → Face Recognition → Match** 

to: 

##### **Missing-Person Case → AI Search → Candidate Sightings → Evidence → Correlation → Investigation → Search Prioritization** 

### **3. Recommended Upgrades** 

|**Upgrade**|**Purpose**|**Difficulty**|**Priority**|
|---|---|---|---|
|AI Investigation Timeline|Reconstruct all<br>important case events<br>and sightings<br>chronologically|**f**<br>Low–Medium|Must|
|Sighting / Detection<br>Heatmap|Visualize where potential<br>sightings are<br>concentrated|Low|Must|
|Smart Match Ranking|Rank candidates using<br>similarity and contextual<br>evidence|Medium|Must|
|Evidence Vault|Store frames, face crops<br>and metadata for<br>candidate sightings|Low|Must|
|Intelligent Alert Center|Prioritize and manage<br>important candidate<br>alerts|Medium|Must|
|AI Analytics / Case<br>Insights|Summarize case-level<br>patterns and system<br>results|Low|Recommended|
|Live RTSP Multi-Camera|Enable continuous multi-<br>camera video input|High|Optional / Major|
|AI Search Session|Allow investigators to<br>define and execute a<br>structured search|Medium|Signature Feature|
|Temporal / Cross-<br>Location Correlation|Connect sightings into<br>possible movement<br>sequences|Medium–High|Major|



GARUDA A.S.T.R.A. — Major Project Upgrade Report 

|Last Seen → Likely Next<br>Location|Prioritize locations for<br>further investigation|High|Major Research|
|---|---|---|---|
||Generate a structured|||
|Investigation Report|case report from stored<br>evidence|Low–Medium|Recommended|



### **4. AI Investigation Timeline** 

The timeline converts individual AI events into a chronological investigation history. 

- Case created 

- Reference image added 

- Last-known information recorded 

- Potential sighting detected 

- Candidate ranked 

- Evidence captured 

- Alert generated 

- Investigator reviewed the sighting 

- Sighting confirmed or rejected 

- Patrol/response assigned 

- Case resolved 

The timeline should be generated from recorded system events rather than manually written descriptions. 

### **5. Sighting / Detection Heatmap** 

Each candidate sighting contains a location and timestamp. These observations can be displayed on a map and aggregated into a heatmap to show where potential sightings are concentrated. 

The heatmap should answer: 

- Where have candidate sightings occurred? 

- Which areas have repeated observations? 

- Where was the last confirmed sighting? 

- Which locations should the investigator examine first based on observed evidence? 

### **6. Smart Match Ranking** 

Instead of producing only a match/no-match result, the system should rank candidate identities and display the evidence contributing to the ranking. 

Example output: 

|**Rank**|**Candidate**|**Face Similarity**|**Quality**|**Final Score**|
|---|---|---|---|---|
|1|Candidate A|94.2%|91%|92.8%|
|2|Candidate B|87.4%|95%|89.1%|
|3|Candidate C|83.1%|90%|85.9%|



GARUDA A.S.T.R.A. — Major Project Upgrade Report 

An initial transparent scoring formulation may combine face similarity, face quality and temporal evidence. The weights should be experimentally evaluated rather than treated as universal values. 

### **7. Evidence Vault** 

Every important candidate sighting should have an evidence record containing the material needed for later human review. 

- Original CCTV frame or source reference 

- Detected face crop 

- Camera/source identifier 

- Timestamp 

- Location 

- Similarity score 

- Face-quality score 

- Model/version information 

- Verification status 

This makes the AI result auditable and allows investigators to review the actual evidence behind a candidate. 

### **8. Intelligent Alert Center** 

The system should prioritize alerts rather than treating every candidate equally. 

|**Priority**|**Meaning**|**Example**|
|---|---|---|
|High|Strong candidate requiring prompt<br>review|High similarity + good quality +<br>supportingsightings|
|Medium|Potential candidate requiring<br>review|Moderate similarity or limited<br>supportingevidence<br>i|
|Low|Weak or informational event|Low-confidence candidate|



Human verification remains necessary before an alert becomes an operational decision. 

### **9. AI Analytics / Case Insights** 

The analytics layer should summarize information already produced by the system, rather than inventing facts. Useful case insights include: 

- Number of sources searched 

- Frames/faces processed 

- Number of candidate sightings 

- Highest-confidence sighting 

- Number of confirmed/rejected sightings 

- Locations with repeated sightings 

- Timeline of important events 

GARUDA A.S.T.R.A. — Major Project Upgrade Report 

### **10. AI Search Session — Signature Feature** 

An investigator should be able to create a structured search session instead of simply uploading a video and waiting for a result. 

1. Select missing-person case 

2. Select reference images 

3. Select CCTV/source locations 

4. Define time window 

5. Define recognition threshold 

6. Start search 

7. Track processing progress 

8. Review ranked candidate sightings 

Example search result: 

- CAM-03 — 14:32 — 94.7% 

- CAM-02 — 13:17 — 91.3% 

- CAM-01 — 12:42 — 82.1% 

### **11. Temporal and Cross-Location Correlation** 

A major upgrade is to treat multiple sightings as a possible sequence instead of isolated matches. 

##### Example: 

- 14:02 — CAM-01 — similarity 0.76 

- 14:07 — CAM-02 — similarity 0.83 

- 14:12 — CAM-03 — similarity 0.91 

The system can identify this as a possible movement sequence and expose the sequence to the investigator. 

### **12. Last Seen → Likely Next Location** 

This is the main proposed research-oriented upgrade. Instead of stopping at 'we found this face', the system uses observed sightings and location/time information to prioritize where investigators should look next. 

Initial implementation should use an explainable ranking based on: 

- Last confirmed sighting 

- Time difference 

- Connected camera/source locations 

- Observed subsequent sightings 

- Relevant transport/location nodes when authorized or simulated data is available 

##### Example: 

|**Location**|**Priority**|**Reason**|
|---|---|---|
|Location A|High|Connected to last sighting and<br>consistent with observed|



GARUDA A.S.T.R.A. — Major Project Upgrade Report 

|||sequence|
|---|---|---|
|Location B|Medium|Spatially connected but weaker<br>temporal evidence|
|Location C|Low|Limited supportingevidence|



This is decision support, not a claim of certainty about the person's actual location. 

### **13. Investigation Report** 

After an investigation, the system should be able to generate a structured report containing: 

- Case information 

- Last-known information 

- Search sessions 

- Candidate sightings 

- Confidence and quality scores 

- Evidence references 

- Timeline 

- Location map/heatmap 

- Investigator verification decisions 

- Search-priority results 

### **14. Live RTSP Multi-Camera** 

Live RTSP input can extend the project from recorded/simulated video to continuous camera feeds. Because it introduces substantially more engineering and testing complexity, it should remain an optional major-project component or controlled demonstration feature. 

The core project should remain fully demonstrable using recorded videos/simulated camera sources. 

### **15. Recommended Upgrade Order** 

1. Stabilize the existing face detection and recognition pipeline. 

2. Introduce the Case and Sighting concepts. 

3. Implement Evidence Vault. 

4. Implement Smart Match Ranking. 

5. Implement Investigation Timeline. 

6. Implement Intelligent Alert Center. 

7. Implement AI Search Session. 

8. Add Sighting Map / Heatmap. 

9. Add Temporal and Cross-Location Correlation. 

GARUDA A.S.T.R.A. — Major Project Upgrade Report 

10. Implement Last Seen → Likely Next Location. 

11. Add Case Analytics and Investigation Report. 

12. Add Live RTSP Multi-Camera only if the core system is stable. 

### **16. What Should Not Be Added to the Core Scope** 

- Weapon detection 

- Violence detection 

- Age progression 

- Unrelated AI models 

- Unapproved real-world police/hospital/railway database integrations 

- Complex infrastructure that does not improve the core use case 

These can remain future-scope ideas. The upgrade should deepen the missing-person recovery problem rather than broaden the project into unrelated surveillance tasks. 

### **17. Final Upgrade Concept** 

#### **GARUDA A.S.T.R.A.** 

#### **AI-Assisted Missing Person Recovery & Safe Return Network** 

The upgraded system should combine face recognition, candidate ranking, evidence management, timeline reconstruction, spatial visualization, cross-location correlation and search prioritization into one investigatorfacing workflow. 

The distinctive idea is not simply recognizing a missing person. It is helping an investigator move from a missingperson report to a structured set of candidate sightings, correlated evidence and prioritized next actions. 

GARUDA A.S.T.R.A. — Major Project Upgrade Report 

