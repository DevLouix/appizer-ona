import { FieldSchema } from "@/types/main";
import {
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  Paper,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SectionRenderer from "./SectionRenderer";
import FileUploadField from "./FileUploadField";

// Utility: set nested value immutably
function setNested(obj: any, path: string[], value: any): any {
  if (path.length === 0) return value;
  const [first, ...rest] = path;
  return {
    ...obj,
    [first]: setNested(obj[first] ?? {}, rest, value),
  };
}

interface FieldRendererProps {
  field: FieldSchema;
  value: any;
  path: string[];
  onChange: (newPartial: any) => void; // receives updated nested object at top-level for the whole form
}

export function FieldRenderer({
  field,
  value,
  path,
  onChange,
}: FieldRendererProps) {
  const id = path.join(".");
  const handlePrimitiveChange = (v: any) => {
    // We build an object that sets the nested path to v when merged by parent
    onChange(setNested({}, path, v));
  };

  if (field.type === "object") {
    return (
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          {<Typography>{field.label ?? field.key}</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <SectionRenderer
              schema={field.fields ?? []}
              data={value ?? {}}
              path={path}
              onChange={(partial) => onChange(partial)}
            />
          </Paper>
        </AccordionDetails>
      </Accordion>
    );
  }

  // Primitive fields
  switch (field.type) {
    case "string":
      return (
        <TextField
          fullWidth
          id={id}
          label={field.label ?? field.key}
          value={value ?? field.default ?? ""}
          helperText={field.hint}
          onChange={(e) => handlePrimitiveChange(e.target.value)}
        />
      );

    case "textarea":
      return (
        <TextField
          fullWidth
          multiline
          minRows={3}
          id={id}
          label={field.label ?? field.key}
          value={value ?? field.default ?? ""}
          helperText={field.hint}
          onChange={(e) => handlePrimitiveChange(e.target.value)}
        />
      );

    case "number":
      return (
        <TextField
          fullWidth
          type="number"
          id={id}
          label={field.label ?? field.key}
          value={value ?? field.default ?? 0}
          onChange={(e) => handlePrimitiveChange(Number(e.target.value))}
        />
      );

    case "boolean":
      return (
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(value ?? field.default ?? false)}
              onChange={(e) => handlePrimitiveChange(e.target.checked)}
            />
          }
          label={field.label ?? field.key}
        />
      );

    case "color":
      return (
        <Box>
          <Typography variant="body2" gutterBottom>
            {field.label ?? field.key}
          </Typography>
          <TextField
            fullWidth
            id={id}
            type="text"
            value={value ?? field.default ?? ""}
            onChange={(e) => handlePrimitiveChange(e.target.value)}
            placeholder="#RRGGBB"
          />
        </Box>
      );

    case "select":
      return (
        <FormControl fullWidth>
          <InputLabel id={`${id}-label`}>{field.label ?? field.key}</InputLabel>
          <Select
            labelId={`${id}-label`}
            label={field.label ?? field.key}
            value={
              value ?? field.default ?? (field.options ? field.options[0] : "")
            }
            onChange={(e) => handlePrimitiveChange(e.target.value)}
          >
            {(field.options ?? []).map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );

    case "file":
    case "files":
      return (
        <FileUploadField
          label={field.label ?? field.key}
          value={value}
          onChange={handlePrimitiveChange}
          accept={field.accept}
          multiple={field.type === "files" || field.multiple}
          hint={field.hint}
        />
      );

    default:
      return null;
  }
}
