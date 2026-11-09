function safeMessage(error) {
  const message = error && error.message ? error.message : String(error);
  return message.replace(/([a-z][a-z0-9+.-]*:\/\/)[^@\s/]+@/gi, '$1[redacted]@');
}

function logDependencyError(dependency, operation, error, details = {}) {
  console.error(JSON.stringify({
    level: 'error',
    dependency,
    operation,
    code: error && error.code ? error.code : undefined,
    errorName: error && error.name ? error.name : undefined,
    message: safeMessage(error),
    ...details,
  }));
}

module.exports = { logDependencyError };
