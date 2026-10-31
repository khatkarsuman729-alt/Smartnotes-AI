export type Sec = [string, string | string[]];
export interface Question { q: string; o: string[]; a: number; e: string }
export interface Chapter { id: string; cls: string; sub: string; title: string; sec: Sec[]; quiz: Question[] }

export const GROUPS: Record<string, string[]> = {
  Science: ['Physics', 'Chemistry', 'Biology'],
  Mathematics: ['Mathematics'],
  Commerce: ['Accountancy', 'Business Studies', 'Economics'],
  Humanities: ['History', 'Geography', 'Political Science', 'Public Administration'],
  Languages: ['English', 'Hindi'],
};

export const SUBJECTS = Object.values(GROUPS).flat();

export const TYPES = [
  'Short notes', 'Detailed notes', 'Cornell notes', 'Revision notes',
  'Exam-oriented notes', 'Important questions', 'Formula sheet',
];

/* Sample content written as AI-generated study notes. Verify against NCERT before relying on it. */
export const CHAPTERS: Chapter[] = [
  {
    id: '10-chem-1',
    cls: '10',
    sub: 'Chemistry',
    title: 'Chemical Reactions and Equations',
    sec: [
      ['Definitions', 'A chemical equation shows reactants on the left and products on the right. A balanced equation has the same number of atoms of each element on both sides, as the law of conservation of mass requires.'],
      ['Types of reactions', [
        'Combination: 2Mg + O₂ → 2MgO',
        'Decomposition: on strong heating, 2FeSO₄ → Fe₂O₃ + SO₂ + SO₃',
        'Displacement: Fe + CuSO₄ → FeSO₄ + Cu',
        'Double displacement: BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl',
      ]],
      ['Energy changes', [
        'Exothermic reactions release heat, e.g. CaO + H₂O → Ca(OH)₂',
        'Endothermic reactions absorb heat, e.g. CaCO₃ → CaO + CO₂ on heating',
      ]],
      ['Corrosion and rancidity', [
        'Corrosion: slow damage to metals, such as rusting of iron. Prevent it by painting or galvanising.',
        'Rancidity: oxidation of fats and oils that changes their smell and taste. Prevent it by refrigeration, nitrogen flushing or antioxidants.',
      ]],
      ['Exam tips', [
        'Always balance the equation and write physical states (s, l, g, aq).',
        'Mention observations such as colour change, gas evolved, precipitate or temperature change.',
      ]],
    ],
    quiz: [
      { q: 'Which is a combination reaction?', o: ['CaCO₃ → CaO + CO₂', '2Mg + O₂ → 2MgO', 'Zn + CuSO₄ → ZnSO₄ + Cu', 'NaOH + HCl → NaCl + H₂O'], a: 1, e: 'Two substances combine to form a single product.' },
      { q: 'Rancidity of food is caused by:', o: ['Oxidation of fats and oils', 'Reduction of proteins', 'Neutralisation', 'Displacement'], a: 0, e: 'Air oxidises fats and oils, changing their smell and taste.' },
      { q: 'An exothermic reaction:', o: ['Absorbs heat', 'Releases heat', 'Involves no energy change', 'Always needs light'], a: 1, e: 'Heat is released to the surroundings, as in the slaking of lime.' },
    ],
  },
];

const KB: [string[], string][] = [
  [['balanc'], 'Compare the atoms of each element on both sides and change only the coefficients (numbers in front), never the subscripts. Example: Mg + O₂ → MgO becomes 2Mg + O₂ → 2MgO.'],
  [['combination'], 'A combination reaction joins two or more substances into one product, e.g. 2Mg + O₂ → 2MgO.'],
  [['decomposition'], 'A decomposition reaction breaks one compound into simpler substances, usually with heat, light or electricity.'],
  [['displacement'], 'In a displacement reaction a more reactive element takes the place of a less reactive one in a compound. Example: Fe + CuSO₄ → FeSO₄ + Cu.'],
  [['double', 'precipitate'], 'In a double displacement reaction two compounds exchange ions, often forming a precipitate. Example: BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl.'],
  [['exotherm', 'endotherm', 'heat'], 'Exothermic reactions release heat, e.g. CaO + H₂O → Ca(OH)₂. Endothermic reactions absorb heat, e.g. CaCO₃ → CaO + CO₂ on heating.'],
  [['rancid', 'fat'], 'Rancidity is the oxidation of fats and oils, which changes their smell and taste. Prevent it by refrigeration, nitrogen flushing or antioxidants.'],
  [['corros', 'rust'], 'Corrosion is the slow damage of metals, such as rusting of iron in moist air. Prevent it by painting, oiling or galvanising.'],
];

/* Offline tutor: answers only from the library notes above. */
export function answer(q: string): string {
  const s = q.toLowerCase();
  const hits = KB.filter(([keys]) => keys.some(k => s.includes(k))).map(([, text]) => text);
  return hits.length
    ? hits.join(' ')
    : 'I can answer from the notes in this app right now. Try asking about balancing equations, displacement, exothermic reactions, rancidity or corrosion. Open-ended answers and Hindi replies need a secure AI backend, which is not connected in this version.';
}
