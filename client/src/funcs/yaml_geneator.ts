import * as yaml from 'js-yaml';

// ---------- YAML generator using js-yaml ----------
export function generateYAML(obj: any): string {
  try {
    return yaml.dump(obj, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
  } catch (error) {
    console.error('Error generating YAML:', error);
    return '# Error generating YAML configuration';
  }
}

// Legacy function for backward compatibility
export function quoteIfString(x: any) {
  if (typeof x === "string") {
    return `"${x.replace(/"/g, '\\"')}"`;
  }
  if (typeof x === "boolean") return x ? "true" : "false";
  return x;
}