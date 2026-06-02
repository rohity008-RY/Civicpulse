# CivicsPulse Product Requirements Document

**Version:** 1.0  
**Date:** May 31, 2026  
**Product:** CivicsPulse  
**Audience:** Investors, municipal leaders, elected representatives, civic administration teams, implementation partners, and product/engineering reviewers  
**Status:** Review-ready PRD based on the current CivicsPulse web, mobile, and backend implementation

---

## 1. Executive Summary

CivicsPulse is a civic accountability platform that helps citizens raise local civic issues, routes each issue to the right ward and elected representative, tracks resolution progress, and creates public accountability through feeds, trends, representative mapping, and escalation workflows.

The product currently includes:

- A public web portal for citizens to browse reports, solve daily civic awareness puzzles, register/sign in, raise issues, and review issue details.
- An Expo Android mobile app for citizen onboarding, ward feed browsing, profile management, issue submission, voice-assisted issue creation, media upload, and issue tracking.
- A Node.js/Express backend connected to Supabase PostgreSQL/PostGIS for users, locations, representatives, issues, media metadata, comments, votes, notifications, audit logs, SLAs, and representative import history.
- Admin workflows for uploading and maintaining state-city-ward-corporator-MLA mapping data.
- Automated routing from GPS or selected ward to ward, corporator, MLA, and MP.
- AI-assisted voice submission using speech-to-text and NLP extraction, with safe fallback to typed issue creation.
- SLA tracking, trending scores, escalation jobs, and representative-level accountability views.

CivicsPulse is designed to serve three groups at once:

1. **Citizens** get a simple way to report and track local problems.
2. **Government representatives and civic teams** get structured, geo-mapped, evidence-backed requests.
3. **Investors and ecosystem partners** get a scalable civic operating layer with network effects, public engagement, and measurable impact.

The product can start with Mumbai and expand city-by-city using a state-city-ward data model.

---

## 2. Product Vision

### Vision Statement

To become the trusted civic issue reporting and accountability layer for Indian cities, connecting citizens, ward-level representatives, MLAs, MPs, and civic administrators through transparent, location-aware, trackable workflows.

### Product Mission

Enable any citizen to raise a civic issue in under one minute, attach evidence, map it to the correct ward and representative, and track its journey until resolution or escalation.

### Strategic Promise

CivicsPulse turns scattered civic complaints into structured public data:

- What issue happened?
- Where did it happen?
- Which ward owns it?
- Which representative is mapped?
- Has it crossed SLA?
- Is the community amplifying it?
- What is the current status?
- Who needs to act next?

---

## 3. Problem Statement

Citizens often face civic problems such as potholes, garbage piles, water leaks, broken streetlights, tree hazards, and safety risks. Reporting channels are fragmented across phone calls, social media, WhatsApp groups, ward offices, and municipal portals. This creates several problems:

- Citizens do not know which department or representative is responsible.
- Issues are often reported without accurate location, category, or evidence.
- There is limited public visibility into status, SLA, and resolution progress.
- Ward representatives and administrators receive unstructured complaints.
- Escalation paths are unclear when an issue remains unresolved.
- Civic performance is hard to measure at ward, city, and representative levels.

CivicsPulse addresses these gaps by providing a structured, map-aware, representative-aware reporting system with public feeds, media evidence, status tracking, and escalation logic.

---

## 4. Target Users and Stakeholders

### 4.1 Citizens

Citizens use CivicsPulse to:

- Register or sign in.
- Set their home ward.
- Browse local ward issues.
- Raise typed or voice-assisted reports.
- Attach images/videos as evidence.
- Track issue status.
- Upvote, comment, and share reports.
- View mapped representatives for each issue.

### 4.2 Corporators / Ward Representatives

Corporators use CivicsPulse to:

- See issues mapped to their ward.
- Understand public pressure and trending items.
- Update issue status.
- Add official comments.
- Monitor SLA and resolution performance.

### 4.3 MLAs and MPs

MLAs and MPs use CivicsPulse to:

- Review escalated issues.
- Monitor zone/constituency-level patterns.
- Respond to unresolved civic problems.
- Track repeated civic stress areas.

### 4.4 Moderators

