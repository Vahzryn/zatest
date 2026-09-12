import * as Diff from 'diff';

export interface DiffCompareOptions {
  ignoreWhitespace?: boolean; // ignore spaces and tabs
  ignoreTrimWhitespace?: boolean; // trim leading/trailing spaces per line
  ignoreBlankLines?: boolean; // skip blank lines
  ignoreCase?: boolean; // case-insensitive
  diffViewMode?: 'side-by-side' | 'unified';
  contextLines?: number; // context lines for unified diff (default: 3)
  charDiffThreshold?: number; // max chars per line pair for char-level diff (default: 2000)
}

export interface DiffLineItem {
  type: 'unchanged' | 'added' | 'removed';
  leftLineNumber?: number;
  rightLineNumber?: number;
  leftContent?: string;
  rightContent?: string;
  leftTokens?: { text: string; isChanged?: boolean }[];
  rightTokens?: { text: string; isChanged?: boolean }[];
}

export interface UnifiedDiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'header';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
  tokens?: { text: string; isChanged?: boolean }[];
}

export interface TextStatistics {
  lines: number;
  nonEmptyLines: number;
  words: number;
  utf16CodeUnits: number;
  unicodeCodePoints: number;
  utf8Bytes: number;
}

export interface DiffSummaryStats {
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
  unchangedLines: number;
  totalLinesLeft: number;
  totalLinesRight: number;
  similarityPercentage: number;
  leftStats: TextStatistics;
  rightStats: TextStatistics;
}

export interface DiffResult {
  sideBySideLines: DiffLineItem[];
  unifiedLines: UnifiedDiffLine[];
  stats: DiffSummaryStats;
  unifiedPatchText: string;
  isFormattedJsonLeft?: boolean;
  isFormattedJsonRight?: boolean;
}

/**
 * Calculates accurate text statistics distinguishing UTF-16 code units,
 * Unicode code points (handling surrogate pairs / emojis), and UTF-8 byte payload.
 */
export function calculateTextStats(text: string): TextStatistics {
  if (!text) {
    return {
      lines: 0,
      nonEmptyLines: 0,
      words: 0,
      utf16CodeUnits: 0,
      unicodeCodePoints: 0,
      utf8Bytes: 0,
    };
  }

  const lines = text.split(/\r\n|\r|\n/);
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0).length;
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const utf16CodeUnits = text.length;

  // Unicode code points using Array.from to correctly parse astral symbols & emojis
  const unicodeCodePoints = Array.from(text).length;

  // UTF-8 byte calculation
  let utf8Bytes = 0;
  if (typeof TextEncoder !== 'undefined') {
    utf8Bytes = new TextEncoder().encode(text).length;
  } else {
    utf8Bytes = Buffer.byteLength(text, 'utf-8');
  }

  return {
    lines: lines.length,
    nonEmptyLines,
    words,
    utf16CodeUnits,
    unicodeCodePoints,
    utf8Bytes,
  };
}

/**
 * Strips UTF-8 BOM if present.
 */
export function stripUtf8Bom(text: string): string {
  if (text.startsWith('\uFEFF')) {
    return text.slice(1);
  }
  return text;
}

/**
 * Checks if raw binary file content is non-text (contains null bytes).
 */
export function isBinaryContent(text: string): boolean {
  // Inspect first 8000 characters for null byte
  const checkLength = Math.min(text.length, 8000);
  for (let i = 0; i < checkLength; i++) {
    if (text.charCodeAt(i) === 0) {
      return true;
    }
  }
  return false;
}

/**
 * Safely formats JSON if input string is valid JSON.
 */
export function tryFormatJson(input: string): { success: boolean; formatted: string } {
  const trimmed = input.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
    return { success: false, formatted: input };
  }
  try {
    const parsed = JSON.parse(input);
    return { success: true, formatted: JSON.stringify(parsed, null, 2) };
  } catch {
    return { success: false, formatted: input };
  }
}

/**
 * Preprocesses text based on diff options (normalizing newlines, trimming, case handling).
 */
