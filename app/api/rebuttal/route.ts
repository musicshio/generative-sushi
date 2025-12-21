import { generateText, UIMessage } from 'ai';

type JudgePart = Extract<UIMessage['parts'][number], { type: 'tool-judgeIsSushi' }>;

export async function POST(request: Request) {
    const req = await request.json();
    const { messages } = req as { messages?: UIMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
        return new Response('Invalid messages', { status: 400 });
    }

    const judgeParts: JudgePart[] = messages
        .flatMap(m => m.parts)
        .filter(
            (part): part is JudgePart =>
                part.type === 'tool-judgeIsSushi' &&
                part.state === 'output-available' &&
                !!part.output,
        );
    const lastJudge = judgeParts.pop();
    if (!lastJudge?.output) {
        return new Response('No judge result', { status: 400 });
    }

    const topping = lastJudge.input?.topping ?? '';
    const base = lastJudge.input?.base ?? '';
    const reasoning = lastJudge.output?.reasoning ?? '';

    const prompt = `以下の判定に反論する文章を、日本語で短く書いてください。
前提: あなたは judgeIsSushi よりも高度な推論ができる批評AIとして、創作寿司として成立する可能性を論理的に示す。
論点: 役割対応（ネタ/シャリの機能の妥当性）を軸に、調理・提供の工夫や安全性/文化文脈のいずれかに触れる。
補足: 非食材の場合は「寿司概念の拡張」を補助的な論拠として用いてよいが、必須ではない。
形式: 3〜5文、断定しすぎず説得的に。

判定理由: ${reasoning}
Topping: ${topping}
Base: ${base}`;

    const result = await generateText({
        model: 'openai/gpt-5-mini',
        prompt,
    });

    return Response.json({ text: result.text });
}
