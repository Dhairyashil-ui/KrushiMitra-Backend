"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const textToSpeech = require("@google-cloud/text-to-speech");

const RAW_GOOGLE_CREDENTIALS = process.env.GOOGLE_CREDENTIALS_JSON;
const DEFAULT_CREDENTIAL_FILENAME = process.env.GOOGLE_CREDENTIALS_FILENAME || "gcp-key.json";

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

function normalizeCredentialsString(rawValue) {
	if (!rawValue || typeof rawValue !== "string") {
		return null;
	}
	const trimmed = rawValue.trim();
	const attempts = [trimmed];
	if (!trimmed.startsWith("{")) {
		try {
			attempts.push(Buffer.from(trimmed, "base64").toString("utf8"));
		} catch (error) {
			console.warn("GOOGLE_CREDENTIALS_JSON base64 decode failed, falling back to raw string", {
				error: error.message,
			});
		}
	}
	for (const candidate of attempts) {
		try {
			JSON.parse(candidate);
			return candidate;
		} catch (error) {
			continue;
		}
	}
	throw new Error("GOOGLE_CREDENTIALS_JSON is not valid JSON or base64-encoded JSON");
}

const GOOGLE_CREDENTIALS_JSON = normalizeCredentialsString(RAW_GOOGLE_CREDENTIALS);

function resolveCredentialPathCandidates() {
	const candidates = [
		path.resolve(process.cwd(), DEFAULT_CREDENTIAL_FILENAME),
		path.join(os.tmpdir(), DEFAULT_CREDENTIAL_FILENAME),
	];
	if (process.env.GOOGLE_CREDENTIALS_FILE) {
		candidates.push(path.resolve(process.env.GOOGLE_CREDENTIALS_FILE));
	}
	return [...new Set(candidates)];
}

async function writeCredentialsFile(preferredPaths, jsonContent) {
	let lastError;
	for (const candidate of preferredPaths) {
		try {
			await fs.promises.mkdir(path.dirname(candidate), { recursive: true });
			await fs.promises.writeFile(candidate, jsonContent, {
				encoding: "utf8",
				mode: 0o600,
			});
			return candidate;
		} catch (error) {
			lastError = error;
			console.warn(`Failed to write GOOGLE_CREDENTIALS_JSON to ${candidate}: ${error.message}`);
			continue;
		}
	}
	const reason = lastError ? lastError.message : "No writable credential paths available";
	throw new Error(`Unable to persist GOOGLE_CREDENTIALS_JSON (${reason})`);
}

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
		console.warn(
			"GOOGLE_CREDENTIALS_JSON not provided. Falling back to default Google ADC chain (gcloud auth, metadata server, etc.)."
		);
		return null; // fall back to other ADC providers (gcloud, metadata server, etc.)
	}

	if (!credentialsReadyPromise) {
		credentialsReadyPromise = (async () => {
			const targetPath = await writeCredentialsFile(
				resolveCredentialPathCandidates(),
				GOOGLE_CREDENTIALS_JSON
			);
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

	let client;
	try {
		client = await getTtsClient();
	} catch (error) {
		console.error("Google Cloud TTS client initialization failed", { error: error.message });
		throw new Error(
			"Google Cloud TTS credentials are not configured. Set GOOGLE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS."
		);
	}
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
		try {
			const buffer = await synthesizeChunk(client, chunk, voice, audioConfig);
			audioBuffers.push(buffer);
		} catch (error) {
			console.error("Google Cloud TTS synthesis failed", {
				chunk: i + 1,
				error: error.message,
			});
			throw error;
		}
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
