import { forwardRef, useImperativeHandle } from "react";
import { InputCard, ErrorCard, OutputCard } from "./";
import { useMermaidToPngConversion } from "../hooks/useMermaidToPngConversion";

const MermaidConverter = forwardRef(function MermaidConverter(
  { inputRef, outputRef, mode, setMode, onReset },
  ref
) {
  const {
    loading: mermaidLoading,
    result: mermaidResult,
    error: mermaidError,
    setError: setMermaidError,
    handleConvert: handleMermaidConvert,
    handleReset: handleMermaidReset,
  } = useMermaidToPngConversion({
    outputRef,
  });

  useImperativeHandle(ref, () => ({
    handleReset: handleMermaidReset,
  }));

  return (
    <>
      <InputCard
        ref={inputRef}
        mode={mode}
        setMode={setMode}
        mermaidLoading={mermaidLoading}
        setMermaidError={setMermaidError}
        handleMermaidConvert={handleMermaidConvert}
      />
      {mermaidError && <ErrorCard error={mermaidError} />}
      {mermaidResult && (
        <OutputCard result={mermaidResult} ref={outputRef} onReset={onReset} mode={mode} />
      )}
    </>
  );
});

export default MermaidConverter;
