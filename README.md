# Data Sentinel

🚀 DRIFTSHIELD-ARC — FINAL MASTER PROMPT



BUILD A COMPLETE, FUNCTIONAL FULL-STACK WEB APPLICATION



APPLICATION NAME



DriftShield-Arc



SUBTITLE



Self-Healing Data Pipeline Framework



PROJECT TITLE



Self-Healing Data Pipeline Framework: A Novel Algorithm for Autonomous Pipeline Resilience, Real-Time Anomaly Remediation, and Dynamic Data Drift Reconstruction



PROJECT TYPE



Academic Data Science Programming Project



---



0. CRITICAL INSTRUCTION



Do NOT build only a landing page.



Do NOT build only a static dashboard.



Build a complete, functional prototype that demonstrates the actual data-science workflow.



The application must allow the user to clearly demonstrate:



BEFORE UPDATE → APPLICATION UPDATE → AFTER UPDATE → DETECT → DIAGNOSE → PROCESSING → REMEDIATE → VALIDATE → RESOLVED → RECOVER → RELEASE



The application update itself is simulated.



DriftShield-Arc does NOT claim to repair the software application itself.



Instead, it detects and automatically handles DATA-LEVEL changes and data-quality problems caused by the simulated application/data-source update.



---



1. CORE PURPOSE



DriftShield-Arc represents a self-healing data pipeline.



The system must:



1. Maintain a BASELINE / PREVIOUS DATA state.

2. Allow the user to trigger an APPLICATION UPDATE.

3. Simulate an application/data-source version change.

4. Generate or load CURRENT / NEW DATA.

5. Compare CURRENT DATA with BASELINE DATA.

6. Detect data drift and quality problems.

7. Diagnose the reason/type of each problem.

8. Select an appropriate remediation strategy.

9. Show remediation as PROCESSING.

10. Apply the remediation.

11. Re-validate the corrected data.

12. Mark an issue RESOLVED only after successful validation.

13. Recover the pipeline.

14. Release validated clean data downstream.

15. Maintain complete event logs and measurable metrics.



---



2. CORE SYSTEM FLOW



The primary demonstration flow must be:



BASELINE / PREVIOUS DATA

          ↓

APPLICATION UPDATE

          ↓

CURRENT / NEW DATA

          ↓

COMPARE

          ↓

DETECT

          ↓

DIAGNOSE

          ↓

PROCESSING

          ↓

REMEDIATE

          ↓

VALIDATE

          ↓

RESOLVED

          ↓

PIPELINE RECOVERED

          ↓

CLEAN DATA RELEASED



Make this flow visually obvious throughout the application.



---



3. MAIN DASHBOARD



Create a professional enterprise-style MLOps / Data Engineering dashboard.



Header:



DriftShield-Arc



Subtitle:



Self-Healing Data Pipeline Framework



Show application version in the top-right.



Example:



Application Version: v1.0



---



PRIMARY ACTIONS



At the top of the Dashboard, place TWO prominent action buttons.



PRIMARY BUTTON



🔄 UPDATE APPLICATION



This is the MAIN TRIGGER of the project demonstration.



SECONDARY BUTTON



▶ RUN SELF-HEALING PIPELINE



This is a manual trigger for running the self-healing pipeline on the currently loaded dataset.



The two buttons must be clearly visible next to each other.



Approximate layout:



DriftShield-Arc

Self-Healing Data Pipeline Framework



                         [ 🔄 UPDATE APPLICATION ]

                         [ ▶ RUN SELF-HEALING PIPELINE ]



The UPDATE APPLICATION button must be visually more prominent.



Do NOT hide either button inside a dropdown.



Do NOT make them accessible only through the sidebar.



Both must be directly accessible from the main Dashboard.



---



4. UPDATE APPLICATION — MAIN TRIGGER



The 🔄 UPDATE APPLICATION button is the most important interactive feature.



Before clicking it:



Show:



BEFORE UPDATE



