import { Mic, MicOff } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

const LANGUAGE_MAP = {
  Hindi: "hi-IN",
  Bhojpuri: "hi-IN",
  English: "en-IN",
  Marathi: "mr-IN",
  Bengali: "bn-IN",
};

const resolveSpeechLocale = (language) => {
  if (!language) {
    return "hi-IN";
  }

  if (LANGUAGE_MAP[language]) {
    return LANGUAGE_MAP[language];
  }

  if (/^[a-z]{2,3}-[A-Z]{2}$/.test(language)) {
    return language;
  }

  return "hi-IN";
};

const getMicErrorMessage = (error) => {
  switch (error) {
    case "aborted":
      return "";
    case "audio-capture":
      return "No microphone was detected. Check your device mic and browser permissions.";
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission is blocked. Allow mic access in the browser and try again.";
    case "network":
      return "Browser speech service is unavailable right now. We retried once, but you may need Chrome or Edge, or you can type the note manually.";
    case "no-speech":
      return "We did not hear anything. Try again and speak right after the mic turns on.";
    case "language-not-supported":
      return "This language is not supported by your browser's speech recognition.";
    default:
      return "Could not capture voice input right now.";
  }
};

export default function VoiceComposerField({
  label,
  value,
  onChange,
  language = "hi-IN",
  placeholder = "Tap the microphone or type your note",
}) {
  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);
  const retryRef = useRef(0);
  const hasResultRef = useRef(false);
  const lastTranscriptRef = useRef("");
  const sessionRef = useRef(0);
  const [listening, setListening] = useState(false);
  const [statusText, setStatusText] = useState("");

  const logVoiceEvent = (eventName, detail) => {
    console.info(`[VoiceComposer] ${eventName}`, detail || "");
  };

  const ensureMicrophoneAccess = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
  };

  const finishListening = () => {
    setListening(false);
    recognitionRef.current = null;
    manualStopRef.current = false;
  };

  const handleTranscriptResult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0]?.transcript || "")
      .join(" ")
      .trim();

    const resultMeta = Array.from(event.results).map((result) => ({
      isFinal: result.isFinal,
      transcript: result[0]?.transcript || "",
      confidence: result[0]?.confidence,
    }));

    hasResultRef.current = true;
    lastTranscriptRef.current = transcript;
    setStatusText(transcript ? "Transcript captured." : "Listening...");
    logVoiceEvent("result", {
      transcript,
      locale: resolveSpeechLocale(language),
      results: resultMeta,
    });
    onChange(transcript);
  };

  const handleRecognitionEnd = ({ isManualStop = false } = {}) => {
    const hadResult = hasResultRef.current;
    const lastTranscript = lastTranscriptRef.current;

    finishListening();
    setStatusText("");
    logVoiceEvent("end", {
      session: sessionRef.current,
      isManualStop,
      hadResult,
      lastTranscript,
    });

    if (!isManualStop && !hadResult) {
      toast.error("Mic session ended without any transcript. Try speaking immediately after the mic turns on.");
    }
  };

  const buildRecognitionInstance = (SpeechRecognition) => {
    const recognition = new SpeechRecognition();
    recognition.lang = resolveSpeechLocale(language);
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setStatusText("Listening...");
      logVoiceEvent("start", {
        session: sessionRef.current,
        locale: recognition.lang,
      });
    };
    recognition.onaudiostart = () => {
      setStatusText("Microphone active...");
      logVoiceEvent("audio-start", { session: sessionRef.current });
    };
    recognition.onspeechstart = () => {
      setStatusText("Speech detected...");
      logVoiceEvent("speech-start", { session: sessionRef.current });
    };
    recognition.onspeechend = () => {
      setStatusText("Processing speech...");
      logVoiceEvent("speech-end", { session: sessionRef.current });
    };
    recognition.onsoundend = () => {
      logVoiceEvent("sound-end", { session: sessionRef.current });
    };
    recognition.onnomatch = () => {
      setStatusText("Could not understand speech clearly.");
      logVoiceEvent("no-match", { session: sessionRef.current });
    };
    recognition.onend = () => {
      handleRecognitionEnd({ isManualStop: manualStopRef.current });
    };
    recognition.onerror = async (event) => {
      const isManualStop = manualStopRef.current;
      logVoiceEvent("error", {
        session: sessionRef.current,
        error: event.error,
        message: getMicErrorMessage(event.error),
      });
      finishListening();

      if (isManualStop) {
        setStatusText("");
        return;
      }

      if (event.error === "network" && retryRef.current < 1) {
        retryRef.current += 1;
        setStatusText("Speech service unavailable. Retrying once...");

        try {
          await ensureMicrophoneAccess();
          const retryRecognition = buildRecognitionInstance(SpeechRecognition);
          recognitionRef.current = retryRecognition;
          retryRecognition.start();
          return;
        } catch (retryError) {
          setStatusText("");
          console.error("[VoiceComposer] retry-failed", retryError);
          toast.error(retryError?.message || getMicErrorMessage("network"));
          return;
        }
      }

      setStatusText("");
      const message = getMicErrorMessage(event.error);
      if (message) {
        toast.error(message);
      }
    };
    recognition.onresult = handleTranscriptResult;

    return recognition;
  };

  const startListening = async () => {
    if (typeof window === "undefined") {
      toast.error("Voice input is only available in the browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Try Chrome on desktop.");
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      toast.error("Voice input needs a secure page (HTTPS or localhost) to access the microphone.");
      return;
    }

    try {
      recognitionRef.current?.stop();
      manualStopRef.current = false;
      retryRef.current = 0;
      hasResultRef.current = false;
      lastTranscriptRef.current = "";
      sessionRef.current += 1;
      setStatusText("Requesting microphone access...");
      logVoiceEvent("request-start", {
        session: sessionRef.current,
        language,
        locale: resolveSpeechLocale(language),
      });
      await ensureMicrophoneAccess();

      const recognition = buildRecognitionInstance(SpeechRecognition);
      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      finishListening();
      setStatusText("");
      console.error("[VoiceComposer] start-failed", error);
      toast.error(error?.message || "Could not start the microphone.");
    }
  };

  const stopListening = () => {
    manualStopRef.current = true;
    logVoiceEvent("manual-stop", {
      session: sessionRef.current,
      transcript: lastTranscriptRef.current,
    });
    recognitionRef.current?.stop();
    setListening(false);
    setStatusText("");
  };

  return (
    <label className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-base-content/80">{label}</span>
        <button
          className={listening ? "k-btn" : "k-btn-ghost"}
          type="button"
          onClick={listening ? stopListening : startListening}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {listening ? "Stop mic" : "Use mic"}
        </button>
      </div>
      <textarea
        className="k-textarea"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-xs uppercase tracking-[0.18em] text-base-content/40">
        Live speech capture fills the transcript that goes to the backend.
      </p>
      {statusText ? (
        <p className="text-xs tracking-[0.04em] text-base-content/55">{statusText}</p>
      ) : null}
    </label>
  );
}
