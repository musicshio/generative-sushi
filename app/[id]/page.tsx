import Chat from "@/ui/chat";
import {loadChat} from "@/util/chat-store";
import { Sushi } from "@/components/sushi";

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    const messages = await loadChat(id);

    const sushiPart = messages
        .flatMap(m => m.parts)
        .find(
            (part) =>
                part.type === 'tool-createSushi' && part.state === 'output-available' && !!part.output,
        );

    if (sushiPart?.type === "tool-createSushi" && sushiPart?.output) {
        return (
            <div className="p-4">
                <Sushi {...sushiPart.output} />
            </div>
        );
    }

    return <Chat id={id} initialMessages={messages}/>;
}
