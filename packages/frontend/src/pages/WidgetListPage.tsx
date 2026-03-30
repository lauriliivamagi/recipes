import { useState, useEffect, useCallback } from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  type Widget,
  listWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
} from "@/services/widgetApi";

/**
 * Exemplar: list page with create/edit/delete dialogs.
 *
 * Pattern for CRUD pages (without XState — plain React state):
 * - useState for UI state (items, dialog open/close, form values)
 * - useEffect for initial data fetch
 * - useCallback for action handlers that refresh the list after mutation
 * - MUI Dialogs for create/edit forms, confirmation for delete
 *
 * For pages driven by XState machines, see the machine exemplar instead.
 *
 * NOTE: This page is not wired into App.tsx. It exists as a reference.
 * When building real pages, add routing (react-router-dom) and wire them up.
 *
 * Scaling guidance:
 * - For non-blocking mutations, wrap handlers with useTransition.
 * - When dialogs grow complex, extract into separate components with own state.
 * - For long lists, add CSS content-visibility: auto to skip off-screen rendering.
 */
export function WidgetListPage() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editWidget, setEditWidget] = useState<Widget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Widget | null>(null);
  const [name, setName] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await listWidgets();
      setWidgets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load widgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await createWidget({ name });
      setName("");
      setCreateOpen(false);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create widget",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editWidget) return;
    setSubmitting(true);
    try {
      await updateWidget(editWidget.id, { name });
      setName("");
      setEditWidget(null);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update widget",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await deleteWidget(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete widget",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={1}
      >
        <Typography variant="h2" sx={{ textWrap: "balance" }}>
          Widgets
        </Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          Create Widget
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : widgets.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No widgets yet. Create one to get started.
        </Typography>
      ) : (
        <List>
          {widgets.map((w) => (
            <ListItem
              key={w.id}
              secondaryAction={
                <>
                  <IconButton
                    aria-label={`Edit ${w.name}`}
                    onClick={() => {
                      setEditWidget(w);
                      setName(w.name);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label={`Delete ${w.name}`}
                    onClick={() => setDeleteTarget(w)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText primary={w.name} secondary={w.description} />
            </ListItem>
          ))}
        </List>
      )}

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullScreen={fullScreen}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <DialogTitle>Create Widget</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus={!fullScreen}
              label="Name"
              name="widget-name"
              autoComplete="off"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!name || submitting}
            >
              {submitting ? "Creating\u2026" : "Create Widget"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editWidget}
        onClose={() => setEditWidget(null)}
        fullScreen={fullScreen}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdate();
          }}
        >
          <DialogTitle>Edit Widget</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus={!fullScreen}
              label="Name"
              name="widget-name"
              autoComplete="off"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditWidget(null)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!name || submitting}
            >
              {submitting ? "Saving\u2026" : "Save Changes"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Widget</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={submitting}
          >
            {submitting ? "Deleting\u2026" : "Delete Widget"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
