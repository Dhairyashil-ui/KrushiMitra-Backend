"use strict";

const fs = require("fs");
const path = require("path");
const textToSpeech = require("@google-cloud/text-to-speech");

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
};
const DEFAULT_OUTPUT = path.join(__dirname, "speech.mp3");
const MAX_CHARS_PER_REQUEST = 4500; // Google Cloud TTS hard limit is ~5000 chars

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

const speakingRate = sanitizeFloat(process.env.GOOGLE_TTS_SPEAKING_RATE, 1.0);
const pitch = sanitizeFloat(process.env.GOOGLE_TTS_PITCH, 0);
const audioEncoding = process.env.GOOGLE_TTS_AUDIO_ENCODING || "MP3";

const ttsClient = createClient();

function createClient() {
	const base64Credentials = process.env.GOOGLE_TTS_CREDENTIALS;
	if (base64Credentials) {
		try {
			const decoded = Buffer.from(base64Credentials, "base64").toString("utf8");
			const credentials = JSON.parse(decoded);
			return new textToSpeech.TextToSpeechClient({ credentials });
		} catch (error) {
			throw new Error(`Invalid GOOGLE_TTS_CREDENTIALS: ${error.message}`);
		}
	}
	return new textToSpeech.TextToSpeechClient();
}

function sanitizeFloat(value, fallback) {
	if (value === undefined || value === null || value === "") return fallback;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : fallback;
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

async function synthesizeChunk(textChunk, voice, audioConfig) {
	const [response] = await ttsClient.synthesizeSpeech({
		input: { text: textChunk },
		voice,
		audioConfig,
	});
	if (!response || !response.audioContent) {
		throw new Error("Received empty audio from Google Cloud TTS");
	}
	return Buffer.from(response.audioContent);
}

async function generateSpeech(text, lang = "hi", options = {}) {
	if (!text || typeof text !== "string") {
		throw new Error("generateSpeech: 'text' must be a non-empty string");
	}

	const trimmed = text.trim().replace(/\s+/g, " ");
	if (!trimmed) {
		throw new Error("generateSpeech: text is empty after trimming");
	}

	const normalizedLang = normalizeLanguage(lang);
	const voice = resolveVoice(normalizedLang);
	const audioConfig = buildAudioConfig();
	const chunks = chunkText(trimmed);
	const outputFile = options.outputFile || DEFAULT_OUTPUT;
	await fs.promises.mkdir(path.dirname(outputFile), { recursive: true });

	console.log(
		`Using Google Cloud TTS voice=${voice.name} lang=${voice.languageCode} chunks=${chunks.length}`
	);

	const audioBuffers = [];
	for (let i = 0; i < chunks.length; i++) {
		const chunk = chunks[i];
		console.log(`🔊 [GCP TTS] chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
		const buffer = await synthesizeChunk(chunk, voice, audioConfig);
		audioBuffers.push(buffer);
	}

	await fs.promises.writeFile(outputFile, Buffer.concat(audioBuffers));
	console.log(`✅ Google Cloud TTS synthesis complete (${normalizedLang}) -> ${outputFile}`);
	return outputFile;
}

module.exports = {
	generateSpeech,
};

if (require.main === module) {
	(async () => {
		try {
			const sample = "नमस्ते किसान भाई! कल बारिश होगी, छिड़काव से बचें।";
			const savedPath = await generateSpeech(sample, "hi");
			console.log(`Speech saved to: ${savedPath}`);
		} catch (err) {
			console.error("Failed to generate speech:", err);
			process.exit(1);
		}
	})();
}
