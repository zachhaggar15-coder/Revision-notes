import type { CourseModule } from "@/lib/types";

export function generateFallbackTextbook(course: CourseModule) {
  const combined = course.materials
    .map((material) => material.extractedText)
    .join("\n")
    .toLowerCase();
  const hasReplication = combined.includes("replication") || combined.includes("polymerase");
  const hasMismatch = combined.includes("mismatch") || combined.includes("mutation");
  const hasDnaRepair =
    combined.includes("repair") || combined.includes("brca") || combined.includes("nhej");
  const sourceList = course.materials
    .map((material) => `- ${material.fileName}: ${material.extractedText.slice(0, 180)}`)
    .join("\n");

  if (hasReplication && hasMismatch) {
    return `# ${course.name}

## Topic Overview

The current module memory focuses on DNA replication and how errors during replication can lead to mutation. The later mismatch repair notes extend the earlier replication material by showing how cells correct some copying mistakes after DNA polymerase has acted.

## Detailed Textbook Notes

### DNA replication
Definition: DNA replication is the process by which genetic information is copied before cell division.

DNA polymerase adds nucleotides to a growing DNA strand using an existing template strand. Your notes distinguish between leading and lagging strands, which means the course is not only concerned with the fact that DNA is copied, but also with the mechanism and directionality of synthesis.

### Mutation during replication
Replication is connected to mutation because copying errors can occur while DNA is being duplicated. The notes do not specify mutation types, so examples such as substitutions, insertions, or deletions should be checked against your lecture material before using them in an exam answer.

### Mismatch repair
Important: Mismatch repair should be revised as a quality-control process connected to replication, not as an isolated topic.

Mismatch repair corrects some mistakes that remain after DNA replication. Based on the current notes, it is safest to describe it as a post-replication correction mechanism and to avoid naming specific proteins unless they appear in your course materials.

## Key Terminology and Definitions

| Term | Definition | Why it matters |
| --- | --- | --- |
| DNA polymerase | Enzyme described in your notes as adding nucleotides during DNA replication. | Explains how new DNA strands are built. |
| Leading strand | A DNA strand copied continuously during replication. | Helps compare replication on the two template strands. |
| Lagging strand | A DNA strand copied discontinuously during replication. | Shows why replication is coordinated and more complex than a single linear process. |
| Mismatch repair | A repair process that corrects replication mistakes. | Connects replication to mutation prevention. |

## Connections to Previous Topics

| Earlier material | Later material | Supported connection |
| --- | --- | --- |
| DNA polymerase adds nucleotides | Mutations occur during replication | Copying DNA creates the opportunity for errors. |
| Leading and lagging strands | Mismatch repair | Complex replication needs quality-control mechanisms. |

The Week 3 mutation notes connect directly to Week 1 replication notes because mutation is presented as a possible consequence of replication errors.

## Potential Exam Questions

1. Explain how DNA replication can introduce mutations and how mismatch repair reduces this risk. A strong answer should connect polymerase activity, copying errors, and repair after replication.
2. Compare leading and lagging strand synthesis. A strong answer should explain how each strand is copied and why the distinction matters.
3. Discuss why DNA polymerase activity needs to be supported by repair mechanisms. A strong answer should avoid treating replication and repair as unrelated topics.

## Common Misconceptions

- Mismatch repair is not a replacement for accurate DNA replication; it is a follow-up correction mechanism.
- Mutation should not be treated as unrelated to replication when the course notes explicitly connect the two.
- The notes do not yet prove which mismatch repair proteins are required, so do not invent protein names without checking the lecture.

## Flashcards

| Question | Answer |
| --- | --- |
| What role does DNA polymerase play in replication? | It adds nucleotides to the growing DNA strand. |
| Why can replication be linked to mutation? | Copying errors can occur while DNA is being replicated. |
| What does mismatch repair do? | It corrects some mistakes that remain after DNA replication. |
| Why are leading and lagging strands important? | They show that the two DNA strands are synthesised using different patterns. |
`;
  }

  if (hasDnaRepair) {
    return `# ${course.name}

## Topic Overview

The current module memory focuses on DNA repair, especially repair-pathway differences and double-strand break signalling. BRCA-related notes should be connected cautiously to homologous recombination only when your course materials support that link.

## Detailed Textbook Notes

### DNA repair overview
Definition: DNA repair refers to cellular processes that detect and correct damage to DNA.

Your notes suggest that repair pathways differ in speed, accuracy, and whether they use a template to restore damaged DNA.

### Repair pathway comparison
Non-homologous end joining is described as fast but error prone. Homologous recombination is linked with the sister chromatid, suggesting a more template-guided mechanism.

### Damage signalling
Important: ATM should be treated as a signalling concept linked to double-strand break detection until your notes provide more detail.

ATM is noted as being activated by double-strand breaks. This connects DNA damage detection with downstream repair or response pathways, but the current notes do not specify all downstream steps.

## Key Terminology and Definitions

| Term | Definition | Why it matters |
| --- | --- | --- |
| NHEJ | Non-homologous end joining; described in your notes as fast but error prone. | Useful for comparing repair speed and accuracy. |
| Homologous recombination | A repair process associated with the sister chromatid in your notes. | Explains why template availability can affect repair accuracy. |
| ATM | A signalling protein noted as activated by double-strand breaks. | Links DNA damage detection to cellular response. |
| BRCA | Mentioned in connection with repair, but the exact role needs lecture confirmation. | Likely important for repair-pathway exam questions, but should not be over-specified from current notes alone. |

## Connections to Previous Topics

| Earlier material | Newer material | Supported connection |
| --- | --- | --- |
| DNA repair | BRCA mutations | BRCA material likely belongs with repair-pathway revision, but the exact relationship should be verified. |
| Homologous recombination | Sister chromatid | Template-guided repair helps explain why homologous recombination can be more accurate. |

## Potential Exam Questions

1. Compare NHEJ and homologous recombination as double-strand break repair pathways. A strong answer should address speed, accuracy, and template use.
2. Explain why template availability affects repair accuracy. A strong answer should connect homologous recombination with the sister chromatid.
3. Discuss the role of damage signalling in coordinating repair responses. A strong answer should mention ATM only to the depth supported by the notes.

## Common Misconceptions

- Fast repair is not necessarily accurate repair.
- BRCA should not be described in detail unless the lecture notes specify its exact role.
- ATM activation is a signalling event, not itself a complete repair pathway in the current notes.

## Flashcards

| Question | Answer |
| --- | --- |
| Which DNA repair pathway is fast but error prone? | Non-homologous end joining. |
| What template is associated with homologous recombination? | The sister chromatid. |
| What type of damage activates ATM in your notes? | Double-strand breaks. |
`;
  }

  return `# ${course.name}

## Topic Overview

CourseMind has created a first-pass course memory from the available learning materials. Add more lecture notes to help the textbook identify stronger topic relationships.

## Detailed Textbook Notes

### Current course memory
${sourceList || "- No extracted learning materials are available yet."}

The current notes are too limited for a fully connected textbook. CourseMind can preserve the available source material, but it should not invent missing lecture context.

## Key Terminology and Definitions

| Term | Definition | Why it matters |
| --- | --- | --- |
| Current source material | The learning material uploaded so far. | This is the evidence CourseMind can safely use. |
| Missing context | Information not yet present in the course memory. | It should be checked in lecture slides or seminar notes before revision. |

## Connections to Previous Topics

- Connections will become stronger once multiple lectures or weeks have been uploaded.
- CourseMind will look for repeated terminology, prerequisite ideas, and later concepts that depend on earlier material.

## Potential Exam Questions

1. Explain the key concept from the uploaded material and connect it to another lecture topic.
2. Identify one unclear area in the current notes and describe what evidence would clarify it.

## Common Misconceptions

- A short note fragment is not enough evidence for a complete exam answer.
- AI-generated links should be verified against lecture material when the source notes are sparse.

## Flashcards

| Question | Answer |
| --- | --- |
| What is the main theme of the current material? | Review the uploaded source snippets and add more detail. |
| What should be checked before revision? | Any unclear or incomplete extracted text. |
`;
}
