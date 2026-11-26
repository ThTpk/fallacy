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
  // like two-meanings, but the ambiguity is in how the words are arranged
  // rather than in any one word, so the whole sentence sits at the top
  z.object({
    type: z.literal('two-readings'),
    sentence: z.string(),
    reading_1: z.string(),
    reading_2: z.string(),
  }),
  // one wide set holding two separate groups: being inside the same circle
  // is not the same as being in the same place in it
  z.object({
    type: z.literal('two-subsets'),
    outer: z.string(),
    a: z.string(),
    b: z.string(),
    claim: z.string(),
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
  z.object({
    type: z.literal('chain'),
    steps: z.array(z.string()).min(3).max(5),
  }),
  // a run of readings over time, with the moment something was done to them
  z.object({
    type: z.literal('swing'),
    series: z.array(z.number()).min(5).max(14),
    mark_at: z.number().int().min(0),
    mark_label: z.string(),
    mean_label: z.string(),
    axis_label: z.string(),
  }),
  // many weak claims at once: the count is the move, so the count is drawn
  z.object({
    type: z.literal('flood'),
    claims: z.number().int().min(6).max(40),
    checked: z.number().int().min(0),
    claims_label: z.string(),
    checked_label: z.string(),
  }),
  // a demand that is met and then replaced by a further one
  z.object({
    type: z.literal('shifting-bar'),
    rounds: z.array(z.object({ asked: z.string(), delivered: z.string() })).min(2).max(4),
    never: z.string(),
  }),
  z.object({
    type: z.literal('analogy-map'),
    a: z.string(),
    b: z.string(),
    shared: z.array(z.string()).min(1).max(3),
    differs: z.string(),
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

    // 'plain' is the case in ordinary Thai for a reader who knows nothing
    // about the field the quote comes from: what happened, where the
    // reasoning broke, what to carry away. It carries no untranslated
    // abbreviation and no term of art without a gloss, because it is the
    // first thing on the page and the only thing many readers will read.
    // Kept short on purpose - past about 900 characters it stops being the
    // short version and becomes a second analysis.
    plain: z.string().min(120).max(900),

    // 'formal' is optional, and is the same error written in the notation of
    // logic, set theory or probability. It is for the reader who wants the
    // structure rather than the story, and it must stay a comparison: it may
    // not introduce a claim about the case that the analysis does not make.
    formal: z.string().max(1400).optional(),

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
      // 'guidance' covers what a regulator, professional body or institution
      // publishes to explain a practice or set expectations. It is not news,
      // not a press release, and not a fact-check, and two cases wanted it
      // before it existed.
      // 'ruling' is a decision on a specific complaint - a press council
      // adjudication, an ASA ruling, a regulator's order. 'legal_filing' is
      // what the parties submit; this is what the body decides.
      // 'study' is peer-reviewed research. Useful here mainly for the papers
      // that measure how often a reasoning error occurs, which is stronger
      // evidence of a pattern than any single instance of it.
      // 'report' is a dated measurement or research report an organisation
      // publishes under its own name without peer review - an index
      // provider's scorecard, an industry body's annual figures. It is not
      // 'study', which implies review, and not 'guidance', which tells the
      // reader what to do. It carries the organisation's own interest, so a
      // case using it should say whose numbers these are.
      // 'commentary' is a signed piece in which a named author explains or
      // argues in their own voice, published by an institution but not
      // reviewed by it - an academic's post on a university centre's blog,
      // an op-ed. Its weight comes from the author's standing on that
      // subject, not from the institution's finding, so a case using it must
      // name the author and say why this author in particular. The one it
      // was added for quotes the person who coined a term, writing to
      // correct how other people were using it: nobody else could.
      medium: z.enum(['news', 'ad', 'social', 'transcript', 'press_release',
                      'broadcast', 'factcheck', 'legal_filing', 'guidance',
                      'ruling', 'study', 'report', 'commentary']),
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

// A situation page groups entries by where you run into them rather than by
// what is broken in the argument. The taxonomy answers "what went wrong"; this
// answers "I am in a meeting, what should I expect". The same entry turns up in
// several situations, which is the point: the setting changes the disguise, not
// the error.
const situationItem = z
  .object({
    // Either an entry that exists in the collection, or a name the collection
    // has no entry for yet. The second case is kept deliberately: naming the
    // gap is more useful than pointing the reader at the nearest entry and
    // letting them think it is the same thing.
    slug: reference('fallacies').optional(),
    name_th: z.string().optional(),
    name_en: z.string().optional(),
    // how it actually sounds in that setting, in one line
    example: z.string(),
    note: z.string().optional(),
  })
  .refine((i) => Boolean(i.slug) !== Boolean(i.name_th), {
    message: 'an item carries either a slug from the collection or an unlisted name_th, never both',
    path: ['slug'],
  });

const situations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/situations' }),
  schema: z.object({
    title_th: z.string(),
    title_en: z.string().optional(),
    // reading order on the index page
    order: z.number().int(),
    one_liner: z.string(),
    // what makes this setting different from the others, not a summary of it
    lead: z.string(),
    groups: z
      .array(
        z.object({
          title_th: z.string(),
          // why these belong together here, which is the part a plain list omits
          why: z.string(),
          items: z.array(situationItem).min(1),
        }),
      )
      .min(2),
    // what to say instead of naming the fallacy out loud
    responses: z.array(z.object({ when: z.string(), say: z.string() })).min(1),
    note: z.string().optional(),
    updated: z.coerce.date(),
  }),
});

export const collections = { fallacies, cases, foundations, comparisons, situations };