Baseline / Previous Data



Status:



🟢 HEALTHY



Application Version:



v1.0



Dataset State:



BASELINE



When the user clicks:



🔄 UPDATE APPLICATION



begin the complete simulated update workflow.



---



5. APPLICATION UPDATE EXPERIENCE



Create a dedicated Application Update page/modal.



Title:



Application Update



Show:



Current Application Version

v1.0



        ↓



New Application Version

v2.0



Show an Update Impact Preview:



- Schema

- Data Types

- Missing Values

- Distribution

- Anomalies

- Duplicates



Primary button:



🔄 Simulate Application Update



---



6. UPDATE PROGRESS



When the user clicks Simulate Application Update, do NOT immediately show the final result.



Show a realistic progress sequence.



STEP 1



Preparing update...



Status:



🔄 PROCESSING



STEP 2



Updating application/data source...



Status:



🔄 PROCESSING



STEP 3



Generating new incoming data...



Status:



🔄 PROCESSING



STEP 4



Update completed.



Status:



✅ COMPLETED



Then show:



v1.0 → v2.0



Then automatically move to:



POST-UPDATE DATA ANALYSIS



---



7. BEFORE UPDATE — BASELINE DATA



Create a complete baseline data view.



Header:



BEFORE UPDATE — BASELINE DATA



Subtitle:



Previous / Normal Data



Status:



🟢 HEALTHY



Show:



- Dataset name

- Row count

- Column count

- Data types

- Missing values

- Duplicate records

- Data quality score

- Basic statistics



Create a data preview table.



Example:



ID| Name| Age| Salary| Department| Location

1| John| 25| 40000| IT| Chennai

2| Priya| 32| 52000| HR| Madurai

3| Karthik| 28| 48000| Finance| Coimbatore



Also show charts:



- Age distribution

- Salary distribution

- Missing-value summary

- Department distribution



---



8. APPLICATION UPDATE VISUALIZATION



After clicking Update, visually transition through:



BEFORE UPDATE

      ↓

APPLICATION UPDATE

      ↓

AFTER UPDATE

      ↓

CHANGE DETECTION



Use a clear visual timeline.



The UI must make it obvious that the data problems appeared AFTER the update.



---



9. AFTER UPDATE — CURRENT DATA



Show:



AFTER UPDATE — CURRENT DATA



Subtitle:



New / Incoming Data



Status:



🔴 ISSUES DETECTED



The current dataset must intentionally contain controlled problems.



Display:



- New columns

- Removed columns

- Changed data types

- Missing-value increase

- Duplicate increase

- Distribution changes

- Anomalies

- Invalid records



Example:



Baseline Age:

Integer



Current Age:

String



Baseline Missing Values:

0.5%



Current Missing Values:

8.2%



Baseline Duplicates:

0



Current Duplicates:

120



These values should be calculated from the actual demo dataset whenever practical.



---



10. BEFORE VS AFTER COMPARISON



Create a large comparison panel.



LEFT SIDE



BEFORE UPDATE



Baseline Dataset



🟢 HEALTHY



RIGHT SIDE



AFTER UPDATE



Current Dataset



🔴 ISSUES DETECTED



Compare:



- Rows

- Columns

- Data Types

- Missing Values

- Duplicates

- Data Quality

- Distribution

- Anomalies



Use visual indicators:



- ↑ Increased

- ↓ Decreased

- Changed

- New

- Removed



Example:



Columns

6 → 7



Missing Values

0.5% → 8.2%



Duplicates

0 → 120



Quality

98% → 62%



---



11. DATA PROFILING



Profile both datasets.



BASELINE PROFILE



Calculate:



- Row count

- Column count

- Column names

- Data types

- Mean

- Median

- Variance

- Minimum

- Maximum

- Missing-value ratio

- Unique values

- Distribution statistics



CURRENT PROFILE



Calculate the same metrics.



Then compare:



Baseline Profile vs Current Profile



