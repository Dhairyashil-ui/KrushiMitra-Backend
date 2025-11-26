"use strict";

const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");
const fetch = global.fetch || require('node-fetch');

// NOTE: Prefer setting process.env.ELEVENLABS_API_KEY in your environment.
// The fallback here uses the user-provided key for convenience.
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "sk_c3b09109d2b1280789eec94db38ba2adf16ea7e6140c844e"; // Replace if needed

const ELEVEN_TTS_BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

// Only use Niraj - Hindi Narrator voice for all TTS
const NIRAJ_VOICE_ID = "9BWtsMINqrJLrRacOk9x"; // Niraj - Hindi Narrator

// Always use Niraj voice for all languages
const getDefaultVoiceId = (lang) => {
	return NIRAJ_VOICE_ID; // Always return Niraj voice only
};

const GOOGLE_TTS_BASE_URLS = [
	"https://translate.googleapis.com/translate_tts",
	"https://translate.google.com/translate_tts",
];

const LANGUAGE_ALIASES = {
	hi: "hi",
	"hi-in": "hi",
	mr: "mr",
	"mr-in": "mr",
	ml: "ml",
	"ml-in": "ml",
	en: "en",
	"en-in": "en",
	"en-us": "en",
	bn: "bn",
	ta: "ta",
	te: "te",
	kn: "kn",
	gu: "gu",
	or: "or",
	as: "as",
};

const normalizeLanguage = (lang = "hi") => {
	if (!lang || typeof lang !== "string") return "hi";
	const trimmed = lang.trim().toLowerCase();
	if (LANGUAGE_ALIASES[trimmed]) return LANGUAGE_ALIASES[trimmed];
	if (trimmed.includes("-")) {
		const short = trimmed.split("-")[0];
		if (LANGUAGE_ALIASES[short]) return LANGUAGE_ALIASES[short];
		if (short.length === 2) return short;
	}
	return trimmed.slice(0, 2) || "hi";
};

/**
 * Generate speech using Google Translate TTS (free, no API key required).
 * Google endpoint rejects long inputs (> ~200 chars). We chunk text to avoid 400 errors.
 * If Google still fails, we throw a descriptive error (no silent fallback to paid services).
 *
 * @param {string} text
 * @param {"hi"|"mr"|"ml"|"en"} lang
 * @param {{ outputFile?: string }} options
 * @returns {Promise<string>}
 */
async function generateSpeech(text, lang = "hi", options = {}) {
	if (!text || typeof text !== "string") {
		throw new Error("generateSpeech: 'text' must be a non-empty string");
	}

	// Sanitize & trim
	text = text.trim().replace(/\s+/g, ' ');
	const normalizedLang = normalizeLanguage(lang);

	const outputFile = options.outputFile || path.join(__dirname, "speech.mp3");
	await fs.promises.mkdir(path.dirname(outputFile), { recursive: true });

	// Max safe length per Google Translate TTS request
	const MAX_CHARS = 180; // keep well under 200 to reduce rejection risk

	function chunkText(input) {
		if (input.length <= MAX_CHARS) return [input];
		const parts = [];
		let current = '';
		for (const word of input.split(/\s+/)) {
			// If adding the word exceeds limit, push current and start new
			if ((current + ' ' + word).trim().length > MAX_CHARS) {
				if (current) parts.push(current.trim());
				current = word;
			} else {
				current += (current ? ' ' : '') + word;
			}
		}
		if (current) parts.push(current.trim());
		return parts;
	}

	const segments = chunkText(text);
	console.log(`Using Google TTS (${normalizedLang}) with ${segments.length} segment(s)`);

	const buffers = [];
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i];
		console.log(`🔊 [TTS] Segment ${i+1}/${segments.length} length=${seg.length}`);
		const buffer = await fetchSegmentWithFallback(seg, normalizedLang, i, segments.length);
		buffers.push(buffer);
	}

	// Concatenate mp3 buffers – each segment is an MP3. Google returns raw MP3 data without ID3 tags typically, so byte concat works.
	await fs.promises.writeFile(outputFile, Buffer.concat(buffers));
	console.log(`✅ TTS synthesis complete (${lang}) -> ${outputFile}`);
	return outputFile;
}

module.exports = {
	generateSpeech,
};

async function fetchSegmentWithFallback(segment, lang, idx, total) {
	const params = new URLSearchParams({
		ie: 'UTF-8',
		q: segment,
		tl: lang,
		client: 'tw-ob',
		idx: String(idx),
		total: String(total),
		textlen: String(segment.length),
		ttsspeed: '1',
	});

	let lastError;
	for (const baseUrl of GOOGLE_TTS_BASE_URLS) {
		const url = `${baseUrl}?${params.toString()}`;
		try {
			const response = await fetch(url, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
				},
			});
			if (response.ok) {
				const arrayBuf = await response.arrayBuffer();
				return Buffer.from(arrayBuf);
			}
			const errText = await safeReadText(response);
			lastError = `(${baseUrl}) ${response.status} ${response.statusText} ${errText}`;
			if (response.status >= 500) {
				continue; // try the other host for transient errors
			}
		} catch (err) {
			lastError = `(${baseUrl}) ${err.message}`;
			continue;
		}
	}
	throw new Error(`Google TTS failed (segment ${idx + 1}): ${lastError || 'Unknown error'}`);
}

async function safeReadText(response) {
	try {
		const raw = await response.text();
		return raw.length > 240 ? `${raw.slice(0, 240)}…` : raw;
	} catch (err) {
		return err.message || 'failed to read error body';
	}
}

// Example usage when running directly: `node tts.js`
if (require.main === module) {
	(async () => {
		try {
			const hindiText = "नमस्ते किसान भाई! कल बारिश होगी, छिड़काव से बचें।";
			const savedPath = await generateSpeech(hindiText, "hi");
			console.log(`Speech saved to: ${savedPath}`);
		} catch (err) {
			console.error("Failed to generate speech:", err);
			process.exit(1);
		}
	})();
}
