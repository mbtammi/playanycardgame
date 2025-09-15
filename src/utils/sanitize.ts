// Utility to sanitize user-provided free text game ideas before sending to AI
// Keeps wording but strips potentially unsafe / noisy content so AI prompt stays clean.

export interface SanitizationResult {
  sanitized: string;
  flags: {
    removedScripts: boolean;
    removedHtml: boolean;
    trimmed: boolean;
    excessiveLength: boolean;
    suspiciousTokens: string[];
  };
}

// Reasonable max length for a single prompt (can adjust later)
const MAX_CHARS = 2000;

// Suspicious token patterns (broad but safe). Not blocking; just flagged.
const suspiciousPatterns: RegExp[] = [
  /eval\s*\(/i,
  /<iframe/i,
  /javascript:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /document\./i,
  /window\./i,
  /fetch\s*\(/i,
  /import\s+[^\n]+from/i,
  /drop\s+table/i,
  /select\s+.+\s+from/i
];

export function sanitizeUserIdea(raw: string): SanitizationResult {
  let work = raw || '';
  const original = work;
  let removedScripts = false;
  let removedHtml = false;
  let trimmed = false;
  let excessiveLength = false;

  // Remove <script>...</script>
  const scriptRegex = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
  if (scriptRegex.test(work)) {
    removedScripts = true;
    work = work.replace(scriptRegex, ' ');
  }

  // Strip inline event handlers (onClick=, onload=, etc.)
  work = work.replace(/on[a-z]+\s*=\s*"[^"]*"/gi, '');
  work = work.replace(/on[a-z]+\s*=\s*'[^']*'/gi, '');
  work = work.replace(/on[a-z]+\s*=\s*[^\s>]+/gi, '');

  // Remove remaining HTML tags but keep content
  const tagRegex = /<[^>]+>/g;
  if (tagRegex.test(work)) {
    removedHtml = true;
    work = work.replace(tagRegex, ' ');
  }

  // Normalize whitespace & line endings
  work = work.replace(/\r\n?/g, '\n'); // Windows to Unix
  work = work.replace(/\t/g, ' ');
  work = work.replace(/ +/g, ' '); // collapse spaces
  work = work.replace(/\n{3,}/g, '\n\n'); // collapse large blank regions
  work = work.trim();
  if (work !== original.trim()) trimmed = true;

  // Enforce length cap
  if (work.length > MAX_CHARS) {
    work = work.slice(0, MAX_CHARS) + '\n... (truncated)';
    excessiveLength = true;
  }

  // Collect suspicious tokens
  const suspiciousTokens: string[] = [];
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(work)) {
      suspiciousTokens.push(pattern.source);
    }
  }

  return {
    sanitized: work,
    flags: { removedScripts, removedHtml, trimmed, excessiveLength, suspiciousTokens }
  };
}
