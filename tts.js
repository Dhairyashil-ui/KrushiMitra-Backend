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

/**
 * Generate speech using ElevenLabs streaming API with only Niraj Hindi voice.
 *
 * @param {string} text - The text to synthesize.
 * @param {"hi"|"mr"|"ml"|"en"} lang - Target language code (ignored, always uses Hindi Niraj voice).
 * @param {{ outputFile?: string, voiceId?: string, modelId?: string }} [options]
 * @returns {Promise<string>} Absolute path to the saved MP3 file.
 */
async function generateSpeech(text, lang = "hi", options = {}) {
	if (!text || typeof text !== "string") {
		throw new Error("generateSpeech: 'text' must be a non-empty string");
	}

	if (!ELEVENLABS_API_KEY) {
		throw new Error("Missing ELEVENLABS_API_KEY. Set env var or update the fallback value.");
	}

	// Always use Niraj voice
	const voiceId = NIRAJ_VOICE_ID;
	const modelId = options.modelId || DEFAULT_MODEL_ID;
	const outputFile = options.outputFile || path.join(__dirname, "speech.mp3");

	console.log(`Using Niraj Hindi voice for TTS`);
	
	const url = `${ELEVEN_TTS_BASE_URL}/${voiceId}/stream`;

	const body = {
		// Multilingual model infers language from input text
		text,
		model_id: modelId,
		// Lower is faster to start streaming; 0 = lowest latency
		optimize_streaming_latency: 0,
		// Choose a common output format
		output_format: "mp3_44100_128",
	};

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"xi-api-key": ELEVENLABS_API_KEY,
			"Content-Type": "application/json",
			Accept: "audio/mpeg",
		},
		body: JSON.stringify(body),
	});

	if (!response.ok || !response.body) {
		let errText = "";
		try {
			errText = await response.text();
		} catch (_) {}
		throw new Error(`Niraj voice TTS failed: ${response.status} ${response.statusText} ${errText}`);
	}

	console.log(`✅ Success with Niraj Hindi voice`);
	
	await fs.promises.mkdir(path.dirname(outputFile), { recursive: true });
	const fileStream = fs.createWriteStream(outputFile);

	// Convert Web ReadableStream (fetch in Node 18+) to Node.js Readable for pipeline
	const readable = typeof Readable.fromWeb === "function" && response.body && typeof response.body.getReader === 'function'
		? Readable.fromWeb(response.body)
		: response.body.pipe ? response.body : Readable.from(response.body);

	await pipeline(readable, fileStream);
	return outputFile;
}

module.exports = {
	generateSpeech,
};

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
