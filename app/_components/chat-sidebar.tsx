import Link from 'next/link';
import { listChats } from '@/util/chat-store';
import { ChatDeleteButton } from './chat-delete-button';

export async function ChatSidebar() {
    const chats = await listChats();

    return (
        <ul className="menu bg-base-200 rounded-box w-full">
            <li className="menu-title">
                <span>作った寿司</span>
            </li>
            {chats.length === 0 && (
                <li className="text-base-content/70">
                    <span>まだチャットがありません</span>
                </li>
            )}
            {chats.map(chat => (
                <li key={chat.id}>
                    <div className="flex justify-between items-center gap-2 w-full">
                        <Link href={`/${chat.id}`} className="flex-1">
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                    {chat.topping ?? 'Topping ?'} × {chat.base ?? 'Base ?'}
                                </span>
                            </div>
                        </Link>
                        <div className="dropdown dropdown-end">
                            <button tabIndex={0} className="btn btn-ghost btn-xs" type="button">
                                <span className="text-lg leading-none">⋯</span>
                            </button>
                            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box shadow p-2 w-40 z-10">
                                <li>
                                    <ChatDeleteButton chatId={chat.id} />
                                </li>
                            </ul>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
