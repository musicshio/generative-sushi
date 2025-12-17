import { experimental_generateImage as generateImage, generateObject, generateText, tool as createTool} from 'ai';
import { z } from 'zod';
import {sushiSchema} from "@/lib/schema/schema";

export const weatherTool = createTool({
    description: 'Display the weather for a location',
    inputSchema: z.object({
        location: z.string().describe('The location to get the weather for'),
    }),
    execute: async function ({ location }) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { weather: 'Sunny', temperature: 75, location };
    },
});

export const sushiTool = createTool({
    description: 'Create a sushi description',
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
                prompt: `A beautifully lit studio photo of a sushi with topping "${topping}" on base "${base}", on a clean plate, minimal background, kawaii styling`,
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

export const tools = {
    displayWeather: weatherTool,
    createSushi: sushiTool,
};
