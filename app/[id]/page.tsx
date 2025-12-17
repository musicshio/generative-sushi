import Chat from "@/ui/chat";
import {loadChat} from "@/util/chat-store";

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    const messages = await loadChat(id);
    return <Chat id={id} initialMessages={messages} />;
}
