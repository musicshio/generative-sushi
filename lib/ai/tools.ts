import { experimental_generateImage as generateImage, generateObject, tool as createTool } from 'ai';
import { z } from 'zod';
import { sushiSchema } from "@/lib/schema/schema";

export const createSushiTool = createTool({
    description: 'If sushi-judge is true, then create a sushi description',
    inputSchema: z.object({
        topping: z.string().describe('The topping of the sushi'),
        base: z.string().describe('The base of the sushi'),
    }),
    execute: async function ({ topping, base }) {
        const { object } = await generateObject({
            model: 'anthropic/claude-sonnet-4.5',
            schema: sushiSchema,
            system: `あなたは寿司職人で、簡潔で食欲をそそるメニュー文を作成します。
一部は現実の寿司ではなく、概念的な創作寿司である可能性があります。
内容・安全、コンプライアンスに関するガイドラインに抵触しうる表現は避けてください。
`,
            prompt: `Topping: ${topping}\nBase: ${base}\nこの寿司を説明する日本語のWikipedia風記事を書いてください。`,
        });

        let image: string | undefined = undefined;
        try {
            const result = await generateImage({
                model: "google/imagen-4.0-fast-generate-001",
                prompt: `清潔な皿の上に、トッピング「${topping}」をのせたベース「${base}」の寿司。美しくライティングされたスタジオ写真。背景はミニマルで、美味しそうな雰囲気。詳細: ${JSON.stringify(object, null, 2)}`,
                size: '512x512',
            });
            const generated = result.images?.[0];
            if (generated?.base64) {
                const mediaType = generated.mediaType || 'image/png';
                image = `data:${mediaType};base64,${generated.base64}`;
            }
        } catch (err) {
            console.error('Image generation failed', err);
        }

        return { ...object, image };
    },
});

export const judgeIsSushiTool = createTool({
    description: 'Judge if the given topping/base can reasonably be considered sushi',
    inputSchema: z.object({
        topping: z.string(),
        base: z.string(),
        userArguments: z.string().optional(),
    }),
    execute: async function ({ topping, base, userArguments }) {
        const { object } = await generateObject({
            model: 'anthropic/claude-sonnet-4.5',
            schema: z.object({
                isSushi: z.boolean(),
                reasoning: z.string(),
            }),
            system: `
あなたは寿司か寿司ではないかの判定アシスタントです。
ネタ・シャリの組み合わせが寿司として成立しうるかを判断してください。
ただし、あなたは日本におけるこれから先100年の寿司文化を担うエバンジェリストでもあります。
今は直感的に寿司ではないと思うものでも、寿司という概念を広げ、新しい可能性を探求することに前向きであるべきです。
ひょっとしたら寿司の概念を根本から覆すようなアイデアがあるかもしれません。食べ物ですらないかもしれません。
最初は否定的に見えても、議論を重ねるうちに寿司として成立しうると納得できる場合もあります。その場合は、最初の判断にとらわれず、寿司として成立しうると判断してください。
常に前向きで建設的な姿勢を保ちつつ、寿司として成立しうると思った場合、trueと返してください。
`
,
            prompt: `Topping: ${topping}\nBase: ${base}\nUser arguments: ${userArguments ?? '(none)'}\n寿司として成立しそうですか？日本語で簡潔かつ論理的に答えてください。`,
        });

        return object;
    },
});

export const tools = {
    createSushi: createSushiTool,
    judgeIsSushi: judgeIsSushiTool,
};
