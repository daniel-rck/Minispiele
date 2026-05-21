export interface ConnectionsGroup {
  words: readonly string[];
  label: string;
  /** Tailwind background utility, e.g. `bg-amber-500` */
  bg: string;
}

export interface ConnectionsPuzzle {
  groups: readonly ConnectionsGroup[];
}

export const CONNECTIONS_PUZZLES: readonly ConnectionsPuzzle[] = [
  {
    groups: [
      { words: ['APFEL', 'BIRNE', 'KIRSCHE', 'PFLAUME'], label: 'Obstsorten', bg: 'bg-amber-500' },
      { words: ['HAMMER', 'ZANGE', 'SÄGE', 'BOHRER'], label: 'Werkzeuge', bg: 'bg-emerald-500' },
      { words: ['MARS', 'VENUS', 'SATURN', 'JUPITER'], label: 'Planeten', bg: 'bg-sky-500' },
      { words: ['KÖNIG', 'DAME', 'TURM', 'LÄUFER'], label: 'Schachfiguren', bg: 'bg-violet-500' },
    ],
  },
  {
    groups: [
      { words: ['ROSE', 'TULPE', 'LILIE', 'NELKE'], label: 'Blumen', bg: 'bg-amber-500' },
      {
        words: ['BACH', 'MOZART', 'BEETHOVEN', 'HAYDN'],
        label: 'Komponisten',
        bg: 'bg-emerald-500',
      },
      { words: ['BERLIN', 'PARIS', 'ROM', 'LONDON'], label: 'Hauptstädte', bg: 'bg-sky-500' },
      { words: ['GOLD', 'SILBER', 'BRONZE', 'PLATIN'], label: 'Edelmetalle', bg: 'bg-violet-500' },
    ],
  },
  {
    groups: [
      { words: ['TIGER', 'LÖWE', 'PUMA', 'JAGUAR'], label: 'Großkatzen', bg: 'bg-amber-500' },
      { words: ['ELBE', 'RHEIN', 'DONAU', 'MOSEL'], label: 'Flüsse', bg: 'bg-emerald-500' },
      {
        words: ['PIZZA', 'PASTA', 'RISOTTO', 'LASAGNE'],
        label: 'Italienische Gerichte',
        bg: 'bg-sky-500',
      },
      { words: ['BASS', 'TENOR', 'ALT', 'SOPRAN'], label: 'Stimmlagen', bg: 'bg-violet-500' },
    ],
  },
  {
    groups: [
      {
        words: ['ADLER', 'FALKE', 'HABICHT', 'BUSSARD'],
        label: 'Greifvögel',
        bg: 'bg-amber-500',
      },
      { words: ['EICHE', 'BUCHE', 'BIRKE', 'LINDE'], label: 'Laubbäume', bg: 'bg-emerald-500' },
      { words: ['WALZER', 'TANGO', 'SALSA', 'POLKA'], label: 'Tänze', bg: 'bg-sky-500' },
      { words: ['HERZ', 'LUNGE', 'LEBER', 'NIERE'], label: 'Organe', bg: 'bg-violet-500' },
    ],
  },
  {
    groups: [
      { words: ['ERDE', 'WASSER', 'FEUER', 'LUFT'], label: 'Elemente', bg: 'bg-amber-500' },
      {
        words: ['FRÜHLING', 'SOMMER', 'HERBST', 'WINTER'],
        label: 'Jahreszeiten',
        bg: 'bg-emerald-500',
      },
      {
        words: ['NORDEN', 'SÜDEN', 'OSTEN', 'WESTEN'],
        label: 'Himmelsrichtungen',
        bg: 'bg-sky-500',
      },
      { words: ['FREUDE', 'TRAUER', 'ANGST', 'WUT'], label: 'Gefühle', bg: 'bg-violet-500' },
    ],
  },
];