Moderators use CivicsPulse to:

- Review public content quality.
- Support issue categorization and triage.
- Access analytics views where permitted.

### 4.5 Admins / Government Operations Teams

Admins use CivicsPulse to:

- Import representative mapping data.
- Maintain state-city-ward structures.
- Configure SLA rules.
- Manage users and roles.
- Review audit logs.
- Access analytics and operational summaries.

### 4.6 Investors and Strategic Partners

Investors and partners evaluate CivicsPulse for:

- Civic engagement adoption.
- Market expansion across cities.
- SaaS/GovTech revenue potential.
- Data network effects.
- Representative accountability metrics.
- Public-private civic infrastructure opportunities.

---

## 5. Goals, Non-Goals, and Success Metrics

### 5.1 Product Goals

- Make civic issue reporting fast, structured, and accessible.
- Support both web and Android entry points.
- Map every issue to a ward wherever possible.
- Map corporators to wards and MLAs/MPs through zone hierarchy.
- Allow manual representative data import when official data changes.
- Provide evidence-backed issue reporting through media uploads.
- Support voice-based reporting for multilingual users.
- Ensure core issue submission does not fail when optional services such as S3 or OpenAI are unavailable.
- Create public visibility into issue status, trending pressure, and representative mapping.
- Provide admin controls for civic data maintenance and analytics.

### 5.2 Non-Goals for Current Version

- CivicsPulse is not a replacement for legally mandated municipal grievance systems unless formally integrated.
- CivicsPulse does not currently provide guaranteed government resolution.
- CivicsPulse does not currently include payment flows.
- CivicsPulse does not currently include full offline-first mobile support.
- CivicsPulse does not currently include production push-notification credentials.
- CivicsPulse does not currently include native iOS distribution.
- CivicsPulse does not claim legal compliance certification without separate legal review.

### 5.3 North Star Metric

**Verified civic issues resolved or officially actioned per ward per month.**

### 5.4 Product Metrics

- Registered users.
- Monthly active users.
- Issues raised per ward/city.
- Percentage of issues with media evidence.
- Percentage of issues mapped to a ward and representative.
- Median time from creation to first official action.
- SLA breach rate.
- Escalation rate to MLA/MP.
- Resolution rate.
- Upvotes/comments/shares per issue.
- Voice submission completion rate.
- Admin import freshness and coverage.

### 5.5 Government Review Metrics

- Ward-level issue density.
- Category breakdown by ward/city.
- SLA compliance by representative and category.
- Repeat issue locations.
- Public engagement on unresolved reports.
- Representative response history.
- Import audit history for mapping data.

---

## 6. Product Scope

### 6.1 Current Product Surfaces

| Surface | Purpose | Current Scope |
| --- | --- | --- |
| Web Portal | Public and authenticated civic portal | Feed, puzzle, issue creation, profile, representative mapping, admin import |
| Android Mobile App | Citizen-first reporting experience | Onboarding, home feed, create issue, voice, profile, issue details |
| Backend API | Product logic and data access | Auth, issues, feed, reps, admin, analytics, voice, notifications |
| Admin Data Tools | Government/ops maintenance | Import corporator/MLA/MP/ward data, SLA config, audit logs |
| Background Jobs | Automation | SLA escalation and trending recalculation |

### 6.2 Current Geographic Scope

The product is structured for India-wide expansion but current defaults and sample flows focus on Mumbai, Maharashtra. The data model supports:

- State
- City
- Zone
- Ward
- Corporator mapped to ward
- MLA mapped to zone
- MP mapped to zone

---

## 7. Key User Journeys

### 7.1 Citizen Onboarding

1. User opens CivicsPulse web portal or Android app.
2. User chooses email sign-in/register or demo exploration.
3. User registers with name, email, and password.
4. User reaches the authenticated home feed.
5. User can set profile details and home ward.
6. Home feed and future reports can use this ward context.

Acceptance requirements:

- Registration succeeds with valid inputs.
- Bad login shows an error and does not enter the app.
- Sign out and sign back in works.
- Profile updates persist.
- Home ward selection persists.
- App should not show a false "No wards found" state while ward data is still loading.

### 7.2 Raise Typed Issue

