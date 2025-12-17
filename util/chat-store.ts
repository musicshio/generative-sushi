import { generateId, UIMessage } from 'ai';
import { existsSync, mkdirSync, statSync } from 'fs';
import { readdir, readFile, writeFile, unlink } from 'fs/promises';
import path from 'path';

export type ChatSummary = {
    id: string;
    preview?: string;
    topping?: string;
    base?: string;
    updatedAt: number;
};

export async function loadChat(id: string): Promise<UIMessage[]> {
    const file = getChatFile(id);
    if (!existsSync(file)) return [];
    return JSON.parse(await readFile(file, 'utf8'));
}

export async function createChat(): Promise<string> {
    const id = generateId(); // generate a unique chat ID
    await writeFile(getChatFile(id), '[]'); // create an empty chat file
    return id;
}

export async function saveChat({ chatId, messages }: { chatId: string; messages: UIMessage[] }) {
    await writeFile(getChatFile(chatId), JSON.stringify(messages, null, 2));
}

export async function deleteChat(id: string) {
    const file = getChatFile(id);
    if (existsSync(file)) {
        await unlink(file);
    }
}

export async function listChats(): Promise<ChatSummary[]> {
    const chatDir = ensureChatDir();
    const files = await readdir(chatDir);

    const chats = await Promise.all(
        files
            .filter(file => file.endsWith('.json'))
            .map(async file => {
                const id = file.replace(/\.json$/, '');
                const fullPath = path.join(chatDir, file);
                const stats = statSync(fullPath);
                const contents = await readFile(fullPath, 'utf8');
                let preview: string | undefined;

                try {
                    const messages: UIMessage[] = JSON.parse(contents);
                    const firstText = messages
                        .flatMap(m => m.parts)
                        .find(part => part.type === 'text');
                    if (firstText && 'text' in firstText) {
                        const text = firstText.text;
                        preview = text.slice(0, 60);
                        const toppingMatch = text.match(/Topping:\s*([^\n]+)/i);
                        const baseMatch = text.match(/Base:\s*([^\n]+)/i);
                        const topping = toppingMatch?.[1]?.trim();
                        const base = baseMatch?.[1]?.trim();
                        return {
                            id,
                            preview,
                            topping,
                            base,
                            updatedAt: stats.mtimeMs,
                        };
                    }
                } catch {
                    preview = undefined;
                }

                return {
                    id,
                    preview,
                    topping: undefined,
                    base: undefined,
                    updatedAt: stats.mtimeMs,
                };
            }),
    );

    return chats.sort((a, b) => b.updatedAt - a.updatedAt);
}

function getChatFile(id: string): string {
    const chatDir = ensureChatDir();
    return path.join(chatDir, `${id}.json`);
}

function ensureChatDir(): string {
    const chatDir = path.join(process.cwd(), '.chats');
    if (!existsSync(chatDir)) mkdirSync(chatDir, { recursive: true });
    return chatDir;
}
