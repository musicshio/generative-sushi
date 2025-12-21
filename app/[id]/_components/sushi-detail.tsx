'use client';

import { useChat } from '@ai-sdk/react';
import {DefaultChatTransport, UIDataTypes} from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Sushi } from '@/components/sushi';
import ChatContent from '@/app/[id]/_components/chat-content';
import { getChatSummary, loadChat, saveChat } from '@/util/local-chat-store';
import { isDataUrl, isOpfsPath, readOpfsFile } from '@/util/opfs';
import type { InferUITools, UIMessage } from 'ai';
import type { tools } from '@/lib/ai/tools';

export type SushiDetailProps = {
    id: string;
}

export default function SushiDetail({
                                 id,
                             }: SushiDetailProps) {
    const [hydrated, setHydrated] = useState(false);
    const [activeTab, setActiveTab] = useState<'wiki' | 'chat'>('wiki');
    const [sharePending, setSharePending] = useState(false);
    const [shareError, setShareError] = useState<string | null>(null);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const shareModalRef = useRef<HTMLDialogElement | null>(null);
    const { messages, sendMessage, setMessages } = useChat({
        id,
        transport: new DefaultChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest({ messages, id }) {
                const last = messages[messages.length - 1];
                return { body: { messages, id, requestMetadata: last?.metadata } };
            },
        }),
    });

    useEffect(() => {
        const stored = loadChat(id);
        if (stored.length > 0) {
            setMessages(stored);
        }
        setHydrated(true);
    }, [id, setMessages]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = window.localStorage.getItem(`sushi:share:${id}`);
        if (stored) {
            setShareUrl(stored);
        }
    }, [id]);

    useEffect(() => {
        if (!shareUrl || typeof window === 'undefined') return;
        window.localStorage.setItem(`sushi:share:${id}`, shareUrl);
    }, [id, shareUrl]);

    useEffect(() => {
        if (!hydrated) return;
        if (messages.length === 0) return;
        const lastKey = `sushi:chat:lastCount:${id}`;
        const lastCount = Number(window.localStorage.getItem(lastKey) ?? '0');
        const hasSushiOutputInMessages = (targetMessages: UIMessage[]) =>
            targetMessages.some(m =>
                m.parts.some(
                    part =>
                        part.type === 'tool-createSushi' &&
                        part.state === 'output-available' &&
                        part.output,
                ),
            );
        if (messages.length > lastCount) {
            window.localStorage.setItem(lastKey, String(messages.length));
            void saveChat(id, messages);
            return;
        }
        if (!hasSushiOutputInMessages(messages)) return;
        const existing = loadChat(id);
        if (hasSushiOutputInMessages(existing)) return;
        const existingSummary = getChatSummary(id);
        void saveChat(id, messages, { updatedAt: existingSummary?.updatedAt });
    }, [hydrated, id, messages]);

    useEffect(() => {
        if (!hydrated) return;
        const pendingKey = `sushi:chat:pending:${id}`;
        const raw = window.sessionStorage.getItem(pendingKey);
        if (!raw) return;
        window.sessionStorage.removeItem(pendingKey);
        try {
            const pending = JSON.parse(raw) as { text: string; metadata?: { topping?: string; base?: string } };
            if (pending?.text) {
                sendMessage({ text: pending.text, metadata: pending.metadata });
            }
        } catch {
            return;
        }
    }, [hydrated, id, sendMessage]);

    type UITools = InferUITools<typeof tools>;
    type ChatMessage = UIMessage<unknown, UIDataTypes, UITools>;
    type JudgePart = Extract<ChatMessage['parts'][number], { type: 'tool-judgeIsSushi' }>;

    const judgeParts: JudgePart[] = useMemo(
        () =>
            (messages as ChatMessage[])
                .flatMap(m => m.parts)
                .filter(
                    (part): part is JudgePart =>
                        part.type === 'tool-judgeIsSushi',
                ),
        [messages],
    );

    const lastPositiveJudge = useMemo(
        () =>
            judgeParts
                .filter(part => part.state === 'output-available' && part.output && part.output.isSushi)
                .pop(),
        [judgeParts],
    );

    type CreateSushiPart = Extract<ChatMessage['parts'][number], { type: 'tool-createSushi' }>;
    const latestSushi = useMemo(
        () =>
            (messages as ChatMessage[])
                .flatMap(m => m.parts)
                .filter(
                    (part): part is CreateSushiPart =>
                        part.type === 'tool-createSushi' &&
                        part.state === 'output-available' &&
                        !!part.output,
                )
                .pop(),
        [messages],
    );

    const hasSushiOutput = useMemo(
        () =>
            (messages as ChatMessage[]).some(m =>
                m.parts.some(
                    part =>
                        part.type === 'tool-createSushi' &&
                        part.state === 'output-available' &&
                        part.output,
                ),
            ),
        [messages],
    );

    const showSplit = lastPositiveJudge?.output?.isSushi;

    const chatContent = (
        <ChatContent
            className="flex flex-col gap-4 min-h-0 h-full"
            id={id}
            messages={messages}
            hasSushiOutput={hasSushiOutput}
            sendMessage={sendMessage}
        />
    );

    if (!showSplit) {
        return <div className="flex flex-col lg:flex-row lg:gap-4 h-full max-h-full bg-base-200 p-4">
            <div className="order-2 lg:order-1 flex-none w-full h-full max-h-full border border-base-200 rounded-box lg:overflow-y-auto bg-base-100">
                {chatContent}
            </div>
        </div>
    }

    const openShareModal = () => {
        shareModalRef.current?.showModal();
        if (!shareUrl && latestSushi?.output && !sharePending) {
            void handleShare();
        }
    };

    const handleCopy = async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = async () => {
        if (!latestSushi?.output || sharePending) return;
        setSharePending(true);
        setShareError(null);

        try {
            const payload = structuredClone(latestSushi.output) as { image?: string | null };
            let imageFile: File | null = null;
            let imageUrl: string | null = null;

            if (payload.image && typeof payload.image === 'string') {
                if (isOpfsPath(payload.image)) {
                    const file = await readOpfsFile(payload.image);
                    if (file) imageFile = file;
                } else if (isDataUrl(payload.image)) {
                    const blob = await fetch(payload.image).then(res => res.blob());
                    const ext = blob.type.split('/')[1] || 'png';
                    imageFile = new File([blob], `sushi.${ext}`, {
                        type: blob.type || 'image/png',
                    });
                } else {
                    imageUrl = payload.image;
                }
            }

            const form = new FormData();
            form.set('data', JSON.stringify({ ...payload, image: imageUrl }));
            if (imageFile) {
                form.set('image', imageFile);
            }

            const res = await fetch('/api/share', { method: 'POST', body: form });
            if (!res.ok) {
                throw new Error('Failed to share');
            }
            const data = (await res.json()) as { id: string };
            setShareUrl(`${window.location.origin}/share/${data.id}`);
        } catch (err) {
            console.error(err);
            setShareError('公開に失敗しました。もう一度お試しください。');
        } finally {
            setSharePending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-base-200">
            <div className="lg:hidden h-full relative">
                <div className="tabs tabs-box sticky top-0 p-2 z-10">
                    <input type="radio" name="my_tabs_1" className="tab" aria-label="Wiki" defaultChecked onClick={() => setActiveTab('wiki')} />
                    <input type="radio" name="my_tabs_1" className="tab" aria-label="Chat" onClick={() => setActiveTab('chat')} />
                </div>
                <div className="flex-1 h-[calc(100%-56px)] p-2">
                    {activeTab === 'chat' ? (
                        <div className="h-full border border-base-200 rounded-box bg-base-100 overflow-y-auto">
                            {chatContent}
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto">
                            {latestSushi?.output ? (
                                <Sushi
                                    {...latestSushi.output}
                                    headerActions={(
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            onClick={openShareModal}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="w-4 h-4"
                                            >
                                                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                                                <path d="M12 3v12" />
                                                <path d="m8 7 4-4 4 4" />
                                            </svg>
                                            Share
                                        </button>
                                    )}
                                />
                            ) : (
                                <div className="card bg-base-100 shadow-md border border-base-200">
                                    <div className="card-body">
                                        <p className="text-sm text-base-content/70">寿司を握っています...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="hidden lg:flex lg:flex-row lg:gap-4 h-full max-h-full p-4">
                <div className="order-2 lg:order-1 flex-none w-full lg:w-96 h-full max-h-full border border-base-200 rounded-box lg:overflow-y-auto bg-base-100">
                    {chatContent}
                </div>
                <div className="order-1 lg:order-2 flex-1 min-h-0 overflow-y-auto">
                    {latestSushi?.output ? (
                        <Sushi
                            {...latestSushi.output}
                            headerActions={(
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={openShareModal}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-4 h-4"
                                    >
                                        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                                        <path d="M12 3v12" />
                                        <path d="m8 7 4-4 4 4" />
                                    </svg>
                                    Share
                                </button>
                            )}
                        />
                    ) : (
                        <div className="card bg-base-100 shadow-md border border-base-200">
                            <div className="card-body">
                                <p className="text-sm text-base-content/70">寿司を握っています...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <dialog ref={shareModalRef} className="modal">
                <div className="modal-box space-y-4">
                    <div className="text-lg font-semibold">公開設定</div>
                    {shareUrl ? (
                        <div className="space-y-3">
                            <div>
                                <a href={shareUrl} className="link break-all" target="_blank" rel="noreferrer">
                                    {shareUrl}
                                </a>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" className="btn btn-ghost" onClick={handleCopy}>
                                    コピー
                                </button>
                                <a
                                    href={shareUrl}
                                    className="btn"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    ページを開く
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-base-content/70">
                                {sharePending ? 'リンクを作成中...' : 'リンクを準備しています。'}
                            </p>
                            {sharePending && (
                                <div className="flex items-center gap-2">
                                    <span className="loading loading-spinner loading-sm" aria-hidden />
                                    <span className="text-sm text-base-content/60">生成中</span>
                                </div>
                            )}
                            {shareError && (
                                <div className="text-sm text-error">{shareError}</div>
                            )}
                        </div>
                    )}
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button type="submit">close</button>
                </form>
            </dialog>
        </div>
    );
}
