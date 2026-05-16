import HangmanGame from '../components/HangmanGame';

export default function Hangman() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Galgenmännchen</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Errate das Wort Buchstabe für Buchstabe. Bei zehn Fehlversuchen ist der Galgen fertig.
      </p>
      <HangmanGame />
    </div>
  );
}
