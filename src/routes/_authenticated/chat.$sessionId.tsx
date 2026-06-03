import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSession } from "@/lib/sessions.functions";
import { sendChatMessage, openingLine } from "@/lib/chat.functions";
import { toast } from "sonner";
import {
  ArrowLeft,
  Languages,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Square,
} from "lucide-react";
import { translateText } from "@/lib/translate.functions";

const AUTO_TTS_KEY = "ll:autoSpeak";

// Map CEFR target language names to BCP-47 codes for SpeechRecognition
const LANG_MAP: Record<string, string> = {
  English: "en-US",
  Spanish: "es-ES",
  French: "fr-FR",
  German: "de-DE",
  Italian: "it-IT",
  Portuguese: "pt-PT",
  Japanese: "ja-JP",
  Korean: "ko-KR",
  Chinese: "zh-CN",
  Mandarin: "zh-CN",
  Russian: "ru-RU",
  Dutch: "nl-NL",
  Polish: "pl-PL",
  Turkish: "tr-TR",
  Arabic: "ar-SA",
  Hindi: "hi-IN",
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult:
    | ((e: {
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export const Route = createFileRoute("/_authenticated/chat/$sessionId")({
  component: ChatPage,
});

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  correction: { original: string; corrected: string; explanation: string } | null;
  created_at: string;
};

function ChatPage() {
  const { sessionId } = Route.useParams();
  const fetchSession = useServerFn(getSession);
  const sendMsg = useServerFn(sendChatMessage);
  const opening = useServerFn(openingLine);

  const sessionQ = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetchSession({ data: { sessionId } }),
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [score, setScore] = useState<{
    accuracy: number;
    fluency: number;
    vocabulary: number;
    overall: number;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const seededRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const baseInputRef = useRef("");
  const [autoSpeak, setAutoSpeak] = useState(false);
  const spokenIdsRef = useRef<Set<string>>(new Set());
  const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    const SR =
      (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRecognitionLike;
          webkitSpeechRecognition?: new () => SpeechRecognitionLike;
        }
      ).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    setSpeechSupported(!!SR);
    try {
      setAutoSpeak(localStorage.getItem(AUTO_TTS_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggleAutoSpeak() {
    setAutoSpeak((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AUTO_TTS_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (!next && ttsSupported) window.speechSynthesis.cancel();
      return next;
    });
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR =
      (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRecognitionLike;
          webkitSpeechRecognition?: new () => SpeechRecognitionLike;
        }
      ).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    if (!SR) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }
    const rec = new SR();
    const targetLang = (
      sessionQ.data?.session as { scenarios?: { target_language?: string } } | undefined
    )?.scenarios?.target_language;
    rec.lang = (targetLang && LANG_MAP[targetLang]) || navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    baseInputRef.current = input ? input.trim() + " " : "";
    rec.onresult = (e) => {
      let finalText = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0].transcript;
        if (r.isFinal) finalText += t;
        else interim += t;
      }
      setInput((baseInputRef.current + finalText + interim).trimStart());
    };
    rec.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        toast.error(`Mic error: ${e.error}`);
      }
    };
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      taRef.current?.focus();
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      toast.error("Could not start microphone");
    }
  }

  const historyLoadedRef = useRef(false);
  useEffect(() => {
    if (sessionQ.data) {
      const msgs = sessionQ.data.messages as ChatMessage[];
      if (!historyLoadedRef.current) {
        // Mark pre-existing history as already-spoken (only on first load)
        msgs.forEach((m) => {
          if (m.role === "assistant") spokenIdsRef.current.add(m.id);
        });
        historyLoadedRef.current = true;
      }
      setMessages(msgs);
    }
  }, [sessionQ.data]);

  // Trigger opening line if empty (runs once after first load)
  useEffect(() => {
    if (!sessionQ.data || seededRef.current) return;
    seededRef.current = true;
    if (sessionQ.data.messages.length === 0) {
      opening({ data: { sessionId } }).then(() => sessionQ.refetch());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionQ.data, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Auto-speak newest assistant message when autoSpeak is enabled
  const ttsLangRef = useRef("en-US");
  useEffect(() => {
    if (!autoSpeak || !ttsSupported || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant" || last.id.startsWith("tmp-")) return;
    if (spokenIdsRef.current.has(last.id)) return;
    spokenIdsRef.current.add(last.id);
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(last.content);
    u.lang = ttsLangRef.current;
    const match = synth
      .getVoices()
      .find((v) => v.lang?.toLowerCase().startsWith(ttsLangRef.current.slice(0, 2).toLowerCase()));
    if (match) u.voice = match;
    u.rate = 0.95;
    synth.speak(u);
  }, [messages, autoSpeak, ttsSupported]);

  // Seed spoken set with existing history so we don't re-speak old messages on toggle-on
  useEffect(() => {
    if (!autoSpeak) return;
    const last = messages[messages.length - 1];
    messages.forEach((m) => {
      if (m.role === "assistant" && m !== last) spokenIdsRef.current.add(m.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpeak]);

  useEffect(() => {
    taRef.current?.focus();
  }, [sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    const tempUserId = `tmp-${Date.now()}`;
    setMessages((m) => [
      ...m,
      {
        id: tempUserId,
        role: "user",
        content: text,
        correction: null,
        created_at: new Date().toISOString(),
      },
    ]);
    try {
      const result = await sendMsg({ data: { sessionId, message: text } });
      setScore(result.score);
      setMessages((m) => {
        const next = m.filter((x) => x.id !== tempUserId);
        next.push(
          {
            id: result.userMessageId,
            role: "user",
            content: text,
            correction: null,
            created_at: new Date().toISOString(),
          },
          {
            id: result.assistantMessageId,
            role: "assistant",
            content: result.reply,
            correction: result.correction,
            created_at: new Date().toISOString(),
          },
        );
        return next;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
      setMessages((m) => m.filter((x) => x.id !== tempUserId));
    } finally {
      setSending(false);
    }
  }

  const session = sessionQ.data?.session as
    | (Record<string, unknown> & { scenarios: Record<string, string> })
    | undefined;
  const scenario = session?.scenarios;
  const ttsLang = (scenario?.target_language && LANG_MAP[scenario.target_language]) || "en-US";
  ttsLangRef.current = ttsLang;

  return (
    <div className="mx-auto flex h-[calc(100vh-65px)] max-w-4xl flex-col px-4 py-4">
      {/* Scenario card */}
      {scenario && (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <Link
            to="/dashboard"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-2xl">{scenario.emoji}</div>
          <div className="flex-1">
            <div className="font-display text-base font-semibold">{scenario.title}</div>
            <div className="text-xs text-muted-foreground">
              {scenario.character_name} · {scenario.character_role} · CEFR {scenario.difficulty}
            </div>
          </div>
          {score && (
            <div className="hidden items-center gap-2 sm:flex">
              <ScorePill label="Acc" v={score.accuracy} />
              <ScorePill label="Flu" v={score.fluency} />
              <ScorePill label="Voc" v={score.vocabulary} />
            </div>
          )}
          {ttsSupported && (
            <button
              type="button"
              onClick={toggleAutoSpeak}
              aria-pressed={autoSpeak}
              aria-label={autoSpeak ? "Disable auto voice replies" : "Enable auto voice replies"}
              title={autoSpeak ? "Auto-speak: On" : "Auto-speak: Off"}
              className={`grid h-9 w-9 place-items-center rounded-full border border-border transition-colors ${
                autoSpeak
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted text-muted-foreground"
              }`}
            >
              {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl border border-border bg-card p-4"
      >
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center text-muted-foreground">
            <div>
              <Sparkles className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-2 text-sm">Warming up your scene...</p>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} m={m} ttsLang={ttsLang} />
          ))}
          {sending && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Dot /> <Dot delay={150} /> <Dot delay={300} />
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-3 flex items-end gap-2 rounded-2xl border border-border bg-card p-2"
      >
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={scenario ? `Reply to ${scenario.character_name}...` : "Type a message..."}
          rows={1}
          className="flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          style={{ maxHeight: 160 }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            aria-label={listening ? "Stop recording" : "Start voice input"}
            title={listening ? "Stop recording" : "Speak your message"}
            className={`grid h-10 w-10 place-items-center rounded-full border border-border transition-colors ${
              listening
                ? "animate-pulse bg-destructive text-destructive-foreground"
                : "bg-background hover:bg-muted"
            }`}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
      </form>
    </div>
  );
}

function MessageBubble({ m, ttsLang }: { m: ChatMessage; ttsLang: string }) {
  const isUser = m.role === "user";
  const [speaking, setSpeaking] = useState(false);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const translate = useServerFn(translateText);
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  function toggleSpeak() {
    if (!canSpeak) return;
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(m.content);
    u.lang = ttsLang;
    const match = synth
      .getVoices()
      .find((v) => v.lang?.toLowerCase().startsWith(ttsLang.slice(0, 2).toLowerCase()));
    if (match) u.voice = match;
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }

  async function handleTranslate() {
    if (translating) return;
    if (translation) {
      setTranslation(null);
      return;
    }
    setTranslating(true);
    try {
      const res = await translate({ data: { text: m.content, targetLanguage: "Arabic" } });
      setTranslation(res.translation);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] space-y-2">
        <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm ${
              isUser
                ? "rounded-tr-sm bg-primary text-primary-foreground"
                : "rounded-tl-sm bg-muted text-foreground"
            }`}
          >
            {m.content}
          </div>
          <div className={`flex shrink-0 flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
            {!isUser && canSpeak && (
              <button
                type="button"
                onClick={toggleSpeak}
                aria-label={speaking ? "Stop playback" : "Listen to message"}
                title={speaking ? "Stop" : "Listen"}
                className={`grid h-8 w-8 place-items-center rounded-full border border-border transition-colors ${
                  speaking
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted text-muted-foreground"
                }`}
              >
                {speaking ? (
                  <Square className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleTranslate}
              disabled={translating}
              aria-label={translation ? "Hide Arabic translation" : "Translate to Arabic"}
              title={translation ? "Hide translation" : "Translate to Arabic"}
              className={`grid h-8 w-8 place-items-center rounded-full border border-border transition-colors disabled:opacity-50 ${
                translation
                  ? "bg-accent text-accent-foreground"
                  : "bg-background hover:bg-muted text-muted-foreground"
              }`}
            >
              {translating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Languages className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
        {translation && (
          <div
            dir="rtl"
            lang="ar"
            className="rounded-xl border border-border bg-background/60 px-3 py-2 text-sm leading-relaxed"
          >
            {translation}
          </div>
        )}
        {m.correction && (
          <div className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs">
            <div className="font-semibold text-accent">Gentle correction</div>
            <div className="mt-1">
              <span className="line-through opacity-70">{m.correction.original}</span>
            </div>
            <div className="font-medium">→ {m.correction.corrected}</div>
            <div className="mt-1 italic text-muted-foreground">{m.correction.explanation}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScorePill({ label, v }: { label: string; v: number }) {
  const tone =
    v >= 80
      ? "bg-accent/20 text-accent-foreground"
      : v >= 60
        ? "bg-primary/15"
        : "bg-destructive/15";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${tone}`}>
      {label} {v}
    </span>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