Do not simply display static numbers.



Calculate them from the loaded/demo data.



---



12. SCHEMA DRIFT DETECTION



Compare baseline schema with current schema.



Detect:



- New columns

- Removed columns

- Data type changes

- Format changes

- Nullability changes



Example:



Age



BEFORE:



Integer



AFTER:



String



Display:



🚨 SCHEMA MISMATCH DETECTED



Detection Method:



Schema Comparison



Severity:



HIGH



---



13. DRIFT DETECTION ALGORITHMS



Implement the actual algorithm logic wherever practical.



Do NOT simply display algorithm names.



---



A. PSI — Population Stability Index



Use PSI to detect distribution changes between baseline and current data.



Display:



- Column

- PSI Score

- Severity

- Baseline Distribution

- Current Distribution

- Decision



Default interpretation:



PSI < 0.10

Stable



0.10 – 0.25

Moderate Drift



> 0.25

Significant Drift



---



B. KS TEST — Kolmogorov-Smirnov Two-Sample Test



Compare:



Baseline Distribution



vs



Current Distribution



Display:



- KS Statistic

- p-value

- Threshold

- Decision

- Severity



---



C. ISOLATION FOREST



Use Isolation Forest for anomaly detection.



Display:



- Record ID

- Feature values

- Anomaly score

- Status

- Severity



Use actual anomaly detection logic where practical.



---



14. ISSUE DETECTION SCREEN



After the update analysis, automatically show:



DETECTED ISSUES



Example:



🚨 5 ISSUES DETECTED



---



1. Schema Mismatch



Column:



Age



Before:



Integer



After:



String



Detected By:



Schema Check



Severity:



HIGH



Status:



DETECTED



---



2. Missing Values



Column:



Salary



Missing:



8.2%



Detected By:



Data Quality Check



Severity:



HIGH



Status:



DETECTED



---



3. Distribution Drift



Column:



Salary



PSI:



0.42



KS:



Significant



Detected By:



PSI + KS Test



Severity:



HIGH



Status:



DETECTED



---



4. Anomalies



Records:



15



Detected By:



Isolation Forest



Severity:



MEDIUM



Status:



DETECTED



---



5. Duplicate Records



Records:



120



Detected By:



Duplicate Detection



Severity:



MEDIUM



Status:



DETECTED



---



15. DIAGNOSIS



After detection, determine:



- What changed?

- Which column/records are affected?

- What detection method found it?

- What is the severity?

- What remediation strategy is appropriate?



Show a diagnosis card for every issue.



Example:



ISSUE

Missing Salary Values



CAUSE

Null / Missing Data Increase



DETECTED BY

Data Quality Check



SEVERITY

HIGH



RECOMMENDED ACTION

Median Imputation



---



16. RULE-BASED REMEDIATION ENGINE



Create:



Rule-Based Remediation Engine



The engine automatically selects a suitable remediation strategy.



Rules:



Missing numerical values

→ Median Imputation



Missing categorical values

→ Mode Imputation



Schema / type mismatch

→ Safe Auto-Casting



Duplicate records

→ Duplicate Resolution



Outliers

→ Configured Outlier Handling



Invalid records

→ Correct if safely possible



Unsafe / uncertain problems

→ Requires Review / Quarantine



The remediation decision should be generated based on the detected issue.



---



17. AUTO-REMEDIATION



Default setting:



AUTO-REMEDIATION: ON



After issue detection:



1. Diagnose issue.

2. Select remediation.

3. Show selected action.

4. Start processing.

5. Apply fix.

6. Validate result.

7. Only then mark RESOLVED.



Example:



Issue:

Missing Salary Values



Action:

Median Imputation



Affected Records:

820



Status:

🔄 PROCESSING



Do NOT instantly mark it RESOLVED.



---



18. DYNAMIC STATUS LIFECYCLE



Every issue must have a real status lifecycle.



Correct lifecycle:



