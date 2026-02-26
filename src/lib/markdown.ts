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
      items: string[];
    };

const headingPattern = /^(#{1,6})\s+(.*)$/;
const listItemPattern = /^-\s+(.*)$/;

export const markdownToBlocks = (markdown: string): MarkdownBlock[] => {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  const paragraphBuffer: string[] = [];
  const listBuffer: string[] = [];

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
    if (listBuffer.length === 0) {
      return;
    }

    blocks.push({
      type: "list",
      items: [...listBuffer],
    });
    listBuffer.length = 0;
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

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

    const listItemMatch = trimmedLine.match(listItemPattern);
    if (listItemMatch) {
      flushParagraph();
      listBuffer.push(listItemMatch[1].trim());
      continue;
    }

    flushList();
    paragraphBuffer.push(trimmedLine);
  }

  flushParagraph();
  flushList();

  return blocks;
};
