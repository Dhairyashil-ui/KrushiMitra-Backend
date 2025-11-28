"use strict";

const fs = require("fs");
const path = require("path");
const textToSpeech = require("@google-cloud/text-to-speech");

const GOOGLE_CREDENTIALS_JSON = process.env.GOOGLE_CREDENTIALS_JSON;
const GOOGLE_CREDENTIALS_FILE =
	process.env.GOOGLE_CREDENTIALS_FILE || path.resolve(process.cwd(), "gcp-key.json");

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

const VOICE_PREFERENCES = {
	hi: { languageCode: "hi-IN", name: "hi-IN-Standard-A", ssmlGender: "FEMALE" },
	mr: { languageCode: "mr-IN", name: "mr-IN-Standard-A", ssmlGender: "FEMALE" },
	ml: { languageCode: "ml-IN", name: "ml-IN-Standard-A", ssmlGender: "FEMALE" },
	en: { languageCode: "en-IN", name: "en-IN-Neural2-C", ssmlGender: "FEMALE" },
	bn: { languageCode: "bn-IN", name: "bn-IN-Standard-A", ssmlGender: "FEMALE" },
	ta: { languageCode: "ta-IN", name: "ta-IN-Standard-A", ssmlGender: "FEMALE" },
	te: { languageCode: "te-IN", name: "te-IN-Standard-A", ssmlGender: "FEMALE" },
	kn: { languageCode: "kn-IN", name: "kn-IN-Standard-A", ssmlGender: "FEMALE" },
	gu: { languageCode: "gu-IN", name: "gu-IN-Standard-A", ssmlGender: "FEMALE" },
	or: { languageCode: "or-IN", name: "or-IN-Standard-A", ssmlGender: "FEMALE" },
	as: { languageCode: "as-IN", name: "as-IN-Standard-A", ssmlGender: "FEMALE" },
};

const DEFAULT_VOICE = {
	languageCode: "en-IN",
	name: "en-IN-Neural2-C",
	ssmlGender: "FEMALE",
};

const MAX_CHARS_PER_REQUEST = 4500; // Google Cloud limit is ~5000 characters

const speakingRate = sanitizeFloat(process.env.GOOGLE_TTS_SPEAKING_RATE, 1.0);
const pitch = sanitizeFloat(process.env.GOOGLE_TTS_PITCH, 0);
const audioEncoding = process.env.GOOGLE_TTS_AUDIO_ENCODING || "MP3";

let credentialsReadyPromise;
let ttsClientPromise;

function sanitizeFloat(value, fallback) {
	if (value === undefined || value === null || value === "") return fallback;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeLanguage(lang = "hi") {
	if (!lang || typeof lang !== "string") return "hi";
	const trimmed = lang.trim().toLowerCase();
	if (LANGUAGE_ALIASES[trimmed]) return LANGUAGE_ALIASES[trimmed];
	if (trimmed.includes("-")) {
		const short = trimmed.split("-")[0];
		if (LANGUAGE_ALIASES[short]) return LANGUAGE_ALIASES[short];
		if (short.length === 2) return short;
	}
	return trimmed.length === 2 ? trimmed : "hi";
}

async function ensureGoogleCredentialsFile() {
	if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		try {
			await fs.promises.access(
				process.env.GOOGLE_APPLICATION_CREDENTIALS,
				fs.constants.R_OK
			);
			return process.env.GOOGLE_APPLICATION_CREDENTIALS;
		} catch (error) {
			console.warn(
				`GOOGLE_APPLICATION_CREDENTIALS not readable (${error.message}). Will attempt to rewrite.`
			);
		}
	}

	if (!GOOGLE_CREDENTIALS_JSON) {
		return null; // fall back to other ADC providers (gcloud, metadata server, etc.)
	}

	if (!credentialsReadyPromise) {
		credentialsReadyPromise = (async () => {
			try {
				JSON.parse(GOOGLE_CREDENTIALS_JSON);
			} catch (error) {
				throw new Error(`GOOGLE_CREDENTIALS_JSON is not valid JSON: ${error.message}`);
			}
			const targetPath = GOOGLE_CREDENTIALS_FILE;
			await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
			await fs.promises.writeFile(targetPath, GOOGLE_CREDENTIALS_JSON, {
				encoding: "utf8",
				mode: 0o600,
			});
			process.env.GOOGLE_APPLICATION_CREDENTIALS = targetPath;
			return targetPath;
		})().catch((error) => {
			credentialsReadyPromise = undefined;
			throw error;
		});
	}

	return credentialsReadyPromise;
}

async function getTtsClient() {
	if (!ttsClientPromise) {
		ttsClientPromise = (async () => {
			const credentialsPath = await ensureGoogleCredentialsFile();
			const clientOptions = {};
			if (credentialsPath) {
				clientOptions.keyFilename = credentialsPath;
			}
			return new textToSpeech.TextToSpeechClient(
				Object.keys(clientOptions).length ? clientOptions : undefined
			);
		})();
	}
	return ttsClientPromise;
}

function chunkText(input) {
	if (input.length <= MAX_CHARS_PER_REQUEST) {
		return [input];
	}
	const parts = [];
	let current = "";
	for (const word of input.split(/\s+/)) {
		const candidate = current ? `${current} ${word}` : word;
		if (candidate.length > MAX_CHARS_PER_REQUEST) {
			if (current) parts.push(current);
			current = word;
		} else {
			current = candidate;
		}
	}
	if (current) parts.push(current);
	return parts;
}

function resolveVoice(langCode) {
	return VOICE_PREFERENCES[langCode] || DEFAULT_VOICE;
}

function buildAudioConfig() {
	return {
		audioEncoding,
		speakingRate,
		pitch,
	};
}

async function synthesizeChunk(client, textChunk, voice, audioConfig) {
	const [response] = await client.synthesizeSpeech({
		input: { text: textChunk },
		voice,
		audioConfig,
	});
	if (!response || !response.audioContent) {
		throw new Error("Received empty audio from Google Cloud TTS");
	}
	return Buffer.from(response.audioContent);
}

async function generateSpeech(text, lang = "hi") {
	if (!text || typeof text !== "string") {
		throw new Error("generateSpeech: 'text' must be a non-empty string");
	}

	const trimmed = text.trim().replace(/\s+/g, " ");
	if (!trimmed) {
		throw new Error("generateSpeech: text is empty after trimming");
	}

	const client = await getTtsClient();
	const normalizedLang = normalizeLanguage(lang);
	const voice = resolveVoice(normalizedLang);
	const audioConfig = buildAudioConfig();
	const chunks = chunkText(trimmed);

	console.log(
		`Using Google Cloud TTS voice=${voice.name} lang=${voice.languageCode} chunks=${chunks.length}`
	);

	const audioBuffers = [];
	for (let i = 0; i < chunks.length; i += 1) {
		const chunk = chunks[i];
		console.log(`🔊 [GCP TTS] chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
		const buffer = await synthesizeChunk(client, chunk, voice, audioConfig);
		audioBuffers.push(buffer);
	}

	return Buffer.concat(audioBuffers);
}

module.exports = {
	generateSpeech,
};

if (require.main === module) {
	(async () => {
		try {
			const sample = "नमस्ते किसान भाई! कल बारिश होगी, छिड़काव से बचें।";
			const audioBuffer = await generateSpeech(sample, "hi");
			const outFile = path.join(__dirname, "sample.mp3");
			await fs.promises.writeFile(outFile, audioBuffer);
			console.log(`Speech saved to: ${outFile}`);
		} catch (err) {
			console.error("Failed to generate speech:", err);
			process.exit(1);
		}
	})();
}

