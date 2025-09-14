// Utility: safely get nested value by path
function getNested(obj: any, path: string[]) {
  return path.reduce(
    (acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined),
    obj
  );
}

// Utility: set nested value immutably
function setNested(obj: any, path: string[], value: any): any {
  if (path.length === 0) return value;
  const [first, ...rest] = path;
  return {
    ...obj,
    [first]: setNested(obj[first] ?? {}, rest, value),
  };
}
