import { Component, type ErrorInfo, type ReactNode } from "react";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const tracer = trace.getTracer("template-frontend");
    tracer.startActiveSpan("react.error_boundary", (span) => {
      span.recordException(error);
      span.setAttribute("react.component_stack", info.componentStack || "");
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.end();
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50dvh",
            gap: 2,
            p: 4,
          }}
        >
          <Typography variant="h5">Something went wrong</Typography>
          <Typography color="text.secondary">{this.state.error?.message}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
