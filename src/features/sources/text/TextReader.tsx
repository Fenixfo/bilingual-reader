import { useState } from "react";
import { TranslatableText } from "../../../components/reader/TranslatableText";
import { TextSourceInput } from "./TextSourceInput";

export function TextReader() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"input" | "reading">("input");

  if (mode === "input") {
    return (
      <TextSourceInput
        initialValue={text}
        onSubmit={(value) => {
          setText(value);
          setMode("reading");
        }}
      />
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setMode("input")}
        className="mb-3 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        ← Editar texto
      </button>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-lg text-neutral-800 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
        <TranslatableText text={text} />
      </div>
    </div>
  );
}
