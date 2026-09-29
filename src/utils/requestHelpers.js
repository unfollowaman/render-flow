/**
 * Executes a callback if the provided myRequestId matches the latest request ID stored in latestRequestIdRef.
 *
 * @param {number|string} myRequestId - The request ID for the current execution.
 * @param {React.MutableRefObject<number|string>|{ current: number|string }} latestRequestIdRef - Ref holding the latest request ID.
 * @param {Function} callback - Function to execute if the request is still active.
 * @returns {any} The return value of the callback if executed, otherwise undefined.
 */
export function runIfLatest(myRequestId, latestRequestIdRef, callback) {
  if (latestRequestIdRef && myRequestId === latestRequestIdRef.current) {
    return callback();
  }
}
