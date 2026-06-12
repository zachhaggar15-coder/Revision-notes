import type { CourseModule } from "@/lib/types";

export const DEMO_COURSE_ID = "demo-introduction-to-molecular-biology";

export const demoTextbook = `# Introduction to Molecular Biology

## Topic Overview

The module currently connects DNA replication with mutation and repair. Week 1 introduces polymerase activity and leading versus lagging strands. Week 3 extends that by explaining that mutations can occur during replication and that mismatch repair corrects mistakes.

## Detailed Textbook Notes

### DNA replication
Definition: DNA replication is the process by which a cell copies its DNA before cell division.

DNA replication is the process by which a cell copies its DNA before cell division. DNA polymerase adds nucleotides to a growing strand using the existing DNA strand as a template.

The two strands are copied differently:

- The leading strand is synthesised continuously.
- The lagging strand is synthesised discontinuously in short fragments that must later be joined.

### Mutation and repair
Mutations can arise during DNA replication when incorrect bases are incorporated. Mismatch repair is one quality-control pathway that recognises and corrects replication errors after DNA polymerase has passed.

Important: Mismatch repair connects directly to replication because it corrects some errors that remain after DNA copying.

## Key Terminology and Definitions

| Term | Definition | Why it matters |
| --- | --- | --- |
| DNA polymerase | Enzyme that adds nucleotides to a growing DNA strand. | It explains how replication physically builds new DNA. |
| Leading strand | Strand synthesised continuously during replication. | It helps compare how each template strand is copied. |
| Lagging strand | Strand synthesised discontinuously in fragments. | It shows why replication is coordinated and mechanistically complex. |
| Mismatch repair | Repair pathway that corrects some replication errors. | It connects DNA replication to mutation prevention. |

## Connections to Previous Topics

- DNA polymerase activity in Week 1 connects directly to Week 3 mutation content: replication creates the moment where copying errors can occur.
- Leading and lagging strand synthesis helps explain why replication is coordinated and why repair systems are essential for genome stability.
- Mismatch repair should be understood as a follow-up safeguard, not a replacement for accurate DNA polymerase function.

| Earlier concept | Later connection | Why it matters |
| --- | --- | --- |
| DNA polymerase | Replication errors | Copying DNA creates the possibility of mistakes. |
| Leading and lagging strands | Repair systems | Complex synthesis needs quality-control pathways. |

## Potential Exam Questions

1. Explain how DNA polymerase contributes to accurate DNA replication and why additional repair systems are still required. A strong answer should link polymerase activity to possible copying errors.
2. Compare leading and lagging strand synthesis, then discuss how replication errors may be corrected. A strong answer should connect strand synthesis with mismatch repair.
3. Evaluate the importance of mismatch repair for genome stability in dividing cells. A strong answer should avoid claiming details not present in the current notes.

## Common Misconceptions

- Mismatch repair is not separate from replication revision; it explains what happens when replication errors remain.
- The notes do not yet identify the enzymes that join lagging-strand fragments, so that detail should be checked before exams.
- The exact recognition mechanism for mismatch repair is not yet in the course memory.

## Flashcards

| Question | Answer |
| --- | --- |
| What does DNA polymerase do during replication? | It adds nucleotides to a growing DNA strand using a template strand. |
| How does the leading strand differ from the lagging strand? | The leading strand is synthesised continuously, while the lagging strand is made discontinuously. |
| Why is mismatch repair connected to DNA replication? | It corrects mistakes that can be introduced during DNA copying. |
`;

export function createDemoCourse(): CourseModule {
  const now = new Date().toISOString();

  return {
    id: DEMO_COURSE_ID,
    name: "Introduction to Molecular Biology",
    description:
      "A pre-built demonstration module showing how CourseMind links early replication notes with later mutation and repair content.",
    university: "Demo University",
    academicLevel: "Undergraduate",
    createdAt: now,
    updatedAt: now,
    textbookUpdatedAt: now,
    masterTextbook: demoTextbook,
    generationCount: 1,
    materials: [
      {
        id: "demo-week-1",
        fileName: "Week 1 replication notes.txt",
        materialType: "Text",
        uploadedAt: now,
        extractedText:
          "Week 1: DNA replication, polymerase adds nucleotides, leading and lagging strands.",
        extractionMethod: "Demo seed material",
        status: "ready",
      },
      {
        id: "demo-week-3",
        fileName: "Week 3 mutation notes.txt",
        materialType: "Text",
        uploadedAt: now,
        extractedText:
          "Week 3: DNA mutations can occur during replication. Mismatch repair corrects mistakes.",
        extractionMethod: "Demo seed material",
        status: "ready",
      },
    ],
  };
}
