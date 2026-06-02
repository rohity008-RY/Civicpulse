const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const OpenAI = require('openai');
const { getLanguageMeta, normalizeLanguage } = require('../services/languageService');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

let openaiClient;
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error('OpenAI API key is not configured');
    err.code = 'OPENAI_NOT_CONFIGURED';
    err.status = 503;
    throw err;
  }

  if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
};

function fallbackExtract(transcript) {
  const text = String(transcript || '').trim();
  const lower = text.toLowerCase();
  const category = lower.match(/garbage|trash|waste|कचरा|कूड़ा/) ? 'GARBAGE'
    : lower.match(/water|leak|pipe|पानी|गळती/) ? 'WATER'
      : lower.match(/light|streetlight|lamp|बत्ती/) ? 'STREETLIGHT'
        : lower.match(/tree|branch|झाड|पेड़/) ? 'TREE'
          : lower.match(/safe|danger|crime|सुरक्षा/) ? 'SAFETY'
            : lower.match(/pothole|road|खड्डा|गड्ढा/) ? 'POTHOLE'
              : 'OTHER';
  const title = text
    ? text.replace(/\s+/g, ' ').slice(0, 80)
    : 'Civic issue reported by voice';
  return {
    title,
    category,
    description: text || 'Voice transcript could not be parsed clearly. Please review and add details.',
    location_hint: null,
    urgency: category === 'SAFETY' ? 'HIGH' : 'MEDIUM',
  };
}

// ─── POST /api/voice/transcribe ───────────────────────────────
router.post('/transcribe', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio file required' });

    const openai = getOpenAIClient();
    const { File } = await import('node:buffer');
    const filename = (req.file.originalname || 'recording.m4a').replace(/[^a-z0-9._-]/gi, '_');
    const audioFile = new File([req.file.buffer], filename, { type: req.file.mimetype || 'audio/m4a' });
    const transcriptionRequest = {
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json'
    };
    const requestedLanguage = normalizeLanguage(req.body.language || req.body.language_code || req.user?.preferred_language);
    if (requestedLanguage) transcriptionRequest.language = getLanguageMeta(requestedLanguage).whisperCode;

    const transcription = await openai.audio.transcriptions.create(transcriptionRequest);

    res.json({
      transcript: transcription.text,
      language: transcription.language,
      confidence: transcription.segments?.[0]?.avg_logprob
        ? Math.min(100, Math.round((transcription.segments[0].avg_logprob + 1) * 100))
        : 85
    });
  } catch (err) {
    console.error('STT error:', err.message);
    if (err.code === 'OPENAI_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'Voice transcription is not configured.', code: err.code });
    }
    // Fallback: return empty so UI prompts re-record
    res.status(422).json({ error: 'Could not transcribe audio. Please try again.', code: 'STT_FAILED' });
  }
});

// ─── POST /api/voice/extract ──────────────────────────────────
router.post('/extract', authenticate, async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript required' });

    const openai = getOpenAIClient();
    const requestedLanguage = getLanguageMeta(req.body.language_code || req.body.language || req.user?.preferred_language);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `You are a civic issue parser for Mumbai, India. Extract structured data from a citizen's spoken complaint.
Write the extracted title and description in ${requestedLanguage.name}.
Always respond with ONLY valid JSON — no markdown, no explanation.
Categories: POTHOLE, GARBAGE, WATER, STREETLIGHT, SAFETY, TREE, OTHER
Urgency: LOW, MEDIUM, HIGH`
      }, {
        role: 'user',
        content: `Transcript: "${transcript}"

Extract:
{
  "title": "max 80 chars, clear and specific",
  "category": "one of the 7 categories",
  "description": "cleaned grammatical version",
  "location_hint": "any landmark or area mentioned or null",
  "urgency": "LOW|MEDIUM|HIGH"
}`
      }],
      max_tokens: 300,
      temperature: 0.2
    });

    const raw = completion.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const extracted = JSON.parse(cleaned);

    res.json({ extracted });
  } catch (err) {
    console.error('NLP extract error:', err.message);
    res.json({
      extracted: fallbackExtract(req.body?.transcript),
      fallback: true,
      warning: err.code === 'OPENAI_NOT_CONFIGURED'
        ? 'Voice AI extraction is not configured; using transcript fallback.'
        : 'Voice AI extraction failed; using transcript fallback.',
    });
  }
});

module.exports = router;
