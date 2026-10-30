import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyNotice() {
  return <main className="citizen-home privacy-notice">
    <p className="citizen-eyebrow">CIVICSPULSE</p><h1>Privacy notice</h1><p>Updated 29 October 2026</p>
    <h2>Your account</h2><p>We store your name, email or phone, preferred language, home ward and optional profile photo to provide your account and route civic reports. Passwords are stored as hashes, not readable passwords.</p>
    <h2>Google sign-in</h2><p>If you choose Google sign-in, we receive your Google account identifier, verified email, name and profile photo. We use these for authentication and your profile. We do not request access to your Gmail, contacts, calendar or Google Drive.</p>
    <h2>Public reports</h2><p>Report titles, descriptions, selected locations, uploaded evidence and status timelines are public. Your name may appear with a report unless you choose anonymous submission. Anonymous submission hides your name in the public report, but administrators retain your account association. Do not include private phone numbers, identity documents or other people's sensitive information in reports or photos.</p>
    <h2>Location, microphone and photos</h2><p>These permissions are optional and requested when you choose a related feature. Selected report coordinates can be public. You can choose a ward manually and type a report instead. When available, voice transcription sends the recording to our AI service to prepare report text.</p>
    <h2>Service providers</h2><p>We use Render for hosting, Supabase for database and file storage, and OpenStreetMap tiles for maps. Map tile requests share your IP address and visible map area with the tile provider. When configured, Resend delivers requested password-reset emails and optional summaries; OpenAI processes voice and translation requests.</p>
    <h2>Your device and notifications</h2><p>We keep your sign-in session and language on your device. The website can save an unfinished report on that device. Clear the draft on shared devices. Following reports enables in-app status updates. Weekly email summaries are optional and can be switched off under Updates.</p>
    <h2>Access and deletion requests</h2><p>You can update your profile, home ward and language, remove your profile photo and sign out. Contact <a href="mailto:rohity008@gmail.com">rohity008@gmail.com</a> to request account or report data access, correction or deletion. We review requests and explain any retention needed for public report history, security or applicable obligations.</p>
    <Link className="button secondary" to="/">Back to CivicsPulse</Link>
  </main>;
}