function normalizeTextForCompare(text: string, options: DiffCompareOptions): string {
  let cleaned = stripUtf8Bom(text);
  // Normalize CRLF / CR to LF
  cleaned = cleaned.replace(/\r\n|\r/g, '\n');

  if (options.ignoreBlankLines) {
    cleaned = cleaned
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .join('\n');
  }

  if (options.ignoreTrimWhitespace) {
    cleaned = cleaned
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
  }

  return cleaned;
}

/**
 * Performs character-level tokenization for a line pair if under the threshold.
 */
function computeCharacterTokens(
  leftStr: string,
  rightStr: string,
  charDiffThreshold = 2000
): {
  leftTokens: { text: string; isChanged?: boolean }[];
  rightTokens: { text: string; isChanged?: boolean }[];
} {
  if (leftStr.length + rightStr.length > charDiffThreshold) {
    // Degrade gracefully for long lines
    return {
      leftTokens: [{ text: leftStr, isChanged: true }],
      rightTokens: [{ text: rightStr, isChanged: true }],
    };
  }

  const wordDiffs = Diff.diffWordsWithSpace(leftStr, rightStr);

  const leftTokens: { text: string; isChanged?: boolean }[] = [];
  const rightTokens: { text: string; isChanged?: boolean }[] = [];

  for (const chunk of wordDiffs) {
    if (chunk.added) {
      rightTokens.push({ text: chunk.value, isChanged: true });
    } else if (chunk.removed) {
      leftTokens.push({ text: chunk.value, isChanged: true });
    } else {
      leftTokens.push({ text: chunk.value, isChanged: false });
      rightTokens.push({ text: chunk.value, isChanged: false });
    }
  }

  return { leftTokens, rightTokens };
}

/**
 * Main Diff Comparison Engine function.
 */
