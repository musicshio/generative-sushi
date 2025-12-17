import {generateObject, generateText, tool as createTool} from 'ai';
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
            system: 'You are a sushi chef writing concise, mouthwatering menu blurbs.',
            prompt: `Topping: ${topping}\nBase: ${base}\nWrite a wikipedia article describing this sushi in Japanese.`,
        });

        return object;
    },
});

export const tools = {
    displayWeather: weatherTool,
    createSushi: sushiTool,
};