DETECTED

   ↓

PROCESSING

   ↓

VALIDATING

   ↓

RESOLVED



Do NOT skip PROCESSING.



Do NOT show RESOLVED immediately.



If remediation fails:



DETECTED

   ↓

PROCESSING

   ↓

FAILED



or:



DETECTED

   ↓

PROCESSING

   ↓

REQUIRES REVIEW

   ↓

QUARANTINED



Statuses must dynamically change during the demonstration.



---



19. REMEDIATION CENTER



Create a dedicated page:



Remediation Center



When remediation is running, show:



🔄 Remediation in Progress



Overall progress:



0% → 25% → 50% → 75% → 100%



Example:



Issue:

Schema Mismatch — Age



Detected By:

Schema Check



Action:

Safe Auto-Casting



Status:

🔄 PROCESSING



Show:



- Animated progress indicator

- Current action

- Affected records

- Detection method

- Severity

- Processing time

- Validation status



After remediation:



Validation started...



Then:



Validation passed.



Then:



✅ RESOLVED



---



20. ISSUE-BY-ISSUE PROCESSING



Show every detected issue separately.



Example:



Missing Values — Salary



Action:



Median Imputation



Records:



820



Status:



🟢 RESOLVED



---



Schema Mismatch — Age



Action:



Safe Auto-Casting



Records:



10,000



Status:



🔄 PROCESSING



---



Duplicates



Action:



Remove Duplicates



Records:



120



Status:



⏳ PENDING



---



Anomalies



Action:



Outlier Handling



Records:



15



Status:



⏳ PENDING



---



Distribution Drift



Action:



Distribution Alignment / Review



Status:



⏳ PENDING



Statuses must dynamically change.



---



21. BEFORE → PROCESSING → AFTER VISUALIZATION



For every remediation, create a visual card.



Example:



BEFORE



Salary:

950000



       ↓



🔄 PROCESSING



Outlier Handling



       ↓



AFTER



Salary:

75000



       ↓



VALIDATION



PASSED



       ↓



✅ RESOLVED



This visualization is mandatory.



---



22. PROOF OF AUTOMATIC REMEDIATION



The system must show measurable before/after changes.



Example:



Anomalies

15 → 3



Missing Values

8.2% → 0.6%



Duplicates

120 → 0



Schema Issues

3 → 0



Data Quality

62% → 94%



Do NOT hardcode these values.



Calculate them from the actual datasets wherever practical.



The UI must prove that remediation actually changed the data.



---



23. REMEDIATED DATASET



After remediation, create a third dataset state:



REMEDIATED DATASET



The UI must support comparison between:



1. Baseline Dataset

2. Current Dataset

3. Remediated Dataset



Show:



BASELINE

Previous / Normal



CURRENT

After Update / Issues



REMEDIATED

After Automatic Fix



Provide tabs or a comparison selector to inspect all three states.



---



24. RE-VALIDATION



After remediation automatically run validation.



Check:



- Schema consistency

- Missing values

- Duplicate records

- Invalid records

- Drift

- Anomalies

- Data quality



Show:



BEFORE REMEDIATION



vs



AFTER REMEDIATION



Every validation must have:



🟢 PASSED



or



🔴 FAILED



Only if required validations pass:



✅ RESOLVED



---



25. PIPELINE RECOVERY



After successful validation, recover the affected pipeline.



Pipeline stages:



INGEST

   ↓

PROFILE

   ↓

DETECT

   ↓

DIAGNOSE

   ↓

REMEDIATE

   ↓

VALIDATE

   ↓

RECOVER

   ↓

RELEASE



Each stage must have a live status.



During execution:



INGEST ✓

PROFILE ✓

DETECT ✓

DIAGNOSE ✓

REMEDIATE 🔄

VALIDATE ⏳

RECOVER ⏳

RELEASE ⏳



After success:



INGEST ✓

PROFILE ✓

DETECT ✓

DIAGNOSE ✓

