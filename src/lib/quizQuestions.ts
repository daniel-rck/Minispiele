export interface QuizQuestion {
  cat: string;
  q: string;
  a: readonly [string, string, string, string];
  /** Index of correct answer in `a`. */
  c: 0 | 1 | 2 | 3;
}

export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  {
    cat: 'Geografie',
    q: 'Welches ist das größte Land der Welt?',
    a: ['Russland', 'China', 'Kanada', 'USA'],
    c: 0,
  },
  {
    cat: 'Geografie',
    q: 'Welcher Fluss ist der längste Europas?',
    a: ['Donau', 'Wolga', 'Rhein', 'Elbe'],
    c: 1,
  },
  {
    cat: 'Geografie',
    q: 'Wie heißt die Hauptstadt von Australien?',
    a: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    c: 2,
  },
  {
    cat: 'Geografie',
    q: 'In welchem Land liegt der Kilimandscharo?',
    a: ['Kenia', 'Tansania', 'Uganda', 'Äthiopien'],
    c: 1,
  },
  {
    cat: 'Geschichte',
    q: 'In welchem Jahr fiel die Berliner Mauer?',
    a: ['1987', '1988', '1989', '1990'],
    c: 2,
  },
  {
    cat: 'Geschichte',
    q: 'Wer erfand den Buchdruck?',
    a: ['Gutenberg', 'Luther', 'Dürer', 'Kopernikus'],
    c: 0,
  },
  {
    cat: 'Geschichte',
    q: 'Welches antike Weltwunder steht noch heute?',
    a: ['Koloss von Rhodos', 'Pyramiden von Gizeh', 'Leuchtturm von Alexandria', 'Hängende Gärten'],
    c: 1,
  },
  {
    cat: 'Geschichte',
    q: 'Wann begann der Erste Weltkrieg?',
    a: ['1912', '1914', '1916', '1918'],
    c: 1,
  },
  {
    cat: 'Wissenschaft',
    q: 'Welches chemische Element hat das Symbol "Fe"?',
    a: ['Fluor', 'Francium', 'Eisen', 'Fermium'],
    c: 2,
  },
  {
    cat: 'Wissenschaft',
    q: 'Wie viele Planeten hat unser Sonnensystem?',
    a: ['7', '8', '9', '10'],
    c: 1,
  },
  {
    cat: 'Wissenschaft',
    q: 'Was ist die härteste natürliche Substanz?',
    a: ['Gold', 'Stahl', 'Diamant', 'Titan'],
    c: 2,
  },
  {
    cat: 'Wissenschaft',
    q: 'Welches Gas macht den größten Teil der Atmosphäre aus?',
    a: ['Sauerstoff', 'Stickstoff', 'Kohlendioxid', 'Argon'],
    c: 1,
  },
  {
    cat: 'Kultur',
    q: 'Wer malte die Mona Lisa?',
    a: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Botticelli'],
    c: 2,
  },
  {
    cat: 'Kultur',
    q: 'Welche Sprache hat weltweit die meisten Muttersprachler?',
    a: ['Englisch', 'Spanisch', 'Mandarin', 'Hindi'],
    c: 2,
  },
  {
    cat: 'Kultur',
    q: 'In welcher Stadt steht die Freiheitsstatue?',
    a: ['Washington', 'New York', 'Boston', 'Philadelphia'],
    c: 1,
  },
  {
    cat: 'Natur',
    q: 'Welches Tier ist das schnellste an Land?',
    a: ['Löwe', 'Gepard', 'Antilope', 'Pferd'],
    c: 1,
  },
  { cat: 'Natur', q: 'Wie viele Beine hat eine Spinne?', a: ['6', '8', '10', '12'], c: 1 },
  {
    cat: 'Natur',
    q: 'Welcher Ozean ist der größte?',
    a: ['Atlantik', 'Indischer Ozean', 'Pazifik', 'Arktischer Ozean'],
    c: 2,
  },
  {
    cat: 'Sport',
    q: 'Wie lange dauert ein Fußballspiel regulär?',
    a: ['80 Min.', '90 Min.', '100 Min.', '120 Min.'],
    c: 1,
  },
  {
    cat: 'Sport',
    q: 'In welcher Sportart gibt es einen Korbleger?',
    a: ['Handball', 'Volleyball', 'Basketball', 'Tennis'],
    c: 2,
  },
  {
    cat: 'Technik',
    q: 'Wofür steht die Abkürzung HTML?',
    a: [
      'HyperText Markup Language',
      'High Tech Modern Language',
      'Home Tool Markup Language',
      'Hyper Transfer Meta Language',
    ],
    c: 0,
  },
  {
    cat: 'Technik',
    q: 'Wer gründete Apple?',
    a: ['Bill Gates', 'Steve Jobs', 'Mark Zuckerberg', 'Jeff Bezos'],
    c: 1,
  },
  {
    cat: 'Musik',
    q: 'Wie viele Tasten hat ein Standard-Klavier?',
    a: ['76', '85', '88', '92'],
    c: 2,
  },
  {
    cat: 'Musik',
    q: 'Aus welchem Land stammt Mozart?',
    a: ['Deutschland', 'Schweiz', 'Österreich', 'Italien'],
    c: 2,
  },
];
