/**
 * Simple parser to extract raw text from WebVTT files
 */
export function parseVtt(vttContent: string): string {
  // Remove WEBVTT header
  let text = vttContent.replace(/^WEBVTT.*\n?/gm, '');
  
  // Remove timestamps
  text = text.replace(/\d{2}:\d{2}:\d{2}\.\d{3}\s-->\s\d{2}:\d{2}:\d{2}\.\d{3}.*\n/gm, '');
  
  // Remove formatting tags like <v Speaker Name>
  text = text.replace(/<[^>]+>/g, '');
  
  // Remove empty lines
  text = text.replace(/^\s*[\r\n]/gm, '');
  
  return text.trim();
}
