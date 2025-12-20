import { UIMessage, generateId } from 'ai';

export type ChatSummary = {
    id: string;
    preview?: string;
    topping?: string;
    base?: string;
    image?: string;
    updatedAt: number;
};

const CHAT_KEY_PREFIX = 'sushi:chat:';
const CHAT_LIST_KEY = 'sushi:chat:list';
const CHAT_EVENT = 'sushi-chat-storage';

type TextPart = Extract<UIMessage['parts'][number], { type: 'text'; text: string }>;
type CreateSushiPart = Extract<UIMessage['parts'][number], { type: 'tool-createSushi' }>;

function readChatList(): ChatSummary[] {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(CHAT_LIST_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed as ChatSummary[];
    } catch {
        return [];
    }
}

function writeChatList(list: ChatSummary[]) {
    window.localStorage.setItem(CHAT_LIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(CHAT_EVENT));
}

function getChatKey(id: string) {
    return `${CHAT_KEY_PREFIX}${id}`;
}

function extractSummary(messages: UIMessage[]): Omit<ChatSummary, 'id' | 'updatedAt'> {
    const firstMessage = messages[0];
    const firstText = messages
        .flatMap(m => m.parts)
        .find((part): part is TextPart => part.type === 'text');
    const imagePart = messages
        .flatMap(m => m.parts)
        .find(
            (part): part is CreateSushiPart =>
                part.type === 'tool-createSushi' &&
                part.state === 'output-available' &&
                !!part.output?.image,
        );

    const image = imagePart?.output?.image;
    const metaTopping = firstMessage?.metadata && (firstMessage.metadata as { topping?: string }).topping;
    const metaBase = firstMessage?.metadata && (firstMessage.metadata as { base?: string }).base;
    let preview: string | undefined;
    let topping: string | undefined;
    let base: string | undefined;

    if (firstText) {
        const text = firstText.text;
        preview = text.slice(0, 60);
        const toppingMatch = text.match(/Topping:\s*([^\n]+)/i);
        const baseMatch = text.match(/Base:\s*([^\n]+)/i);
        topping = metaTopping ?? toppingMatch?.[1]?.trim();
        base = metaBase ?? baseMatch?.[1]?.trim();
    } else {
        topping = metaTopping;
        base = metaBase;
    }

    return {
        preview,
        topping,
        base,
        image,
    };
}

export function generateChatId() {
    return generateId();
}

export function loadChat(id: string): UIMessage[] {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(getChatKey(id));
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
    } catch {
        return [];
    }
}

export function saveChat(id: string, messages: UIMessage[]) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(getChatKey(id), JSON.stringify(messages));
    const summary = extractSummary(messages);
    const updatedAt = Date.now();
    const list = readChatList();
    const next = [
        { id, updatedAt, ...summary },
        ...list.filter(chat => chat.id !== id),
    ];
    next.sort((a, b) => b.updatedAt - a.updatedAt);
    writeChatList(next);
}

export function deleteChat(id: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(getChatKey(id));
    const list = readChatList().filter(chat => chat.id !== id);
    writeChatList(list);
}

export function listChats(): ChatSummary[] {
    if (typeof window === 'undefined') return [];
    return readChatList().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function subscribeToChatChanges(handler: () => void) {
    if (typeof window === 'undefined') return () => {};
    const onStorage = (event: StorageEvent) => {
        if (event.key?.startsWith(CHAT_KEY_PREFIX) || event.key === CHAT_LIST_KEY) {
            handler();
        }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(CHAT_EVENT, handler);
    return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(CHAT_EVENT, handler);
    };
}
