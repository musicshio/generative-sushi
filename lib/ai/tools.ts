import { experimental_generateImage as generateImage, generateObject, tool as createTool } from 'ai';
import { z } from 'zod';
import { sushiSchema } from "@/lib/schema/schema";
import {revalidatePath} from "next/cache";

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
            system: `You are a sushi chef writing concise, mouthwatering menu blurbs.
Some items may be conceptual and not real-world sushi.
Avoid expressions that could violate content or safety guidelines.
`,
            prompt: `Topping: ${topping}\nBase: ${base}\nWrite a wikipedia article describing this sushi in Japanese.`,
        });

        let image: string | undefined = undefined;
        try {
            const result = await generateImage({
                model: "google/imagen-4.0-fast-generate-001",
                prompt: `A beautifully lit studio photo of a sushi with topping "${topping}" on base "${base}", on a clean plate, minimal background, kawaii styling. Details: ${JSON.stringify(object, null, 2)}`,
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
            system: `You are a new-generation creative sushi classification assistant. Decide if topping/base can plausibly be sushi (including creative/fusion). Be flexible and imaginative; return true only when convinced by a reasonable role-mapping (not strict realism).`,
            prompt: `Topping: ${topping}\nBase: ${base}\nUser arguments: ${userArguments ?? '(none)'}\nIs this plausibly sushi? Answer briefly and logically in Japanese`,
        });

        return object;
    },
});

export const tools = {
    createSushi: createSushiTool,
    judgeIsSushi: judgeIsSushiTool,
};