export function computeTextDiff(
  leftInput: string,
  rightInput: string,
  options: DiffCompareOptions = {}
): DiffResult {
  const leftClean = normalizeTextForCompare(leftInput, options);
  const rightClean = normalizeTextForCompare(rightInput, options);

  const leftStats = calculateTextStats(leftInput);
  const rightStats = calculateTextStats(rightInput);

  // Line-by-line comparison using jsdiff
  const lineDiffOptions: { ignoreWhitespace?: boolean; ignoreCase?: boolean } = {};
  if (options.ignoreWhitespace) {
    lineDiffOptions.ignoreWhitespace = true;
  }
  if (options.ignoreCase) {
    lineDiffOptions.ignoreCase = true;
  }

  const diffs = Diff.diffLines(leftClean, rightClean, lineDiffOptions) || [];

  const sideBySideLines: DiffLineItem[] = [];
  const unifiedLines: UnifiedDiffLine[] = [];

  let leftLineNum = 1;
  let rightLineNum = 1;

  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let unchangedCount = 0;

  const charDiffThreshold = options.charDiffThreshold ?? 2000;

  // Process chunks into side-by-side & unified structures
  for (let i = 0; i < diffs.length; i++) {
    const change = diffs[i];
    // Split change value into lines, preserving empty lines
    const changeLines = change.value.split('\n');
    // Drop trailing empty line produced by trailing newline split
    if (changeLines.length > 1 && changeLines[changeLines.length - 1] === '') {
      changeLines.pop();
    }

    if (!change.added && !change.removed) {
      // Unchanged block
      for (const line of changeLines) {
        sideBySideLines.push({
          type: 'unchanged',
          leftLineNumber: leftLineNum,
          rightLineNumber: rightLineNum,
          leftContent: line,
          rightContent: line,
        });

        unifiedLines.push({
          type: 'unchanged',
          oldLineNumber: leftLineNum,
          newLineNumber: rightLineNum,
          content: line,
        });

        leftLineNum++;
        rightLineNum++;
        unchangedCount++;
      }
    } else if (change.removed && i + 1 < diffs.length && diffs[i + 1]?.added) {
      // Modified block: Pair removed lines with added lines
      const nextChange = diffs[i + 1]!;
      const removedBlockLines = changeLines;
      const addedBlockLines = nextChange.value.split('\n');
      if (addedBlockLines.length > 1 && addedBlockLines[addedBlockLines.length - 1] === '') {
        addedBlockLines.pop();
      }

      const maxPair = Math.max(removedBlockLines.length, addedBlockLines.length);

      for (let k = 0; k < maxPair; k++) {
        const hasLeft = k < removedBlockLines.length;
        const hasRight = k < addedBlockLines.length;

        const leftStr = hasLeft ? removedBlockLines[k] : undefined;
        const rightStr = hasRight ? addedBlockLines[k] : undefined;

        if (hasLeft && hasRight) {
          // Pair for character-level diff
          const { leftTokens, rightTokens } = computeCharacterTokens(
            leftStr!,
            rightStr!,
            charDiffThreshold
          );

          sideBySideLines.push({
            type: 'removed', // or modified
            leftLineNumber: leftLineNum,
            rightLineNumber: rightLineNum,
            leftContent: leftStr,
            rightContent: rightStr,
            leftTokens,
            rightTokens,
          });

          unifiedLines.push({
            type: 'removed',
            oldLineNumber: leftLineNum,
            content: leftStr!,
            tokens: leftTokens,
          });

          unifiedLines.push({
            type: 'added',
            newLineNumber: rightLineNum,
            content: rightStr!,
            tokens: rightTokens,
          });

          leftLineNum++;
          rightLineNum++;
          modifiedCount++;
        } else if (hasLeft) {
          sideBySideLines.push({
            type: 'removed',
            leftLineNumber: leftLineNum,
            leftContent: leftStr,
          });

          unifiedLines.push({
            type: 'removed',
            oldLineNumber: leftLineNum,
            content: leftStr!,
          });

          leftLineNum++;
          removedCount++;
        } else {
          sideBySideLines.push({
            type: 'added',
            rightLineNumber: rightLineNum,
            rightContent: rightStr,
          });

          unifiedLines.push({
            type: 'added',
            newLineNumber: rightLineNum,
            content: rightStr!,
          });

          rightLineNum++;
          addedCount++;
        }
      }

      // Skip next chunk since we processed it
      i++;
    } else if (change.removed) {
      // Pure deletion chunk
      for (const line of changeLines) {
        sideBySideLines.push({
          type: 'removed',
          leftLineNumber: leftLineNum,
          leftContent: line,
        });

        unifiedLines.push({
          type: 'removed',
          oldLineNumber: leftLineNum,
          content: line,
        });

        leftLineNum++;
        removedCount++;
      }
    } else if (change.added) {
      // Pure addition chunk
      for (const line of changeLines) {
        sideBySideLines.push({
          type: 'added',
          rightLineNumber: rightLineNum,
          rightContent: line,
        });

        unifiedLines.push({
          type: 'added',
          newLineNumber: rightLineNum,
          content: line,
        });

        rightLineNum++;
        addedCount++;
      }
    }
  }

  // Generate standard unified patch text
  const unifiedPatchText = Diff.createTwoFilesPatch(
    'Original',
    'Modified',
    leftClean,
    rightClean,
    '',
    '',
    { context: options.contextLines ?? 3 }
  );

  const totalLines = unchangedCount + removedCount + addedCount + modifiedCount;
  const similarityPercentage =
    totalLines > 0 ? Math.round((unchangedCount / totalLines) * 100) : 100;

  const stats: DiffSummaryStats = {
    addedLines: addedCount,
    removedLines: removedCount,
    modifiedLines: modifiedCount,
    unchangedLines: unchangedCount,
    totalLinesLeft: leftLineNum - 1,
    totalLinesRight: rightLineNum - 1,
    similarityPercentage,
    leftStats,
    rightStats,
  };

  return {
    sideBySideLines,
    unifiedLines,
    stats,
    unifiedPatchText,
  };
}
