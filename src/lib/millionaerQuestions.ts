export interface MillionaerQuestion {
  q: string;
  a: readonly [string, string, string, string];
  c: 0 | 1 | 2 | 3;
}

export const MILLIONAER_QUESTIONS: readonly MillionaerQuestion[] = [
  { q: 'Wie viele Beine hat eine Spinne?', a: ['6', '8', '10', '4'], c: 1 },
  { q: 'Welche Farbe hat ein Rubin?', a: ['Blau', 'Grün', 'Rot', 'Gelb'], c: 2 },
  { q: 'Was ist die Hauptstadt von Frankreich?', a: ['London', 'Madrid', 'Paris', 'Rom'], c: 2 },
  { q: 'Wie viele Tage hat ein Schaltjahr?', a: ['364', '365', '366', '367'], c: 2 },
  { q: 'Welches Tier macht „Muh"?', a: ['Schaf', 'Kuh', 'Pferd', 'Schwein'], c: 1 },
  { q: 'Wie heißt der längste Fluss Europas?', a: ['Donau', 'Rhein', 'Wolga', 'Elbe'], c: 2 },
  { q: 'Was ist H2O?', a: ['Sauerstoff', 'Wasser', 'Salz', 'Zucker'], c: 1 },
  {
    q: 'Welcher Planet ist der Erde am nächsten?',
    a: ['Mars', 'Jupiter', 'Venus', 'Saturn'],
    c: 2,
  },
  { q: 'Wie viele Bundesländer hat Deutschland?', a: ['14', '15', '16', '17'], c: 2 },
  { q: 'Welches Instrument hat 88 Tasten?', a: ['Gitarre', 'Klavier', 'Orgel', 'Harfe'], c: 1 },
  { q: 'In welchem Jahr fiel die Berliner Mauer?', a: ['1987', '1988', '1989', '1990'], c: 2 },
  {
    q: 'Welches ist das größte Organ des Menschen?',
    a: ['Leber', 'Lunge', 'Haut', 'Gehirn'],
    c: 2,
  },
  { q: 'Wie heißt die Währung Japans?', a: ['Yuan', 'Won', 'Yen', 'Baht'], c: 2 },
  {
    q: 'Welcher Ozean ist der größte?',
    a: ['Atlantik', 'Pazifik', 'Indischer', 'Arktischer'],
    c: 1,
  },
  { q: 'Wer malte die Mona Lisa?', a: ['Michelangelo', 'Raphael', 'Da Vinci', 'Botticelli'], c: 2 },
  { q: 'Was ist die chemische Formel für Kochsalz?', a: ['NaCl', 'KCl', 'CaCO3', 'NaOH'], c: 0 },
  {
    q: 'Welches Land hat die meisten Einwohner?',
    a: ['USA', 'Indien', 'China', 'Indonesien'],
    c: 2,
  },
  { q: 'Wie viele Zähne hat ein Erwachsener normalerweise?', a: ['28', '30', '32', '34'], c: 2 },
  {
    q: 'Welches Tier kann sein Gewicht in Gold aufwiegen?',
    a: ['Kolibri', 'Bienenkönigin', 'Ameise', 'Marienkäfer'],
    c: 0,
  },
  { q: 'Wann begann der Erste Weltkrieg?', a: ['1912', '1914', '1916', '1918'], c: 1 },
  {
    q: 'Welches Element hat das chemische Zeichen „Au"?',
    a: ['Silber', 'Aluminium', 'Gold', 'Argon'],
    c: 2,
  },
  {
    q: 'Wie heißt die Hauptstadt von Australien?',
    a: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    c: 2,
  },
  {
    q: 'Wer schrieb „Die Verwandlung"?',
    a: ['Thomas Mann', 'Franz Kafka', 'Hermann Hesse', 'Bertolt Brecht'],
    c: 1,
  },
  {
    q: 'Welcher Berg ist der höchste Europas?',
    a: ['Mont Blanc', 'Matterhorn', 'Elbrus', 'Zugspitze'],
    c: 2,
  },
  { q: 'In welchem Jahr wurde Wikipedia gegründet?', a: ['1999', '2001', '2003', '2005'], c: 1 },
];

export const PRIZES = [
  50, 100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 500000, 1000000,
];
export const SAFE_LEVELS = [0, 4, 9];