REMEDIATE ✓

VALIDATE ✓

RECOVER ✓

RELEASE ✓



Overall status:



🟢 PIPELINE RECOVERED



---



26. DOWNSTREAM RELEASE



Only release the corrected dataset after successful validation.



Show:



Clean Data Ready



Status:



🟢 RELEASED



Message:



Validated data has been successfully released to downstream systems.



Do not release data if validation fails.



---



27. RUN SELF-HEALING PIPELINE



Create the secondary button:



▶ RUN SELF-HEALING PIPELINE



This button must be available on the Dashboard and Pipeline Run page.



This is a manual pipeline execution trigger.



IMPORTANT:



Clicking this button does NOT simulate a new application version.



Instead, it runs the currently loaded dataset through the self-healing pipeline.



Flow:



INGEST

↓

PROFILE

↓

DETECT

↓

DIAGNOSE

↓

REMEDIATE

↓

VALIDATE

↓

RECOVER

↓

RELEASE



Show live processing states.



Example:



INGEST ✓

PROFILE ✓

DETECT 🔄

DIAGNOSE ⏳

REMEDIATE ⏳

VALIDATE ⏳

RECOVER ⏳

RELEASE ⏳



Then progressively update until:



INGEST ✓

PROFILE ✓

DETECT ✓

DIAGNOSE ✓

REMEDIATE ✓

VALIDATE ✓

RECOVER ✓

RELEASE ✓



Final status:



🟢 PIPELINE RECOVERED



---



28. UPDATE APPLICATION VS RUN SELF-HEALING PIPELINE



The application must clearly distinguish the two actions.



🔄 UPDATE APPLICATION



Purpose:



Simulate an application/data-source update.



Flow:



v1.0

↓

Application Update

↓

v2.0

↓

New Current Data

↓

Detect Changes

↓

Self-Healing



▶ RUN SELF-HEALING PIPELINE



Purpose:



Manually execute the self-healing pipeline on the existing dataset.



Flow:



Existing Data

↓

Ingest

↓

Profile

↓

Detect

↓

Diagnose

↓

Remediate

↓

Validate

↓

Recover

↓

Release



Both buttons must remain available.



---



29. FIVE MAIN VISUAL STATES



The application must visually support these five major states.



SCREEN 1 — BEFORE UPDATE



BEFORE UPDATE — BASELINE DATA



Show:



- Normal data

- Healthy status

- Baseline statistics

- Data preview

- Charts



---



SCREEN 2 — AFTER UPDATE



AFTER UPDATE — ISSUES DETECTED



Show:



- Changed data

- Red issue indicators

- Before/after comparison

- Detected issues

- Algorithm results



---



SCREEN 3 — REMEDIATION IN PROGRESS



Show:



- Processing status

- Progress bar

- Current issue

- Selected action

- Records affected

- Live pipeline state



---



SCREEN 4 — AFTER REMEDIATION



AFTER REMEDIATION — RESOLVED



Show:



- Remediated dataset

- Before/after metrics

- Validation passed

- Resolved issues

- Pipeline recovered

- Clean data released



---



SCREEN 5 — RUN HISTORY & LOGS



Show:



- Previous pipeline runs

- Detection logs

- Remediation logs

- Validation logs

- Recovery logs

- MTTD

- MTTR

- Auto-resolution percentage



---



30. DATA UPLOAD PAGE



Create:



Data Upload



Allow:



- Upload Baseline CSV

- Upload Current CSV

- Use Sample Dataset



Provide sample scenarios:



1. Normal Data

2. Schema Change

3. Missing Value Spike

4. Distribution Drift

5. Outlier Burst

6. Duplicate Records

7. Combined Update Scenario



---



31. SAMPLE DATA



Create synthetic demo data.



Columns:



ID

Name

Age

Salary

Department

Location



Baseline:



Normal expected data.



Current:



Introduce controlled and intentional problems:



- Age type changed

- Missing Salary values

