const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const OpenAI = require('openai');
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

// ─── POST /api/voice/transcribe ───────────────────────────────
router.post('/transcribe', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio file required' });

    const openai = getOpenAIClient();
    const { File } = await import('node:buffer');
    const audioFile = new File([req.file.buffer], 'recording.webm', { type: req.file.mimetype });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: req.body.language || null, // auto-detect if null
      response_format: 'verbose_json'
    });

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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `You are a civic issue parser for Mumbai, India. Extract structured data from a citizen's spoken complaint.
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
    if (err.code === 'OPENAI_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'Voice issue extraction is not configured.', code: err.code });
    }
    res.status(422).json({ error: 'Could not extract issue details. Please fill form manually.' });
  }
});

module.exports = router;
