const port = process.env.API_PORT || "8888";

try {
  const response = await fetch(`http://localhost:${port}/health`);
  if (response.ok) {
    process.exit(0);
  } else {
    process.exit(1);
  }
} catch {
  process.exit(1);
}
