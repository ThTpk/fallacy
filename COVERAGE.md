# Coverage against the Stanford Encyclopedia of Philosophy

Checked 23 November 2026 against
<https://plato.stanford.edu/entries/fallacies/> (Hans V. Hansen, first
published 2015, substantive revision 2024), read in full.

SEP is not a syllabus, and its purpose differs from ours: it surveys the
scholarly tradition, so it covers Aristotle's and Bentham's lists at length
and omits several fallacies that modern teaching materials treat as standard.
It is still the best single check on whether this site has holes.

## What SEP calls "the core fallacies"

Its section 1 is the closest thing to a canonical list. Of the 21 items named
there, this site currently has 9.

Updated 23 November 2026: the first tier below has since been written, so
9 of 21 has become 19 of 21; only amphiboly and undistributed middle remain. The table records the state at the time of the
check.

| SEP core fallacy | here | note |
|---|---|---|
| equivocation | yes | |
| begging the question | yes | |
| circular reasoning | yes | inside `begging-the-question` |
| post hoc | yes | |
| straw man | yes | |
| ad verecundiam (appeal to authority) | yes | |
| ad populum | yes | as `bandwagon` |
| ad hominem | yes | abusive / circumstantial / tu quoque in the body |
| denying the antecedent | yes | |
| **ignoratio elenchi** (irrelevant conclusion) | **no** | SEP treats straw man as a variation of this |
| **slippery slope** | **no** | |
| **faulty analogy** | **no** | |
| **ad misericordiam** (appeal to pity) | **no** | |
| **ad baculum** (appeal to force) | **no** | |
| **complex question** (loaded question) | **no** | |
| **composition** | **no** | |
| **division** | **no** | |
| **amphiboly** | **no** | |
| **undistributed middle** | **no** | |
| **confusing cause and effect** | **no** | reverse causation |
| common-cause error | partly | the mechanism is the diagram on `cum-hoc`, with no entry of its own |

## Named elsewhere in SEP, not here

From Aristotle's thirteen: accent, combination of words, division of words,
form of expression, accident, non-cause.
From Copi: fallacy of four terms, illicit major, converse accident
(which is our `hasty-generalization` under another name).
From the modern sections: two wrongs, argument from consequences, dubious
assumption, and the meta-argument fallacies bothsiderism and the free-speech
fallacy.

## Here, but not named anywhere in SEP

`false-dilemma`, `no-true-scotsman`, `appeal-to-celebrity`,
`survivorship-bias`, `fallacy-fallacy`.

This is not a defect on either side. SEP follows the scholarly literature;
these five come from teaching materials and from how arguments actually run
in advertising and online debate, which is what this site is for. They stay.

## Suggested order of work

**First — done, 23 November 2026.** All eight are written and live. Two
component changes were needed that this plan did not anticipate: the `sets`
renderer had a no-true-Scotsman caption hardcoded into it, and reverse
causation needed a new `arrow-direction` type because no existing type could
draw an arrow pointing the wrong way.

| entry | diagram type | why it matters here |
|---|---|---|
| ignoratio elenchi | `relevance-gap` | the parent of straw man; its absence leaves a gap in the taxonomy |
| ad misericordiam | `relevance-gap` | the standard move in charity and health-product advertising |
| loaded question | `argument-structure` with `hidden_premise` | the hidden-premise machinery is already built |
| composition | `sets` | |
| division | `sets` | |
| accident | `sets` | applying a general rule to a case it was never meant for |
| two wrongs | `relevance-gap` | very common in online argument |
| reverse causation | `alternative-paths` | sits beside post hoc and cum hoc |

**Next — done, 23 November 2026.** Both are written, with the two new diagram types they needed:

- slippery slope: needs a chain diagram, where each link is weaker than the last
- faulty analogy: needs a two-column mapping showing which features carry over and which do not

**After that** — complete the formal category, which currently has only two
entries: undistributed middle, illicit major, fallacy of four terms.

**Probably skip** — amphiboly, accent, form of expression, combination and
division of words. Real, but they turn on quirks of Greek and of written
English that do not transfer cleanly to Thai. Worth a paragraph inside
`equivocation` rather than entries of their own.

## What SEP confirms about choices already made here

- **Not every instance is an error.** SEP says the post-Lockean ad hominem
  and appeals to authority are "sometimes used fairly, and sometimes
  fallaciously", that ad baculum threats in labour disputes are "not normally
  considered fallacies", and that ad misericordiam arguments have "their
  natural home in practical reasoning". The `not_fallacy` field on every
  entry is the right shape.
- **Teaching this can backfire.** SEP reports the worry that fallacy
  instruction makes students "overly critical and lead them to see fallacies
  where there are not any". That is the case for keeping `fallacy-fallacy`
  prominent rather than filed at the end of a list.
- **No taxonomy is settled.** SEP declines to endorse one, says there is "no
  single conception of good argument" behind the core fallacies, and calls
  the textbook approach a "hodgepodge". Our seven categories are a teaching
  convenience, not a claim about the structure of the subject, and the site
  should not imply otherwise.
- **Begging the question is valid but useless.** SEP notes it is not invalid,
  so it "should be thought of as epistemic rather than logical". That is the
  point the `validity-vs-truth` foundation page already makes.