1. User selects category: pothole, garbage, water, streetlight, safety, tree, or other.
2. User enters title and optional description.
3. User chooses GPS location or selects ward.
4. User can attach up to four media files.
5. User submits issue.
6. Backend resolves ward/representative mapping.
7. Issue appears in public feed and detail screen.
8. Issue detail shows status, location/ward, mapped representatives, and timeline.

Acceptance requirements:

- Title and category are mandatory.
- Either GPS or ward selection is required.
- Media upload should not block issue creation if S3 is unavailable.
- If media storage is unavailable, the user receives a friendly media warning.
- Created issue is visible in feed/detail after submission.

### 7.3 Raise Voice-Assisted Issue

1. User taps microphone/voice button.
2. App opens recording state.
3. User records issue in supported spoken language flow.
4. Audio is uploaded to backend for transcription.
5. Backend transcribes audio and extracts title/category/description.
6. User reviews and edits extracted fields before submitting.
7. If transcription fails, app falls back to typed issue form.

Acceptance requirements:

- Voice screen opens without blank state.
- Cancel/back works.
- Stop recording works.
- Failed AI/transcription does not crash issue submission.
- Typed issue submission remains available.

### 7.4 Browse and Act on Feed

1. User opens home/public feed.
2. User filters or searches issues.
3. User sees category, status, ward/location, upvotes, and age.
4. User opens issue detail.
5. Authenticated user can upvote.
6. User can view timeline and representative mapping.

Acceptance requirements:

- Feed loads with public data.
- Empty state is user-friendly.
- Issue cards link to detail.
- Detail screen handles loading, not-found, and error states.

### 7.5 Representative Mapping Import

1. Admin opens web admin section.
2. Admin uploads CSV/JSON data or imports from URL.
3. Backend parses rows into state-city-zone-ward-representative hierarchy.
4. Corporators map to wards.
5. MLAs/MPs map through zones.
6. Import batch is recorded for audit and review.

Acceptance requirements:

- Only admins can import representative data.
- Import results show rows received/imported.
- Current mapping view shows ward/city/state coverage.
- Recent imports are visible.

### 7.6 SLA Escalation

1. Issue is created with SLA deadline based on category and ward/global configuration.
2. Background job checks overdue issues every 15 minutes.
3. Overdue unresolved issues escalate to MLA.
4. MLA-overdue items can escalate to MP.
5. Issue history records system escalation.

Acceptance requirements:

- SLA deadline is computed on creation.
- Escalation changes issue status.
- Escalation writes timeline history.
- Closed/resolved issues are excluded.

---

## 8. Functional Requirements

### 8.1 Authentication and Profile

Required capabilities:

- Register user.
- Login with email and password.
- Support social auth payload path.
- Retrieve current user.
- Update current user profile.
- Upload current user avatar.
- Update FCM token for future notifications.
- Store JWT and user profile client-side.
- Clear auth state on token expiry/401.

Roles:

- Citizen
- Corporator
- MLA
- MP
- Moderator
- Admin

### 8.2 Issue Creation

Required fields:

- Title
- Category
- Location via lat/lng, ward ID, or city/ward hierarchy

Optional fields:

- Description
- Media files
- Anonymous flag
- Location label
- Source: typed or voice

Backend behavior:

- Resolve representatives using ward ID, city/ward hierarchy, or GPS.
- Compute SLA deadline.
- Insert issue.
- Upload media when configured.
- Return media warning instead of failing when S3 is not configured.
- Add issue history record.

### 8.3 Issue Status and Lifecycle

Statuses:

- Open
- Assigned
- In progress
- Escalated to MLA
- Escalated to MP
- Resolved
- Closed

Representative/admin behavior:

- Update issue status.
- Add official notes.
- Track history.

### 8.4 Feed, Trending, and Engagement

Required capabilities:

- Home feed.
- Escalated feed.
- Trending feed.
- Public stats.
- Upvote issue.
- Comment on issue.
- Share issue.
- Search/filter by category and status.

Trending score factors:

- Upvotes.
- Comments.
- Shares.
- Escalation state.
- Recency.

### 8.5 Representative Data

Required capabilities:

