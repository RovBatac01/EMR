# User Guide

## Clinic personnel

1. Sign in using an authorized clinic account.
2. Use the dashboard to review daily activity and warnings.
3. Search or register the student patient.
4. Register a clinic visit.
5. Open the visit and create the consultation.
6. Record vital signs, assessment, diagnosis, treatment, and recommendations.
7. Complete and release the consultation when authorized.
8. Issue medicines through the medicine issuance workflow. Stock is checked and deducted in one database transaction.
9. Use Reports for date-filtered exports and Activity Logs for audit review.

## Student account activation

1. An administrator confirms the student's registered email and portal eligibility under **Student Accounts**.
2. The student chooses **Create KLD Student Account** from the login screen.
3. The student enters the exact student number, registered email, and birth date.
4. A single-use activation link is queued to the registered email. In development log mode, a continuation token is displayed.
5. The student chooses a username and strong password and accepts the privacy notice.
6. The student signs in to the separate Student Clinic Portal.

## Student portal

Students may view only their own:

- Medical profile
- Clinic visits
- Released consultation results
- Issued medicines
- Assigned clinic forms and receipts
- Notifications

## Branding

Super Administrators can open **Settings** to change the school name, clinic name, system name, contact details, address, operating information, and institutional logo.

---

# Version 1.1.0 feature guide

## Public landing page

Administrators use **Landing Content** to manage the hero, announcements, promotions, services, team, contact, and operating information. Publish only approved items. Videos must retain controls and should have a fallback image.

## Appointments

Students use **My Appointments** to select a service, available date/time, and reason. Clinic staff use **Appointments** to confirm, decline, propose another schedule, cancel, mark no-show, or check in. Configure capacity and unavailable dates in **Appointment Schedules**.

## Queue

Use **Clinic Queue** for appointment check-ins and walk-ins. Move patients through Waiting, Called, In Consultation, and Completed. Use Urgent or Emergency priority only for clinically justified cases. The public display contains no patient names or complaints.

## Follow-ups

Create a follow-up from an existing consultation or the **Follow-ups** page. Link it to an appointment only after the correct patient and schedule are verified.

## Doctor sign-off

Nurses/staff may prepare a consultation. A user assigned to the Doctor role with an active professional profile must perform **Clinical Sign-off**. Releasing the result to the patient portal is a separate authorized action.

## Students and employees

Use **All Patients** and select the Student or Employee tab. Employee patient registration does not create a clinic-system account. Customize employee categories through **Employee Categories**.

## Inventory controls

Use **Medicine Categories** to create, edit, or deactivate categories. Use **Inventory Control** to request adjustments or run physical counts. The person approving an adjustment should independently verify the reason and count before applying it.

## Patient correction requests

Students use **My Medical Profile** to submit contact, guardian, emergency-contact, or health-information corrections and dated height/weight measurements. Authorized staff review requests under **Correction Requests**. Only approved, non-conflicting requests update official records.

## Attachments

Authorized staff upload medical attachments from the patient record. Files are downloaded through authenticated links. Do not place medical files in the public branding or landing folders.

---

# Version 1.2.0 feature guide

## Public clinic website

The public home page contains the clinic’s navigation, hero, operating information, services, announcements/promotions, About Us, team, appointment call-to-action, contact details, and policy links. **Book Appointment** requires an authenticated eligible account.

Administrators use **Public Landing Page** to:

- preserve, remove, or replace the current hero image/video;
- upload a video fallback image;
- preview media and upload progress;
- configure headings, descriptions, calls to action, location, hours, and contact content;
- create draft or published announcements/promotions;
- upload multiple pictures and select the cover image;
- set publication dates and visibility windows;
- manage services and team items.

## Privacy Policy and Terms

Privacy Policy and Terms links are available before login. After credentials are verified, a user who has not accepted the current published versions must review and complete the separate acknowledgments before a session is created.

Administrators with `policies.manage` use **Privacy & Terms** to create drafts and publish approved versions. Published text is immutable. To make a correction, create and publish a new version; users will be prompted to accept it at their next login.

## Archive a patient

1. Open **All Patients**.
2. Select **Archive** for the intended record.
3. Review active-appointment, open-visit, and follow-up blockers.
4. Resolve blockers instead of silently cancelling or closing them.
5. Optionally enter the archive reason and confirm.

The patient disappears from active selections but remains readable through **Archives → Patients** and historical clinical records.

## Archive a medicine

1. Open **Inventory**.
2. Select **Archive** for the medicine.
3. Resolve pending adjustments and open stock-count sessions.
4. Review the remaining quantity. Archiving does not remove or change it.
5. When stock remains, explicitly acknowledge that it will be preserved but unavailable for new issuance.
6. Optionally enter a reason and confirm.

## Restore an archived record

Use **Archives**, open the Patients or Medicines tab, inspect the record, and select **Unarchive**. The system preserves the original ID and history and reports any active duplicate or category conflict that must be resolved first.

## Safe retries

When a consultation, medicine issuance, or stock receipt was submitted but the browser did not receive a clear response, do not start a second blank form immediately. Retry from the same form/session so the same idempotency key is reused. The backend processes that key only once.

## Backup and restore

Use the documented PowerShell utilities only with authorized access. Back up both MySQL and uploaded files. Test restoration in a separate environment before relying on the backup procedure for production recovery.
