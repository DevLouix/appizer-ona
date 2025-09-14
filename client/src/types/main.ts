// ---------- Types ----------
export type FieldType =
| "string"
| "number"
| "boolean"
| "color"
| "select"
| "object"
| "textarea";


export interface FieldSchema {
key: string;
label?: string;
type: FieldType;
default?: any;
hint?: string;
options?: string[]; // for select
fields?: FieldSchema[]; // when type === 'object'
}