- Public location hierarchy endpoint.
- Ward lookup by GPS.
- Corporator profile.
- MLA profile.
- Leaderboard.
- Admin import of corporators, MLAs, MPs, zones, and wards.
- Admin import history.

Data storage hierarchy:

**State → City → Zone → Ward → Corporator**  
**Zone → MLA / MP**

### 8.6 Admin and Moderation

Admin requirements:

- Import representative mapping.
- Configure SLA rules.
- View analytics overview.
- View zone analytics.
- View audit logs.
- View users.
- Change user role.

Moderator requirements:

- View permitted analytics.
- Support moderation workflows in future release.

### 8.7 Notifications

Current backend supports:

- Notification listing for authenticated users.
- Mark notifications as read.
- Notification types in schema for status, comments, escalation, trending, and monthly reports.

Future production requirement:

- Configure push notification credentials and mobile platform credentials before Play Store release.

### 8.8 Daily Civic Puzzle

The web portal includes a lightweight daily civic puzzle to improve civic awareness and increase user engagement. It teaches users what makes a good issue report, such as clear landmarks, proper category selection, repeat timing, and evidence quality.

---

## 9. Platform Requirements

### 9.1 Web Portal

Primary routes:

- `/` public dashboard and issue feed
- `/raise` issue creation
- `/login` registration/sign-in
- `/profile` citizen profile and home ward
- `/admin` representative import and admin tools
- `/issues/:id` issue details

Web requirements:

- Responsive desktop/mobile layout.
- Public browsing without login.
- Authenticated issue creation.
- Profile photo upload.
- Home ward selection.
- Voice assist with fallback.
- Media attachments.
- Representative and timeline display.
- Admin CSV/JSON import.
- Investor/government-friendly visual presentation.

### 9.2 Android Mobile App

Primary screens:

- Login/onboarding
- Home feed
- Escalated feed
- Create issue
- Trending
- Profile
- Issue detail
- Voice recording/review

Mobile requirements:

- APK build support through EAS preview profile.
- Android package: `com.civicpulse.app`.
- Runtime API URL via `EXPO_PUBLIC_API_URL`.
- Secure token storage.
- Back navigation from create, issue detail, and voice screens.
- Profile save and avatar upload.
- Ward list loading/error/empty states.
- Media and voice fallbacks.

### 9.3 Backend API

Core route groups:

- `/health`
- `/api/auth`
- `/api/issues`
- `/api/feed`
- `/api/reps`
- `/api/admin`
- `/api/voice`
- `/api/notifications`
- `/api/analytics`

Backend requirements:

- JWT authentication.
- Role guards.
- Optional auth for public routes that can benefit from user context.
- Rate limiting.
- CORS.
- Helmet security headers.
- Structured logging.
- Background jobs for escalation and trending.

---

## 10. Data Model Overview

### 10.1 Core Tables

- `users`: citizen/representative/admin accounts, profile, avatar, home ward, role.
- `zones`: city/state-level grouping for MLA/MP mapping.
- `wards`: ward number/name, city/state, zone, optional geometry.
- `corporators`: ward representatives.
- `mlas`: zone/constituency representatives.
- `mps`: parliamentary representatives.
- `issues`: civic reports, status, location, representative mapping, SLA, engagement counts.
- `issue_media`: media metadata and CDN URLs.
- `issue_history`: timeline actions and official/system notes.
- `upvotes`: citizen upvotes.
- `comments`: citizen and official comments.
- `shares`: share events.
- `notifications`: user notifications.
- `audit_log`: admin/security traceability.
- `sla_config`: category/ward SLA rules.
- `rep_import_batches`: representative import tracking.
- `monthly_reports`: representative performance reporting.

### 10.2 Enumerations

- User role: citizen, corporator, MLA, MP, moderator, admin.
- Issue status: open, assigned, in progress, escalated to MLA, escalated to MP, resolved, closed.
- Issue category: pothole, garbage, water, streetlight, safety, tree, other.
- Media type: image, video, audio.
- Comment type: citizen, representative official, admin note.

### 10.3 Location and Mapping

The system supports:

- PostGIS location geometry.
- `find_ward_by_point` database function for GPS-to-ward lookup.
- Manual ward selection.
- State/city/ward hierarchy lookup.
- Representative fallback behavior when mapping is incomplete.