- Salary distribution changed

- Outliers

- Duplicates

- New column

- Optional invalid records



The changes must be intentional and detectable by the algorithms.



Provide a default:



Combined Update Scenario



that demonstrates multiple issues in one run.



---



32. DATA QUALITY SCORE



Calculate a Data Quality Score based on factors such as:



- Missing values

- Duplicates

- Schema consistency

- Invalid records

- Drift

- Anomalies



Show:



BEFORE UPDATE

Calculated Score



AFTER UPDATE

Calculated Score



AFTER REMEDIATION

Calculated Score



Show the improvement visually.



Do not hardcode the score.



---



33. MONITORING & OBSERVABILITY



Create:



Monitoring & Observability



Show:



- Pipeline health

- Drift incidents

- Anomalies

- Remediation events

- Validation events

- Recovery events

- Failed runs

- Data quality



Charts:



- Drift incidents over time

- Anomaly count

- Data quality improvement

- Auto-resolved issues

- Recovery time



---



34. MTTD / MTTR



Calculate:



MTTD



Mean Time To Detect



MTTR



Mean Time To Recover



Auto-Resolved Failure Percentage



Use actual timestamps generated during pipeline execution.



Do NOT hardcode these metrics.



---



35. EVENT LOGS



Create:



Event Logs



Columns:



- Timestamp

- Event

- Component

- Issue

- Detection Method

- Action

- Records Affected

- Status

- Duration



Example:



10:32:05

DRIFT DETECTION

Salary

PSI = 0.42

Detected



10:32:10

REMEDIATION

Salary

Median Imputation

Processing



10:32:30

REMEDIATION

Salary

Median Imputation

Resolved



10:32:40

VALIDATION

Salary

All checks passed

Success



Generate timestamps dynamically during execution.



---



36. RUN HISTORY



Create:



Run History



Each run should show:



- Run ID

- Start time

- End time

- Trigger type

- Application version

- Issues detected

- Issues resolved

- Validation result

- Recovery status

- MTTD

- MTTR

- Overall status



Trigger types:



APPLICATION UPDATE



or



MANUAL SELF-HEALING



---



37. SIDEBAR NAVIGATION



Create the following navigation:



Dashboard



Data Upload



Application Update



Pipeline Run



Drift Detection



Anomaly Detection



Remediation Center



Validation



Monitoring



Run History



Settings



About Project



The Application Update page must be directly accessible.



The Pipeline Run page must contain the manual:



▶ RUN SELF-HEALING PIPELINE



action.



---



38. APPLICATION UPDATE PAGE



Create a complete dedicated page.



Title:



Application Update



Show:



Current Version

v1.0



        →



New Version

v2.0



Update Impact Preview:



Schema

Data Types

Missing Values

Distribution

Anomalies

Duplicates



Primary button:



🔄 Simulate Application Update



After clicking:



Show update progress.



Then automatically transition to:



Post-Update Analysis



---



39. PIPELINE RUN PAGE



Create:



Pipeline Run



Show the complete pipeline:



INGEST

↓

PROFILE

↓

DETECT

↓

DIAGNOSE

↓

REMEDIATE

↓

VALIDATE

↓

RECOVER

↓

RELEASE



Provide:



▶ RUN SELF-HEALING PIPELINE



button.



Show real-time stage status and progress.



---



40. RESPONSIVE UI



The application must work properly on:



- Desktop

- Laptop

- Tablet

- Mobile



The dashboard must remain usable on smaller screens.



---



41. VISUAL DESIGN



Use a professional modern MLOps / Data Engineering dashboard.



Design characteristics:



- Dark professional sidebar

- Clean main content area

- Modern cards

- Data tables

- Charts

- Pipeline visualization

- Status badges

- Progress bars

- Timeline

- Before/After comparison

- Modal dialogs

- Toast notifications

- Responsive

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/91a3c203-ed24-41f7-aa25-be89b1ea36cd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
