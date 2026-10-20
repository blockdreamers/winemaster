import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Entry ids are "<lang>/<slug>", e.g. "ko/01-what-is-wine".

const question = z.object({
  q: z.string(),
  choices: z.array(z.string()).min(2),
  answer: z.number().int().min(0),
  explain: z.string().optional(),
});

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/chapters' }),
  schema: z.object({
    title: z.string(),
    lead: z.string(),
    related: z.object({ regions: z.array(z.string()).default([]), grapes: z.array(z.string()).default([]) }).default({ regions: [], grapes: [] }),
    quiz: z.array(question).default([]),
  }),
});

const regions = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/regions' }),
  schema: z.object({
    name: z.string(),
    original: z.string(),
    country: z.string(),
    coords: z.tuple([z.number(), z.number()]),
    zoom: z.number().default(7),
    climate: z.enum(['maritime', 'continental', 'mediterranean', 'cool-continental']),
    grapes: z.array(z.string()).default([]),
    styles: z.array(z.string()).default([]),
    chapters: z.array(z.number()).default([]),
    summary: z.string(),
  }),
});

const grapes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/grapes' }),
  schema: z.object({
    name: z.string(),
    original: z.string(),
    color: z.enum(['red', 'white']),
    origin: z.string(),
    aliases: z.array(z.string()).default([]),
    profile: z.object({
      body: z.number().min(1).max(5),
      acidity: z.number().min(1).max(5),
      tannin: z.number().min(1).max(5),
      alcohol: z.number().min(1).max(5),
    }),
    aromas: z.array(z.string()).default([]),
    regions: z.array(z.string()).default([]),
    chapters: z.array(z.number()).default([]),
    summary: z.string(),
  }),
});

export const collections = { chapters, regions, grapes };
