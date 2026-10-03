import { forwardRef, useImperativeHandle } from "react";
import { InputCard, ErrorCard, OutputCard } from "./";
import { useHtmlToPngConversion } from "../hooks/useHtmlToPngConversion";

const HtmlConverter = forwardRef(function HtmlConverter(
  { inputRef, outputRef, mode, setMode, onReset },
  ref
) {
  const {
    loading,
    result,
    error,
    failedResources,
    htmlWarning,
    setHtmlWarning,
    setError,
    handleConvert,
    handleReset,
  } = useHtmlToPngConversion({
    outputRef,
  });

  useImperativeHandle(ref, () => ({
    handleReset,
  }));

  return (
    <>
      <InputCard
        ref={inputRef}
        mode={mode}
        setMode={setMode}
        loading={loading}
        failedResources={failedResources}
        htmlWarning={htmlWarning}
        setHtmlWarning={setHtmlWarning}
        handleConvert={handleConvert}
        setError={setError}
      />
      {error && <ErrorCard error={error} />}
      {result && (
        <OutputCard result={result} ref={outputRef} onReset={onReset} mode={mode} />
      )}
    </>
  );
});

export default HtmlConverter;
