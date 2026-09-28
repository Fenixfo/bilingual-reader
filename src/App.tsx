import { TranslatableText } from "./components/reader/TranslatableText";

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. I like to read a good book by the light of a candle, and I try not to cry when the story ends.`;

function App() {
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Lector Inmersivo — PoC
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Hacé clic en cualquier palabra en inglés para ver su traducción.
        </p>

        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 text-lg text-neutral-800 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
          <TranslatableText text={SAMPLE_TEXT} />
        </div>
      </div>
    </div>
  );
}

export default App;
