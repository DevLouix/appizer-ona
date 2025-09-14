// ---------- YAML-like generator ----------
export function quoteIfString(x: any) {
  if (typeof x === "string") {
    // Surround with double quotes and escape internal quotes
    return `"${x.replace(/"/g, '\\"')}"`;
  }
  if (typeof x === "boolean") return x ? "true" : "false";
  return x;
}

export function generateYAML(obj: any, indent = 0) {
  const pad = " ".repeat(indent);
  if (obj === null || obj === undefined) return "";
  if (Array.isArray(obj)) {
    return obj.map((it) => `${pad}- ${quoteIfString(it)}`).join("\n") + "\n";
  }
  if (typeof obj !== "object") {
    return `${pad}${quoteIfString(obj)}\n`;
  }

  let out = "";
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null || val === undefined) {
      out += `${pad}${key}: null\n`;
    } else if (typeof val === "object" && !Array.isArray(val)) {
      out += `${pad}${key}:\n`;
      out += generateYAML(val, indent + 1);
    } else if (Array.isArray(val)) {
      out += `${pad}${key}:\n`;
      out += generateYAML(val, indent + 1);
    } else {
      out += `${pad}${key}: ${quoteIfString(val)}\n`;
    }
  }
  return out;
}
