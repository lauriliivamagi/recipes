import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useExampleMachine } from "@/hooks/useExampleMachine";

/**
 * Exemplar: root App component wired to an XState machine via hook.
 *
 * NOTE: This is a placeholder. When building real pages, add react-router-dom
 * and wire up routes here.
 */
export default function App() {
  const { state, load, reset } = useExampleMachine();

  return (
    <Container maxWidth="md" sx={{ mt: { xs: 2, sm: 4 } }} id="main-content">
      <Typography
        variant="h1"
        gutterBottom
        data-testid="app-heading"
        sx={{ textWrap: "balance" }}
      >
        Template App
      </Typography>
      <Typography variant="body1" gutterBottom>
        State:{" "}
        <span data-testid="app-state-display">
          {JSON.stringify(state.value)}
        </span>{" "}
        | Items:{" "}
        <span data-testid="app-items-count">
          {state.context.items.length}
        </span>
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button variant="contained" onClick={load} data-testid="app-load-button">
          Load
        </Button>
        <Button variant="outlined" onClick={reset} data-testid="app-reset-button">
          Reset
        </Button>
      </Stack>
    </Container>
  );
}
