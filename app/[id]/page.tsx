import SushiDetail from "@/app/[id]/_components/sushi-detail";
import { loadChat } from "@/util/chat-store";

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    const messages = await loadChat(id);

    return <SushiDetail id={id} initialMessages={messages} />;
}
