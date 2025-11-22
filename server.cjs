// Small CommonJS bridge so Passenger (which uses require) can boot the ESM app.
(async () => {
  try {
    await import('./index.js');
  } catch (error) {
    console.error('Failed to start ESM server from server.cjs:', error);
    process.exit(1);
  }
})();
