export type MarkdownBlock =
  | {
      type: "heading";
      level: number;
      text: string;
    }
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "list";
      ordered: boolean;
      items: string[];
    }
  | {
      type: "rule";
    }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    }
  | {
      type: "callout";
      tone: "note" | "tip" | "warning";
      text: string;
    };

const headingPattern = /^(#{1,6})\s+(.*)$/;
const unorderedListItemPattern = /^[-*]\s+(.*)$/;
const orderedListItemPattern = /^\d+\.\s+(.*)$/;
const horizontalRulePattern = /^([-*_])\1{2,}$/;
const tableRowPattern = /^\|(.+)\|$/;
const tableDividerPattern = /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|$/;
const calloutPattern = /^(note|tip|warning):\s*(.*)$/i;
const markdownEscapePattern = /\\([\\`*_{}[\]()#+.!|>\-])/g;
const isTableLikeLine = (line: string) =>
  tableRowPattern.test(line.trim()) || tableDividerPattern.test(line.trim());

export const decodeMarkdownEscapes = (value: string) =>
  value.replace(markdownEscapePattern, "$1");

const normalizeMarkdownLine = (line: string) =>
  decodeMarkdownEscapes(line);

const splitTableRow = (line: string) =>
  line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

export const normalizeMarkdownSource = (markdown: string) =>
  markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => normalizeMarkdownLine(line).replace(/\s+$/g, ""))
    .reduce((normalizedLines: string[], line, index, sourceLines) => {
      const trimmedLine = line.trim();
      const previousNonEmptyLine = [...normalizedLines]
        .reverse()
        .find((candidate) => candidate.trim().length > 0);
      const nextNonEmptyLine = sourceLines
        .slice(index + 1)
        .find((candidate) => candidate.trim().length > 0);

      if (
        trimmedLine.length === 0 &&
        previousNonEmptyLine &&
        nextNonEmptyLine &&
        isTableLikeLine(previousNonEmptyLine) &&
        isTableLikeLine(nextNonEmptyLine)
      ) {
        return normalizedLines;
      }

      normalizedLines.push(line);
      return normalizedLines;
    }, [])
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const markdownToBlocks = (markdown: string): MarkdownBlock[] => {
  const lines = normalizeMarkdownSource(markdown).split("\n");
  const blocks: MarkdownBlock[] = [];
  const paragraphBuffer: string[] = [];
  let listBuffer:
    | {
        ordered: boolean;
        items: string[];
      }
    | null = null;

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) {
      return;
    }

    blocks.push({
      type: "paragraph",
      text: paragraphBuffer.join(" ").trim(),
    });
    paragraphBuffer.length = 0;
  };

  const flushList = () => {
    if (!listBuffer || listBuffer.items.length === 0) {
      return;
    }

    blocks.push({
      type: "list",
      ordered: listBuffer.ordered,
      items: [...listBuffer.items],
    });
    listBuffer = null;
  };

  const findNextNonEmptyLine = (currentIndex: number) => {
    for (let nextIndex = currentIndex + 1; nextIndex < lines.length; nextIndex += 1) {
      const nextLine = lines[nextIndex].trim();
      if (nextLine.length > 0) {
        return nextLine;
      }
    }

    return "";
  };

  for (let index = 0; index < lines.length; index += 1) {
    const trimmedLine = lines[index].trim();

    if (trimmedLine.length === 0) {
      flushParagraph();
      if (listBuffer) {
        const nextNonEmptyLine = findNextNonEmptyLine(index);
        const sameListContinues =
          (listBuffer.ordered && orderedListItemPattern.test(nextNonEmptyLine)) ||
          (!listBuffer.ordered && unorderedListItemPattern.test(nextNonEmptyLine));

        if (sameListContinues) {
          continue;
        }
      }

      flushList();
      continue;
    }

    const headingMatch = trimmedLine.match(headingPattern);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    if (horizontalRulePattern.test(trimmedLine)) {
      flushParagraph();
      flushList();
      blocks.push({ type: "rule" });
      continue;
    }

    const calloutMatch = trimmedLine.match(calloutPattern);
    if (calloutMatch) {
      flushParagraph();
      flushList();

      const tone = calloutMatch[1].toLowerCase() as "note" | "tip" | "warning";
      const calloutLines = [calloutMatch[2].trim()].filter(Boolean);

      while (index + 1 < lines.length) {
        const nextLine = lines[index + 1].trim();

        if (
          !nextLine ||
          headingPattern.test(nextLine) ||
          horizontalRulePattern.test(nextLine) ||
          orderedListItemPattern.test(nextLine) ||
          unorderedListItemPattern.test(nextLine) ||
          calloutPattern.test(nextLine) ||
          (tableRowPattern.test(nextLine) &&
            index + 2 < lines.length &&
            tableDividerPattern.test(lines[index + 2].trim()))
        ) {
          break;
        }

        calloutLines.push(nextLine);
        index += 1;
      }

      blocks.push({
        type: "callout",
        tone,
        text: calloutLines.join(" ").trim(),
      });
      continue;
    }

    if (
      tableRowPattern.test(trimmedLine) &&
      index + 1 < lines.length &&
      tableDividerPattern.test(lines[index + 1].trim())
    ) {
      flushParagraph();
      flushList();

      const headers = splitTableRow(trimmedLine);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length) {
        const rowLine = lines[index].trim();

        if (!rowLine) {
          index -= 1;
          break;
        }

        if (!tableRowPattern.test(rowLine) || tableDividerPattern.test(rowLine)) {
          index -= 1;
          break;
        }

        rows.push(splitTableRow(rowLine));
        index += 1;
      }

      blocks.push({
        type: "table",
        headers,
        rows,
      });
      continue;
    }

    const orderedListItemMatch = trimmedLine.match(orderedListItemPattern);
    const unorderedListItemMatch = trimmedLine.match(unorderedListItemPattern);
    const listItemMatch = orderedListItemMatch || unorderedListItemMatch;
    if (listItemMatch) {
      flushParagraph();

      const ordered = Boolean(orderedListItemMatch);
      if (!listBuffer || listBuffer.ordered !== ordered) {
        flushList();
        listBuffer = {
          ordered,
          items: [],
        };
      }

      listBuffer.items.push(listItemMatch[1].trim());
      continue;
    }

    flushList();
    paragraphBuffer.push(trimmedLine);
  }

  flushParagraph();
  flushList();

  return blocks;
};
