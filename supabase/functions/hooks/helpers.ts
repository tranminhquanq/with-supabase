export function cleanText(text: string) {
  return text
    .replace(/[\(\[\{<].*?[\)\]\}>]/g, "") // Remove words between brackets
    .replace(/[^a-zA-Z0-9À-ỹ\s]/g, "") // Remove special characters but keep Vietnamese characters
    .replace(/\b\S*[^a-zA-ZÀ-ỹ\s]+\S*\b/g, "") // Remove words with numbers or special characters
    .replace(/\s+/g, " ") // Remove extra spaces
    .trim().toLowerCase(); // Remove leading and trailing spaces
}

export function generatePrefixes(str: string, size = 8) {
  const prefixes = [];
  const maxLength = Math.min(size, str.length);
  for (let i = 2; i <= maxLength; i++) {
    prefixes.push(str.substring(0, i));
  }
  prefixes.push(str + "*"); // Add a wildcard to the end
  return prefixes;
}
