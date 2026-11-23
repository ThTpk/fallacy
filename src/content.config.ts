import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const CATEGORIES = [
  'formal', 'relevance', 'presumption',
  'ambiguity', 'causal', 'statistical', 'rhetorical',
] as const;

const diagram = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('alternative-paths'),
    effect: z.string(),
    claimed_cause: z.string(),
    other_causes: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal('one-way-arrow'),
    p: z.string(),
    q: z.string(),
  }),
  z.object({
    type: z.literal('substitution'),
    original: z.string(),
    distorted: z.string(),
  }),
  z.object({
    type: z.literal('spectrum'),
    pole_a: z.string(),
    pole_b: z.string(),
    hidden: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal('sample-vs-population'),
    population: z.string(),
    observed: z.string(),
    unobserved: z.string(),
  }),
  z.object({
    type: z.literal('circular'),
    nodes: z.array(z.string()).min(2),
  }),
  z.object({
    type: z.literal('relevance-gap'),
    premise: z.string(),
    conclusion: z.string(),
    gap_label: z.string(),
  }),
  z.object({
    type: z.literal('sets'),
    outer: z.string(),
    inner: z.string(),
    // only for the no-true-Scotsman shape, where the inner boundary is moved
    inner_note: z.string().optional(),
    claim: z.string(),
  }),
  z.object({
    type: z.literal('common-cause'),
    a: z.string(),
    b: z.string(),
    hidden_cause: z.string(),
  }),
  z.object({
    type: z.literal('two-meanings'),
    word: z.string(),
    meaning_1: z.string(),
    meaning_2: z.string(),
  }),
  // --- types used by the foundation pages: these explain a concept rather
  // --- than showing where a particular argument breaks
  z.object({
    type: z.literal('two-failure-points'),
    premise: z.string(),
    conclusion: z.string(),
    data_error: z.string(),
    reasoning_error: z.string(),
  }),
  z.object({
    type: z.literal('argument-structure'),
    premises: z.array(z.string()).min(1).max(3),
    conclusion: z.string(),
    hidden_premise: z.string().optional(),
  }),
  z.object({
    type: z.literal('matrix-2x2'),
    col_labels: z.tuple([z.string(), z.string()]),
    row_labels: z.tuple([z.string(), z.string()]),
    cells: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    highlight: z.number().int().min(0).max(3),
  }),
  z.object({
    type: z.literal('two-strengths'),
    a_from: z.string(),
    a_to: z.string(),
    a_label: z.string(),
    b_from: z.string(),
    b_to: z.string(),
    b_label: z.string(),
  }),
  z.object({
    type: z.literal('three-states'),
    states: z.tuple([z.string(), z.string(), z.string()]),
    highlight: z.number().int().min(0).max(2),
  }),
  z.object({
    type: z.literal('two-layers'),
    lower: z.string(),
    lower_note: z.string(),
    upper: z.string(),
    upper_note: z.string(),
  }),
  z.object({
    type: z.literal('arrow-direction'),
    a: z.string(),
    b: z.string(),
    claimed: z.string(),
    actual: z.string(),
  }),
]).and(z.object({ caption: z.string().optional() }));

const fallacies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/fallacies' }),
  schema: z.object({
    name_th: z.string(),
    name_en: z.string(),
    name_la: z.string().optional(),
    aliases: z.array(z.string()).default([]),
    category: z.enum(CATEGORIES),
    kind: z.enum(['fallacy', 'rhetorical_tactic', 'statistical_error']),
    difficulty: z.number().int().min(1).max(3),
    one_liner: z.string().max(120),
    form: z.string().optional(),
    why_wrong: z.string(),
    diagram: diagram.optional(),
    examples: z.array(z.object({
      level: z.enum(['clear', 'everyday', 'subtle']),
      text: z.string(),
      note: z.string().optional(),
    })).min(2),
    not_fallacy: z.array(z.object({
      text: z.string(),
      why_ok: z.string(),
    })).default([]),
    responses: z.array(z.string()).default([]),
    confused_with: z.array(reference('fallacies')).default([]),
    related: z.array(reference('fallacies')).default([]),
    sources: z.array(z.object({
      title: z.string(),
      author: z.string().optional(),
      url: z.string().url().optional(),
      locator: z.string().optional(),
    })).min(1),
    status: z.enum(['draft', 'review', 'published']),
    updated: z.coerce.date(),
  }),
});

const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: z.object({
    title_th: z.string(),
    case_kind: z.enum(['statement', 'pattern']),
    date_of_statement: z.coerce.date(),

    quote: z.string().max(400),
    quote_lang: z.enum(['th', 'en']).default('th'),
    quote_is_verbatim: z.literal(true),
    context: z.string(),
    speaker_role: z.string(),
    speaker_name: z.string().optional(),

    source: z.object({
      outlet: z.string(),
      headline: z.string(),
      author: z.string().optional(),
      url: z.string().url(),
      published: z.coerce.date(),
      accessed: z.coerce.date(),
      medium: z.enum(['news', 'ad', 'social', 'transcript',
                      'press_release', 'broadcast', 'factcheck', 'legal_filing']),
    }),
    corroboration: z.array(z.object({
      outlet: z.string(),
      url: z.string().url(),
    })).default([]),
    verification_notes: z.string().optional(),

    fallacies: z.array(z.object({
      slug: reference('fallacies'),
      analysis: z.string(),
      confidence: z.enum(['clear', 'arguable']),
    })).min(1),
    charitable_reading: z.string(),
    not_claiming: z.string(),

    domain: z.enum(['health', 'advertising', 'science', 'economy',
                    'politics', 'law', 'education', 'tech', 'other']),
    sensitivity: z.enum(['low', 'medium', 'high']),
    reviewed_by: z.array(z.string()).min(1),
    status: z.enum(['draft', 'review', 'published', 'retracted']),
    retraction_note: z.string().optional(),
    updated: z.coerce.date(),
  }).refine(
    (c) => c.sensitivity !== 'high' || c.reviewed_by.length >= 2,
    { message: 'high-sensitivity case needs at least 2 reviewers', path: ['reviewed_by'] },
  ),
});

const foundations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/foundations' }),
  schema: z.object({
    title_th: z.string(),
    title_en: z.string().optional(),
    // position in the reading path shown on the home page
    order: z.number().int().min(1),
    one_liner: z.string().max(160),
    // the two or three things a reader should leave with
    key_points: z.array(z.string()).min(2),
    diagram: diagram.optional(),
    see_also: z.array(reference('fallacies')).default([]),
    next: reference('foundations').optional(),
    sources: z.array(z.object({
      title: z.string(),
      author: z.string().optional(),
      url: z.string().url().optional(),
      locator: z.string().optional(),
    })).min(1),
    status: z.enum(['draft', 'review', 'published']),
    updated: z.coerce.date(),
  }),
});

const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/comparisons' }),
  schema: z.object({
    // the file name must be `<a>--<b>.md` with the two slugs in alphabetical
    // order; the compare route checks this and fails the build otherwise
    a: reference('fallacies'),
    b: reference('fallacies'),
    // the single question that tells the pair apart
    question: z.string().max(160),
    a_side: z.string(),
    b_side: z.string(),
    // why they get mixed up in the first place
    shared: z.string(),
    example_a: z.string(),
    example_b: z.string(),
    status: z.enum(['draft', 'review', 'published']),
    updated: z.coerce.date(),
  }),
});

export const collections = { fallacies, cases, foundations, comparisons };
