import { z } from 'zod';

export const sushiSchema = z.object({
    topping: z.string().describe('The topping of the sushi'),
    base: z.string().describe('The base of the sushi'),
    title: z.string().describe('The title of the sushi'),
    description: z.string().describe('A short description of the sushi'),
    image: z.string().optional().describe('Data URL for a generated sushi image'),
    etymology: z.object({
        label: z.string(),
        description: z.string(),
    }).describe('The etymology of the sushi'),
    history: z.object({
        label: z.string(),
        events: z.array(z.object({
            date: z.string(),
            description: z.string(),
        })),
    }).describe('The history of the sushi'),
    recipe: z.object({
        label: z.string(),
        ingredients: z.object({
            label: z.string(),
            items: z.array(z.string()),
        }).describe('List of ingredients'),
        steps: z.object({
            label: z.string(),
            items: z.array(z.string()),
        }).describe('List of preparation steps'),
    }).describe('The recipe of the sushi'),
})
