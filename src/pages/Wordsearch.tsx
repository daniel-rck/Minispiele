import WordsearchGame from '../components/WordsearchGame';

export default function Wordsearch() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Wortgitter</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Finde die versteckten deutschen Wörter im Buchstaben-Gitter. Markiere ein Wort, indem du vom
        ersten zum letzten Buchstaben wischst.
      </p>
      <WordsearchGame />
    </div>
  );
}
