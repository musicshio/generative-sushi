import Link from 'next/link';
import { listChats } from '@/util/chat-store';

export async function ChatSidebar() {
    const chats = await listChats();

    return (
        <ul className="menu bg-base-200 rounded-box w-full">
            <li className="menu-title">
                <span>チャット一覧</span>
            </li>
            {chats.length === 0 && (
                <li className="text-base-content/70">
                    <span>まだチャットがありません</span>
                </li>
            )}
            {chats.map(chat => (
                <li key={chat.id}>
                    <Link href={`/${chat.id}`}>
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">{chat.id}</span>
                            {chat.preview && (
                                <span className="text-xs text-base-content/70 truncate">
                                    {chat.preview}
                                </span>
                            )}
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
