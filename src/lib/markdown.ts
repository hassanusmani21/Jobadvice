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
    };

const headingPattern = /^(#{1,6})\s+(.*)$/;
const unorderedListItemPattern = /^[-*]\s+(.*)$/;
const orderedListItemPattern = /^\d+\.\s+(.*)$/;
const horizontalRulePattern = /^([-*_])\1{2,}$/;
const tableRowPattern = /^\|(.+)\|$/;
const tableDividerPattern = /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|$/;
const isTableLikeLine = (line: string) =>
  tableRowPattern.test(line.trim()) || tableDividerPattern.test(line.trim());

const normalizeMarkdownLine = (line: string) =>
  line
    .replace(/^\\(?=#{1,6}\s)/, "")
    .replace(/^\\(?=[-*]\s)/, "")
    .replace(/^\\(?=\d+\.\s)/, "")
    .replace(/^\\(?=\|)/, "")
    .replace(/^\\(?=(-{3,}|\*{3,}|_{3,}))/, "");

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

  for (let index = 0; index < lines.length; index += 1) {
    const trimmedLine = lines[index].trim();

    if (trimmedLine.length === 0) {
      flushParagraph();
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