---

## 11. Integrations and Dependencies

### 11.1 Supabase

Used for:

- PostgreSQL database.
- PostGIS geospatial queries.
- Storage for profile avatars.
- Service role backend access.

### 11.2 AWS S3 / CDN

Used for:

- Issue media upload.
- Photo/video/audio evidence storage.
- CDN-accessible media URLs.

Fallback:

- If AWS S3 is not configured, issue creation still succeeds and returns a media warning.

### 11.3 OpenAI

Used for:

- Voice transcription.
- NLP extraction of issue title/category/description.

Fallback:

- If OpenAI is unavailable or not configured, the app returns users to typed issue creation.

### 11.4 Render / Vercel / EAS

Deployment model:

- Backend API: Render.
- Web portal: Vercel or equivalent Vite hosting.
- Android APK/AAB: Expo EAS.

---

## 12. Security, Privacy, and Governance

### 12.1 Authentication

- JWT-based authentication.
- Password hashing with bcrypt.
- Role-based access control.
- Admin routes protected by role checks.
- Rate limiting on API and auth endpoints.

### 12.2 Data Protection Expectations

CivicsPulse should follow privacy-by-design principles:

- Collect only information needed for reporting and accountability.
- Keep passwords hashed.
- Avoid exposing service keys in clients.
- Store media with controlled bucket/CDN configuration.
- Show public issue data while protecting sensitive account operations.
- Separate admin permissions from citizen features.
- Maintain audit logs for administrative actions.

Legal review should be completed before production deployment with government partners, especially for data retention, moderation, public display of citizen reports, and representative performance reporting.

### 12.3 Government Governance Requirements

Before formal government launch:

- Define official data source ownership for ward and representative mapping.
- Define who can approve/import mapping updates.
- Define content moderation rules.
- Define escalation SLAs by category and ward.
- Define official response and closure criteria.
- Define open-data/public-dashboard boundaries.
- Define complaint redressal disclaimers where CivicsPulse is not the official grievance authority.

---

## 13. Analytics and Reporting

### 13.1 Public Analytics

- Total issues.
- Resolved issues.
- Resolution rate.
- Active representatives.
- Trending issues.
- Escalated issues.

### 13.2 Admin Analytics

- Overview metrics.
- Zone-level breakdown.
- Category performance.
- User and role data.
- Import history.
- Audit log.

### 13.3 Representative Report Cards

Potential report card metrics:

- Issues assigned.
- Issues resolved.
- Average resolution time.
- SLA breach rate.
- Escalation count.
- Community engagement.
- Repeat issue hotspots.

---

## 14. Business and Deployment Model

### 14.1 Potential Business Models

- City/municipal SaaS licensing.
- Ward/constituency dashboards for elected representatives.
- Civic analytics subscriptions.
- CSR-funded city deployments.
- Public-private partnership deployments.
- Data/reporting services for urban planning partners.

### 14.2 Expansion Model

1. Launch with one city and selected wards.
2. Import verified representative mapping.
3. Drive citizen onboarding through local campaigns.
4. Partner with representatives and civic bodies.
5. Measure issue creation, response, and resolution.
6. Expand ward-by-ward and city-by-city.

### 14.3 Investor Thesis

CivicsPulse creates value through:

- Citizen-side network effects.
- Representative accountability loops.
- Location-specific civic data.
- Structured issue taxonomy.
- Public visibility and urgency.
- Repeatable city onboarding playbook.
- Cross-platform access through web and Android.

---

## 15. Release Plan

### Phase 1: Review and Pilot Readiness

Scope:

- Stabilize backend deployment.
- Validate Supabase schema and representative imports.
- Verify web portal on production URL.
- Build Android APK.
- Run smoke tests.
- Prepare PRD, demo script, screenshots, and pilot proposal.

Exit criteria:

- Health endpoint works.
- User can register/login.
- Profile and home ward save.
- Issue submission works.
- Media fallback works when S3 is unavailable.
- Voice fallback works when OpenAI is unavailable.
- Admin import works.
- GitHub repo contains backend, frontend, and mobile source.

### Phase 2: Pilot Launch

Scope:

