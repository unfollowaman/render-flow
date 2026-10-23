import { forwardRef, useImperativeHandle } from "react";
import { InputCard, ErrorCard, OutputCard } from "./";
import { useLatexToPngConversion } from "../hooks/useLatexToPngConversion";

const LatexConverter = forwardRef(function LatexConverter(
  { inputRef, outputRef, mode, setMode, onReset },
  ref
) {
  const {
    loading: latexLoading,
    result: latexResult,
    error: latexError,
    parseError: latexParseError,
    setError: setLatexError,
    handleConvert: handleLatexConvert,
    handleReset: handleLatexReset,
  } = useLatexToPngConversion({
    outputRef,
  });

  useImperativeHandle(ref, () => ({
    handleReset: handleLatexReset,
  }));

  return (
    <>
      <InputCard
        ref={inputRef}
        mode={mode}
        setMode={setMode}
        latexLoading={latexLoading}
        latexParseError={latexParseError}
        setLatexError={setLatexError}
        handleLatexConvert={handleLatexConvert}
      />
      {latexError && <ErrorCard error={latexError} />}
      {latexResult && (
        <OutputCard result={latexResult} ref={outputRef} onReset={onReset} mode={mode} />
      )}
    </>
  );
});

export default LatexConverter;
