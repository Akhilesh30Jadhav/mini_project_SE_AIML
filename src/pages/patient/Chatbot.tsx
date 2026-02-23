import { useState, useRef, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, Bot, User, AlertCircle } from "lucide-react";
import apiClient from "@/lib/apiClient";

type Message = { role: "user" | "assistant"; content: string };

export default function Chatbot() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! I'm CareSphere Health Assistant 👋 I can help you understand health information, explain lab results, and answer general wellness questions. How can I help you today?\n\n*Note: I'm not a doctor and cannot diagnose conditions or prescribe treatments.*" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage() {
        const text = input.trim();
        if (!text || loading) return;
        const userMsg: Message = { role: "user", content: text };
        setMessages(m => [...m, userMsg]);
        setInput("");
        setLoading(true);
        try {
            const chatHistory = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
            const res = await apiClient.post("/chat", { messages: chatHistory, include_context: true });
            setMessages(m => [...m, { role: "assistant", content: res.data.reply }]);
        } catch (e: any) {
            setMessages(m => [...m, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }]);
        } finally {
            setLoading(false);
        }
    }

    function handleKey(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    }

    const QUICK = ["What do low hemoglobin levels mean?", "How can I improve my sleep quality?", "What are normal blood pressure ranges?", "Explain my lifestyle score", "Foods rich in Vitamin D?", "Stress management tips"];

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] max-h-[780px]">
            <PageHeader title="Health Assistant" subtitle="Ask health questions. Context from your health data is shared to personalize answers." />

            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-800 mb-3">
                ⚠️ AI assistant for informational purposes only. Cannot diagnose or prescribe. Always consult a doctor for medical advice.
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden rounded-2xl border-slate-200 shadow-sm">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => (
                        <div key={i} className={["flex gap-3", msg.role === "user" ? "justify-end" : "justify-start"].join(" ")}>
                            {msg.role === "assistant" && (
                                <div className="h-8 w-8 shrink-0 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                                    <Bot size={14} className="text-blue-600" />
                                </div>
                            )}
                            <div className={["max-w-[80%] rounded-2xl px-4 py-3 text-sm", msg.role === "user" ? "bg-blue-600 text-white ml-auto" : "bg-slate-100 text-slate-800"].join(" ")}>
                                {msg.content.split("\n").map((line, j) => (
                                    <span key={j}>{line}{j < msg.content.split("\n").length - 1 && <br />}</span>
                                ))}
                            </div>
                            {msg.role === "user" && (
                                <div className="h-8 w-8 shrink-0 rounded-full bg-blue-600 flex items-center justify-center">
                                    <User size={14} className="text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-3 justify-start">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                                <Bot size={14} className="text-blue-600" />
                            </div>
                            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                                <span className="animate-pulse">Thinking…</span>
                            </div>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>

                {/* Quick prompts */}
                {messages.length <= 2 && (
                    <div className="px-4 pb-2">
                        <div className="text-xs font-medium text-slate-500 mb-1.5">Suggested questions</div>
                        <div className="flex flex-wrap gap-1.5">
                            {QUICK.map(q => (
                                <button key={q} type="button" onClick={() => setInput(q)}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:border-blue-300 transition-all">
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="border-t border-slate-200 p-3">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Ask a health question…"
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button onClick={sendMessage} disabled={!input.trim() || loading} size="sm" className="shrink-0">
                            <Send size={14} />
                        </Button>
                    </div>
                    <div className="mt-2 text-xs text-slate-400 text-center">Your health context is shared to personalize responses · Press Enter to send</div>
                </div>
            </Card>
        </div>
    );
}