- Choose pilot wards.
- Import real representative data.
- Configure production S3 and OpenAI.
- Add moderation workflow.
- Add official response workflow for representatives.
- Train admin users.
- Launch citizen pilot.

Exit criteria:

- Representative mapping coverage above agreed threshold.
- First 100-500 issues processed.
- Weekly dashboard reports shared with pilot stakeholders.
- SLA and escalation rules validated.

### Phase 3: City Scale

Scope:

- Expand to additional wards/cities.
- Add heatmaps and advanced analytics.
- Add push notifications.
- Add public monthly report cards.
- Add official municipal integrations where available.

---

## 16. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Representative data becomes outdated | Wrong routing and trust loss | Admin import, source URL tracking, audit history |
| S3/OpenAI not configured | Media/voice features fail | Graceful fallback already implemented |
| Low government response | Citizen trust reduction | Representative dashboards, escalation visibility, public reporting |
| Misuse/spam | Feed quality issues | Rate limits, auth, moderation roadmap |
| Privacy concerns | Adoption/legal risk | Legal review, minimized data collection, clear policies |
| Geographic mapping gaps | Unmapped issues | Manual ward selection and hierarchy fallback |
| Free-tier hosting cold starts | Slow UX | Upgrade backend hosting for production |
| Misinformation or defamatory content | Governance risk | Moderation workflow and reporting process required |

---

## 17. Open Questions for Stakeholder Review

### Government Representatives

- Which official data source should be used for ward/corporator/MLA/MP mapping?
- What categories and SLAs should be officially recognized?
- Who can mark an issue as resolved?
- Should official departments, not only elected representatives, be modeled?
- What fields should be public vs internal?
- What moderation policy is acceptable?

### Investors

- Which launch geography has the best adoption path?
- Should the first GTM motion be citizen-first, representative-first, or municipal-first?
- What business model should be tested first?
- Which metrics prove product-market fit?
- What partnerships are required for city-scale adoption?

### Product/Engineering

- Should CivicsPulse support iOS in the next release?
- Should voice support be extended with local-language UI text?
- Should the map view be added before pilot launch?
- Should issue duplicate detection be AI-assisted?
- Should admin import support official API connectors?

---

## 18. Acceptance Criteria for Review Demo

The review demo should prove:

- Web portal opens and shows public feed.
- Daily civic puzzle works.
- New user can register.
- User can set profile and home ward.
- User can upload profile photo.
- User can create typed issue.
- User can attach media or receive a friendly media warning.
- User can open issue detail and see mapped representatives/timeline.
- Voice flow opens and falls back safely if AI is unavailable.
- Admin can upload representative mapping data.
- Backend health check returns OK.
- Android export/build path is available for APK testing.

---

## 19. Appendix: Current Technical Stack

| Layer | Technology |
| --- | --- |
| Web | React, Vite, Zustand, React Query, Framer Motion |
| Mobile | React Native, Expo, EAS |
| Backend | Node.js, Express |
| Database | Supabase PostgreSQL + PostGIS |
| Auth | JWT, bcrypt, RBAC |
| Media | AWS S3 / CDN, Supabase Storage for avatars |
| AI | OpenAI transcription and extraction |
| Jobs | node-cron escalation and trending jobs |
| Hosting | Render backend, Vercel-compatible frontend, EAS Android builds |

---

## 20. Appendix: Review Links and Repositories

Current repository pushed to GitHub:

- `https://github.com/rohity008-RY/Civicpulse`

Recommended investor/government review bundle:

- This PRD.
- Product demo video.
- Web portal URL.
- Android APK link.
- Architecture diagram.
- Pilot ward plan.
- Data privacy and moderation policy draft.
- Representative mapping import template.

---

## 21. Summary

CivicsPulse is a working civic accountability product that combines citizen reporting, representative mapping, public feeds, media evidence, AI-assisted voice reporting, SLA escalation, and admin data governance. It is structured for pilot deployment in Mumbai and scalable to other Indian cities through a state-city-ward data model.

For investors, CivicsPulse represents a scalable GovTech/civic engagement platform with measurable adoption and impact metrics. For government representatives, it provides structured citizen input, ward-level accountability, and a transparent workflow for issue visibility and escalation.

