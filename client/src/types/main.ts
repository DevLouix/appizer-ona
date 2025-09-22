// ---------- Types ----------
export type FieldType =
| "string"
| "number"
| "boolean"
| "color"
| "select"
| "object"
| "textarea"
| "file"
| "files";


export interface FieldSchema {
key: string;
label?: string;
type: FieldType;
default?: any;
hint?: string;
options?: string[]; // for select
fields?: FieldSchema[]; // when type === 'object'
accept?: string; // for file inputs (e.g., ".png,.jpg,.jpeg")
multiple?: boolean; // for file inputs
}