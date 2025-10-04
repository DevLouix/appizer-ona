import { Box, Grid } from "@mui/material";
import type { FieldSchema } from "@/types/main";
import { FieldRenderer } from "./FieldRenderer";

interface SectionRendererProps {
  schema: FieldSchema[];
  data: any;
  path?: string[]; // path prefix for nested fields
  onChange: (newData: any) => void; // callback with partial data replacement at this level
}

export default function SectionRenderer({
  schema,
  data,
  path = [],
  onChange,
}: SectionRendererProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2}>
        {schema.map((field) => (
          <Grid key={field.key} size={12}>
            <FieldRenderer
              field={field}
              value={data?.[field.key]}
              path={[...path, field.key]}
              onChange={onChange}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
