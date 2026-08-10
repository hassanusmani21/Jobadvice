"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import ActionButton from "@/components/ActionButton";
import { siteName } from "@/lib/site";

type ResumeTemplateId = "classic" | "modern" | "focus" | "structured";
type ResumeBasics = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
};
type ResumeExperience = {
  id: string;
  role: string;
  company: string;
  location: string;
  duration: string;
  bullets: string;
};
type ResumeEducation = {
  id: string;
  degree: string;
  school: string;
  year: string;
  details: string;
};
type ResumeProject = {
  id: string;
  name: string;
  link: string;
  details: string;
};
type ResumeCertification = {
  id: string;
  name: string;
  issuer: string;
  year: string;
};
type ResumeOptionalSections = {
  experience: boolean;
  certifications: boolean;
  hobbies: boolean;
};
type SmartDraftTarget = "summary" | "skills" | "projects" | "experience";
type ResumeBuilderState = {
  templateId: ResumeTemplateId;
  basics: ResumeBasics;
  summary: string;
  skills: string;
  hobbies: string;
  optionalSections: ResumeOptionalSections;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  certifications: ResumeCertification[];
};

const storageKey = "jobadvice-resume-builder-v2";

const templateOptions: Array<{
  id: ResumeTemplateId;
  label: string;
  description: string;
  tag: string;
}> = [
  {
    id: "classic",
    label: "Classic ATS",
    description: "Single-column and safest for ATS parsing.",
    tag: "Most ATS-safe",
  },
  {
    id: "modern",
    label: "Modern Pro",
    description: "Sharper hierarchy with a cleaner premium feel.",
    tag: "Balanced",
  },
  {
    id: "focus",
    label: "Fresher Focus",
    description: "Puts skills and projects forward for early-career roles.",
    tag: "Projects-first",
  },
  {
    id: "structured",
    label: "Structured ATS",
    description: "A cleaner one-page layout inspired by classic recruiter resumes.",
    tag: "Reference style",
  },
];

const smartDraftTargetOptions: Array<{
  id: SmartDraftTarget;
  label: string;
  description: string;
}> = [
  {
    id: "summary",
    label: "Summary",
    description: "Make a short profile paragraph.",
  },
  {
    id: "skills",
    label: "Skills",
    description: "Extract tools and strengths.",
  },
  {
    id: "projects",
    label: "Project details",
    description: "Add bullets to the first project.",
  },
  {
    id: "experience",
    label: "Experience bullets",
    description: "Add bullets to the first experience.",
  },
];

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const createExperienceEntry = (id: string): ResumeExperience => ({
  id,
  role: "",
  company: "",
  location: "",
  duration: "",
  bullets: "",
});

const createEducationEntry = (id: string): ResumeEducation => ({
  id,
  degree: "",
  school: "",
  year: "",
  details: "",
});

const createProjectEntry = (id: string): ResumeProject => ({
  id,
  name: "",
  link: "",
  details: "",
});

const createCertificationEntry = (id: string): ResumeCertification => ({
  id,
  name: "",
  issuer: "",
  year: "",
});

const defaultResumeState: ResumeBuilderState = {
  templateId: "classic",
  basics: {
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    github: "",
    linkedin: "",
  },
  summary: "",
  skills: "",
  hobbies: "",
  optionalSections: {
    experience: true,
    certifications: true,
    hobbies: false,
  },
  experience: [createExperienceEntry("experience-1")],
  education: [createEducationEntry("education-1")],
  projects: [createProjectEntry("project-1")],
  certifications: [createCertificationEntry("certification-1")],
};

const starterResumeState: ResumeBuilderState = {
  templateId: "structured",
  basics: {
    fullName: "Hassan Usmani",
    headline: "Software Support Engineer | Frontend Developer",
    email: "hassan.usmani@example.com",
    phone: "+91 91234 56789",
    location: "Mumbai Maharashtra",
    website: "hassanusmani.example.dev",
    github: "github.com/hassanusmani",
    linkedin: "linkedin.com/in/hassan-usmani",
  },
  summary:
    "Support-focused technology professional with hands-on experience in troubleshooting, user support, frontend development, and practical web projects. Strong at resolving issues, documenting fixes, and building clean interfaces for real users.",
  skills:
    "Technical Support, Troubleshooting, Windows, Networking Basics, HTML, CSS, JavaScript, React, Next.js, Git, Customer Communication, Documentation, Problem Solving",
  hobbies: "Tech blogging, portfolio building, learning new tools",
  optionalSections: {
    experience: true,
    certifications: true,
    hobbies: true,
  },
  experience: [
    {
      id: "experience-1",
      role: "Software Support Engineer",
      company: "Example Tech Services",
      location: "Mumbai",
      duration: "Jan 2025 - Present",
      bullets:
        "Resolved user-reported software and access issues through clear troubleshooting steps.\nDocumented recurring fixes to reduce repeat support requests and improve team handover.\nCoordinated with development teams to report bugs with screenshots, logs, and reproduction steps.",
    },
  ],
  education: [
    {
      id: "education-1",
      degree: "Bachelor's Degree in Computer Applications",
      school: "Example University",
      year: "2021 - 2024",
      details: "Relevant coursework: Web Development, Computer Networks, Database Management",
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "Support Ticket Dashboard",
      link: "github.com/hassanusmani/support-ticket-dashboard",
      details:
        "Created a responsive dashboard to track tickets, priorities, status updates, and support notes using React and reusable UI components.",
    },
    {
      id: "project-2",
      name: "Personal Portfolio Website",
      link: "hassanusmani.example.dev",
      details:
        "Built a portfolio website with project sections, contact links, responsive layouts, and clean resume-style presentation.",
    },
  ],
  certifications: [
    {
      id: "certification-1",
      name: "Frontend Development Certification",
      issuer: "Example Learning Platform",
      year: "2025",
    },
  ],
};

const splitMultilineText = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const splitSkills = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const stripBulletPrefix = (value: string) =>
  value.replace(/^\s*(?:[-*•]|\d+[\).])\s*/, "").trim();

const sentenceCase = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  return `${trimmedValue.charAt(0).toUpperCase()}${trimmedValue.slice(1)}`;
};

const titleCaseName = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");

const normalizeBullet = (value: string) => {
  const cleanedValue = sentenceCase(stripBulletPrefix(value).replace(/\s+/g, " "));

  if (!cleanedValue) {
    return "";
  }

  return cleanedValue.replace(/[.;,\s]+$/, "");
};

const uniqueItems = (items: string[]) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.toLowerCase();

    if (!item || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const normalizeWebsiteHref = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (/^(?:https?:|mailto:|tel:)/i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue.replace(/^\/+/, "")}`;
};

const normalizePhoneHref = (value: string) => {
  const phoneValue = value.replace(/[^\d+]/g, "");

  return phoneValue.length >= 7 ? `tel:${phoneValue}` : "";
};

const createContactHref = (key: keyof ResumeBasics, value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (key === "email") {
    return `mailto:${trimmedValue}`;
  }

  if (key === "phone") {
    return normalizePhoneHref(trimmedValue);
  }

  if (key === "location") {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmedValue)}`;
  }

  if (key === "website" || key === "github" || key === "linkedin") {
    return normalizeWebsiteHref(trimmedValue);
  }

  return "";
};

const createContactLabel = (key: keyof ResumeBasics, value: string) => {
  if (key === "linkedin") {
    return "LinkedIn";
  }

  if (key === "github") {
    return "GitHub";
  }

  if (key === "website") {
    return "Portfolio";
  }

  return value.trim();
};

const resumeBulletStartWords = [
  "Achieved",
  "Administered",
  "Automated",
  "Built",
  "Collaborated",
  "Configured",
  "Configuration",
  "Created",
  "Creating",
  "Deployed",
  "Designed",
  "Developed",
  "Handled",
  "Implemented",
  "Improved",
  "Installed",
  "Installation",
  "Led",
  "Maintained",
  "Managed",
  "Monitored",
  "Optimized",
  "Permission",
  "Provided",
  "Provide",
  "Resolved",
  "Tested",
  "Troubleshot",
  "User Administration",
  "Worked",
];

const cleanResumeBullet = (value: string) =>
  normalizeBullet(value)
    .replace(/\s+([,.:;])/g, "$1")
    .replace(/\s*&\s*/g, " and ")
    .replace(/\s{2,}/g, " ")
    .replace(/\bEquipment's\b/gi, "equipment")
    .replace(/\bCurrent\s+(?=(?:Creating|Configuration|Provide|Provided|Managed|Built|Developed)\b)/g, "")
    .trim();

const splitIntoBulletCandidates = (value: string) => {
  const actionBoundaryPattern = new RegExp(
    `\\s+(?=(?:${resumeBulletStartWords
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})\\b)`,
    "g",
  );
  const boundaryMarkedText = value
    .replace(/\r/g, "\n")
    .replace(/[•●▪◦‣]/g, "\n")
    .replace(/\s+(?:[-–—])\s+(?=[A-Z])/g, "\n")
    .replace(/(?:^|\n)\s*(?:[-*]|\d+[\).])\s+/g, "\n")
    .replace(/\s*;\s+/g, "\n")
    .replace(/\s+(?=\d+[\).]\s+[A-Z])/g, "\n")
    .replace(/,\s+(?=(?:built|created|developed|managed|improved|worked|used|learned|led|designed|implemented|collaborated|handled|made|configured|provided|resolved|installed)\b)/gi, "\n");

  return boundaryMarkedText
    .split(/\n|(?<=[.!?])\s+/)
    .flatMap((part) => part.split(actionBoundaryPattern))
    .map(cleanResumeBullet)
    .filter((item) => item.length > 0);
};

const mergeSmallBulletFragments = (items: string[]) => {
  const mergedItems: string[] = [];

  items.forEach((item) => {
    const previousItem = mergedItems[mergedItems.length - 1];
    const shouldMergeWithPrevious =
      previousItem &&
      item.length < 28 &&
      !resumeBulletStartWords.some((word) => item.toLowerCase().startsWith(word.toLowerCase()));

    if (shouldMergeWithPrevious) {
      mergedItems[mergedItems.length - 1] = `${previousItem}; ${item}`;
      return;
    }

    mergedItems.push(item);
  });

  return mergedItems;
};

const paragraphToBullets = (value: string, limit = 5) => {
  const candidateItems = mergeSmallBulletFragments(splitIntoBulletCandidates(value));

  if (candidateItems.length > 1) {
    return uniqueItems(candidateItems).slice(0, limit).join("\n");
  }

  const normalizedValue = value.replace(/\s+/g, " ").trim();
  const sentenceParts = normalizedValue
    .split(/(?<=[.!?])\s+|(?:\s+-\s+)|(?:\s+;\s+)/)
    .map(cleanResumeBullet)
    .filter((item) => item.length > 0);

  if (sentenceParts.length > 1) {
    return uniqueItems(sentenceParts).slice(0, limit).join("\n");
  }

  const commaParts = normalizedValue
    .split(/\s*,\s*(?=\b(?:built|created|developed|managed|improved|worked|used|learned|led|designed|implemented|collaborated|handled|made)\b)/i)
    .map(cleanResumeBullet)
    .filter((item) => item.length > 0);

  return uniqueItems(commaParts.length > 1 ? commaParts : candidateItems).slice(0, limit).join("\n");
};

const splitDraftStatements = (value: string) =>
  uniqueItems(splitIntoBulletCandidates(value));

const knownSkillTerms = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "Python",
  "Java",
  "C++",
  "C",
  "SQL",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "HTML",
  "CSS",
  "Tailwind",
  "Git",
  "GitHub",
  "Docker",
  "AWS",
  "Azure",
  "REST API",
  "Machine Learning",
  "Data Analysis",
  "Excel",
  "Power BI",
  "Communication",
  "Problem Solving",
  "Leadership",
  "Teamwork",
];

const extractFirstMatch = (value: string, pattern: RegExp) => value.match(pattern)?.[1]?.trim() ?? "";

const extractLabelValue = (lines: string[], labels: string[]) => {
  const labelPattern = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const pattern = new RegExp(`^(?:${labelPattern})\\s*[:\\-]\\s*(.+)$`, "i");

  return lines.find((line) => pattern.test(line))?.match(pattern)?.[1]?.trim() ?? "";
};

const inferName = (text: string, lines: string[]) => {
  const fromLabel = extractLabelValue(lines, ["name", "full name"]);
  const fromIntro = extractFirstMatch(
    text,
    /\b(?:my name is|myself|this is|i am|i'm)\s+([a-z][a-z.'-]*(?:\s+[a-z][a-z.'-]*){0,3})(?:[.,]|\s+\b(?:and|from|with|a|an|the|student|developer|engineer|designer|analyst|intern|fresher)\b|$)/i,
  );
  const possibleName = fromLabel || fromIntro;

  if (possibleName && !/\b(?:student|developer|engineer|designer|analyst|intern)\b/i.test(possibleName)) {
    return titleCaseName(possibleName);
  }

  const possibleLine = lines.find((line) => {
    const cleanedLine = line.replace(/[.,]/g, "").trim();
    return /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(cleanedLine);
  });

  return possibleLine ? titleCaseName(possibleLine.replace(/[.,]/g, "")) : "";
};

const inferHeadline = (text: string) => {
  const patterns = [
    /\b(?:headline|title|target role|role)\s*[:\-]\s*([^.,\n]+)/i,
    /\b(?:working as|work as|role is|position is|headline is)\s+(?:an?\s+)?([^.,\n]+)/i,
    /\b(?:i am|i'm)\s+(?:an?\s+)?([^.,\n]*(?:developer|engineer|designer|analyst|intern|student|graduate)[^.,\n]*)/i,
    /\b(?:aspiring|fresher)\s+([^.,\n]*(?:developer|engineer|designer|analyst)[^.,\n]*)/i,
  ];

  for (const pattern of patterns) {
    const match = extractFirstMatch(text, pattern);

    if (match) {
      return sentenceCase(match.replace(/\bwith\b.*$/i, "").trim());
    }
  }

  return "";
};

const inferSkills = (text: string) => {
  const fromKnownTerms = knownSkillTerms.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text),
  );
  const skillSegment = extractFirstMatch(
    text,
    /\bskills?(?:\s+are|\s+include|\s*:)?\s+([^.\n]+(?:[,/]\s*[^.\n]+){1,})/i,
  );
  const fromSegment = skillSegment
    .split(/[,/|]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1 && item.length < 32);

  return uniqueItems([...fromKnownTerms, ...fromSegment]).slice(0, 18);
};

const inferEducation = (lines: string[]) => {
  const educationLine = lines.find((line) =>
    /\b(?:b\.?tech|bachelor|master|m\.?tech|bca|mca|degree|university|college|school|cgpa|gpa)\b/i.test(line),
  );

  if (!educationLine) {
    return null;
  }

  const year = educationLine.match(/\b(?:20\d{2})(?:\s*[-–]\s*(?:20\d{2}|present))?\b/i)?.[0] ?? "";
  const degree =
    extractFirstMatch(educationLine, /\b((?:B\.?Tech|BTech|Bachelor|Master|M\.?Tech|BCA|MCA)(?:\s+(?:in\s+)?[A-Za-z ]+?)?)(?:\s+from|\s+at|\s+with|[,.;]|$)/i) ||
    extractFirstMatch(educationLine, /\b([^,.;|]*(?:Computer Science|Information Technology|Engineering)[^,.;|]*?)(?:\s+from|\s+at|\s+with|[,.;]|$)/i);
  const school = extractFirstMatch(educationLine, /\b(?:at|from)\s+([^,.;]+?)(?:\s+with|\s+and|[,.;]|$)/i);
  const cgpa = educationLine.match(/\b(?:CGPA|GPA)\s*:?\s*[\d.]+(?:\/\d+)?\b/i)?.[0] ?? "";

  return {
    id: "education-1",
    degree: degree || educationLine.replace(year, "").trim(),
    school,
    year,
    details: cgpa || educationLine,
  };
};

const inferProject = (text: string, lines: string[]) => {
  const projectLine = lines.find((line) => /\b(?:project|built|created|developed|made)\b/i.test(line));

  if (!projectLine) {
    return null;
  }

  const name =
    extractFirstMatch(projectLine, /\b(?:project called|project named)\s+([^,.;\n]+)/i) ||
    extractFirstMatch(projectLine, /\b(?:built|created|developed|made)\s+(?:an?\s+)?([^,.;\n]+?)(?:\s+using|\s+with|[,.;]|$)/i) ||
    extractFirstMatch(projectLine, /\bproject\s*[:\-]\s*([^,.;\n]+)/i);
  const link = text.match(/\b(?:https?:\/\/)?(?:github\.com|gitlab\.com|[\w-]+\.(?:dev|app|com|in))\/?[^\s,)]*/i)?.[0] ?? "";

  return {
    id: "project-1",
    name: sentenceCase(name || "Key Project").replace(/\s+project$/i, " project"),
    link,
    details: paragraphToBullets(projectLine, 3),
  };
};

const inferExperience = (text: string, lines: string[], fallbackRole: string) => {
  const experienceLine = lines.find((line) =>
    /\b(?:worked|working|experience|company|freelance|volunteer)\b/i.test(line) ||
    /\b(?:intern|trainee)\b/i.test(line) && !/\bfresher\b/i.test(line),
  );

  if (!experienceLine) {
    return null;
  }

  const role =
    extractFirstMatch(experienceLine, /\b(?:as|role of)\s+(?:an?\s+)?([^,.;\n]+?)(?:\s+at\b|[,.;]|$)/i) ||
    fallbackRole;
  const company = extractFirstMatch(experienceLine, /\bat\s+([^,.;\n]+)/i);
  const duration = text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+20\d{2}\s*(?:[-–]\s*(?:Present|20\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+20\d{2}))?/i)?.[0] ?? "";

  return {
    id: "experience-1",
    role: sentenceCase(role),
    company,
    location: "",
    duration,
    bullets: paragraphToBullets(experienceLine, 4),
  };
};

const buildSummaryFromDraft = (headline: string, skills: string[], project?: ResumeProject | null) => {
  const role = headline || "early-career candidate";
  const skillText = skills.slice(0, 4).join(", ");

  return `Motivated ${role}${skillText ? ` with skills in ${skillText}` : ""}. ${project?.name ? `Built practical project work including ${project.name}` : "Focused on practical learning, clear communication, and reliable execution"}. Ready to contribute to real-world teams with strong fundamentals and a growth mindset.`;
};

const looksLikeResumeText = (value: string) =>
  /\b(?:student|fresher|developer|engineer|designer|analyst|intern|graduate|skills?|project|built|created|developed|worked|experience|college|university|degree|cgpa|gpa|certification)\b/i.test(value);

const createSummaryFromLooseText = (value: string) => {
  const bullets = paragraphToBullets(value, 3);
  const cleanedText = bullets ? bullets.replace(/\n/g, " ") : value.replace(/\s+/g, " ").trim();

  return cleanedText.length > 360 ? `${cleanedText.slice(0, 357).trim()}...` : cleanedText;
};

const makeDynamicId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const normalizeResumeState = (value: unknown): ResumeBuilderState => {
  if (!value || typeof value !== "object") {
    return defaultResumeState;
  }

  const source = value as Partial<ResumeBuilderState> & {
    basics?: Partial<ResumeBasics>;
  };

  const normalizeEntries = <T extends { id: string }>(
    items: unknown,
    fallback: T[],
    createEntry: (entry: Partial<T>, index: number) => T,
  ) => {
    if (!Array.isArray(items)) {
      return fallback;
    }

    return items.map((item, index) => createEntry(typeof item === "object" && item ? (item as Partial<T>) : {}, index));
  };

  return {
    templateId:
      source.templateId && templateOptions.some((option) => option.id === source.templateId)
        ? source.templateId
        : defaultResumeState.templateId,
    basics: {
      fullName: source.basics?.fullName || "",
      headline: source.basics?.headline || "",
      email: source.basics?.email || "",
      phone: source.basics?.phone || "",
      location: source.basics?.location || "",
      website: source.basics?.website || "",
      github: source.basics?.github || "",
      linkedin: source.basics?.linkedin || "",
    },
    summary: source.summary || "",
    skills: source.skills || "",
    hobbies: source.hobbies || "",
    optionalSections: {
      experience: source.optionalSections?.experience ?? defaultResumeState.optionalSections.experience,
      certifications:
        source.optionalSections?.certifications ?? defaultResumeState.optionalSections.certifications,
      hobbies: source.optionalSections?.hobbies ?? defaultResumeState.optionalSections.hobbies,
    },
    experience: normalizeEntries(source.experience, defaultResumeState.experience, (entry, index) => ({
      id: entry.id || `experience-${index + 1}`,
      role: entry.role || "",
      company: entry.company || "",
      location: entry.location || "",
      duration: entry.duration || "",
      bullets: entry.bullets || "",
    })),
    education: normalizeEntries(source.education, defaultResumeState.education, (entry, index) => ({
      id: entry.id || `education-${index + 1}`,
      degree: entry.degree || "",
      school: entry.school || "",
      year: entry.year || "",
      details: entry.details || "",
    })),
    projects: normalizeEntries(source.projects, defaultResumeState.projects, (entry, index) => ({
      id: entry.id || `project-${index + 1}`,
      name: entry.name || "",
      link: entry.link || "",
      details: entry.details || "",
    })),
    certifications: normalizeEntries(
      source.certifications,
      defaultResumeState.certifications,
      (entry, index) => ({
        id: entry.id || `certification-${index + 1}`,
        name: entry.name || "",
        issuer: entry.issuer || "",
        year: entry.year || "",
      }),
    ),
  };
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="resume-builder-field">
      <span className="resume-builder-label">{label}</span>
      {children}
      {hint ? <span className="resume-builder-hint">{hint}</span> : null}
    </label>
  );
}

function PreviewSection({
  title,
  children,
  sectionKey,
  isFirst,
}: {
  title: string;
  children: ReactNode;
  sectionKey?: string;
  isFirst?: boolean;
}) {
  return (
    <section
      className={joinClasses(
        "resume-preview-section",
        sectionKey && `resume-preview-section-${sectionKey}`,
        isFirst && "resume-preview-section-first",
      )}
    >
      <h3 className="resume-preview-section-title">{title}</h3>
      {children}
    </section>
  );
}

function EditableText({
  value,
  onCommit,
  placeholder,
  className,
  element = "span",
  multiline = false,
  editable = true,
}: {
  value: string;
  onCommit: (value: string) => void;
  placeholder: string;
  className?: string;
  element?: "span" | "p" | "h2" | "li";
  multiline?: boolean;
  editable?: boolean;
}) {
  const Element = element;

  return (
    <Element
      className={joinClasses(
        "resume-inline-editable",
        editable && "resume-inline-editable-active",
        multiline && "resume-inline-editable-multiline",
        className,
      )}
      contentEditable={editable}
      suppressContentEditableWarning
      role={editable ? "textbox" : undefined}
      tabIndex={editable ? 0 : undefined}
      data-placeholder={placeholder}
      aria-label={editable ? placeholder : undefined}
      onBlur={(event) => {
        if (editable) {
          onCommit(event.currentTarget.innerText.trim());
        }
      }}
      onKeyDown={(event) => {
        if (!editable) {
          return;
        }

        if (event.key === "Escape") {
          event.currentTarget.blur();
          return;
        }

        if (!multiline && event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    >
      {value}
    </Element>
  );
}

type AccordionSectionId =
  | "personal"
  | "summary"
  | "education"
  | "skills"
  | "projects"
  | "experience"
  | "certifications"
  | "hobbies";

function AccordionSection({
  id,
  title,
  isOpen,
  onToggle,
  children,
  optionalLabel,
  sectionRef,
}: {
  id: AccordionSectionId;
  title: string;
  isOpen: boolean;
  onToggle: (id: AccordionSectionId) => void;
  children: ReactNode;
  optionalLabel?: string;
  sectionRef?: (node: HTMLElement | null) => void;
}) {
  return (
    <section
      ref={sectionRef}
      className={joinClasses(
        "resume-accordion-section card-surface",
        isOpen && "resume-accordion-section-open",
      )}
    >
      <button
        type="button"
        className="resume-accordion-toggle"
        onClick={(event) => {
          onToggle(id);
          if (event.detail > 0) {
            event.currentTarget.blur();
          }
        }}
        aria-expanded={isOpen}
      >
        <span className="resume-accordion-head">
          <span className="resume-accordion-title">{title}</span>
          {optionalLabel ? <span className="resume-accordion-optional">{optionalLabel}</span> : null}
        </span>
        <span className="resume-accordion-icon" aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen ? <div className="resume-accordion-body">{children}</div> : null}
    </section>
  );
}

export default function ResumeBuilderClient() {
  const [resume, setResume] = useState<ResumeBuilderState>(defaultResumeState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [openSection, setOpenSection] = useState<AccordionSectionId | null>("personal");
  const [isPreviewModeOpen, setIsPreviewModeOpen] = useState(false);
  const [isDirectEditMode, setIsDirectEditMode] = useState(false);
  const [quickDraftText, setQuickDraftText] = useState("");
  const [quickDraftMessage, setQuickDraftMessage] = useState("");
  const [quickDraftHighlights, setQuickDraftHighlights] = useState<string[]>([]);
  const [smartDraftTarget, setSmartDraftTarget] = useState<SmartDraftTarget>("projects");
  const printRootRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<AccordionSectionId, HTMLElement | null>>({
    personal: null,
    summary: null,
    education: null,
    skills: null,
    projects: null,
    experience: null,
    certifications: null,
    hobbies: null,
  });

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (storedValue) {
        setResume(normalizeResumeState(JSON.parse(storedValue)));
      }
    } catch {
      setResume(defaultResumeState);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(resume));
    } catch {
      // Ignore local storage failures to keep the editor usable.
    }
  }, [resume, isHydrated]);

  useEffect(() => {
    if (!isPreviewModeOpen) {
      return;
    }

    const scrollY = window.scrollY;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isPreviewModeOpen]);

  const skillItems = splitSkills(resume.skills);
  const hobbyItems = splitSkills(resume.hobbies);
  const experienceItems = resume.experience.filter(
    (item) => item.role || item.company || item.bullets,
  );
  const educationItems = resume.education.filter(
    (item) => item.degree || item.school || item.details,
  );
  const projectItems = resume.projects.filter(
    (item) => item.name || item.details,
  );
  const certificationItems = resume.certifications.filter(
    (item) => item.name || item.issuer,
  );

  const previewContactLines = [
    resume.basics.phone.trim(),
    resume.basics.email.trim(),
    resume.basics.linkedin.trim(),
    resume.basics.github.trim(),
    resume.basics.website.trim(),
    resume.basics.location.trim(),
  ].filter((item) => item.length > 0);
  const previewContactFieldSources: Array<{
    key: keyof ResumeBasics;
    value: string;
    placeholder: string;
  }> = [
    { key: "phone", value: resume.basics.phone.trim(), placeholder: "Phone" },
    { key: "email", value: resume.basics.email.trim(), placeholder: "Email" },
    { key: "linkedin", value: resume.basics.linkedin.trim(), placeholder: "LinkedIn" },
    { key: "github", value: resume.basics.github.trim(), placeholder: "GitHub" },
    { key: "website", value: resume.basics.website.trim(), placeholder: "Portfolio" },
    { key: "location", value: resume.basics.location.trim(), placeholder: "Location" },
  ];
  const previewContactFieldOptions = previewContactFieldSources.map((item) => ({
    ...item,
    label: createContactLabel(item.key, item.value),
    href: createContactHref(item.key, item.value),
  }));
  const previewContactFields = previewContactFieldOptions.filter((item) => item.value.length > 0);

  const updateBasics = (key: keyof ResumeBasics, value: string) => {
    setResume((current) => ({
      ...current,
      basics: {
        ...current.basics,
        [key]: value,
      },
    }));
  };

  const updateOptionalSection = (key: keyof ResumeOptionalSections, value: boolean) => {
    setResume((current) => ({
      ...current,
      optionalSections: {
        ...current.optionalSections,
        [key]: value,
      },
    }));
  };

  const updateExperience = (id: string, key: keyof ResumeExperience, value: string) => {
    setResume((current) => ({
      ...current,
      experience: current.experience.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateEducation = (id: string, key: keyof ResumeEducation, value: string) => {
    setResume((current) => ({
      ...current,
      education: current.education.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateProject = (id: string, key: keyof ResumeProject, value: string) => {
    setResume((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateCertification = (id: string, key: keyof ResumeCertification, value: string) => {
    setResume((current) => ({
      ...current,
      certifications: current.certifications.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateDelimitedItem = (
    value: string,
    itemIndex: number,
    nextValue: string,
    splitter: (value: string) => string[],
    joiner = ", ",
  ) => {
    const items = splitter(value);
    items[itemIndex] = nextValue.trim();
    return uniqueItems(items.filter(Boolean)).join(joiner);
  };

  const updateProjectBullet = (id: string, bulletIndex: number, value: string) => {
    setResume((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        item.id === id
          ? {
              ...item,
              details: updateDelimitedItem(item.details, bulletIndex, value, splitMultilineText, "\n"),
            }
          : item,
      ),
    }));
  };

  const updateExperienceBullet = (id: string, bulletIndex: number, value: string) => {
    setResume((current) => ({
      ...current,
      experience: current.experience.map((item) =>
        item.id === id
          ? {
              ...item,
              bullets: updateDelimitedItem(item.bullets, bulletIndex, value, splitMultilineText, "\n"),
            }
          : item,
      ),
    }));
  };

  const updateSkill = (index: number, value: string) => {
    setResume((current) => ({
      ...current,
      skills: updateDelimitedItem(current.skills, index, value, splitSkills),
    }));
  };

  const updateHobby = (index: number, value: string) => {
    setResume((current) => ({
      ...current,
      hobbies: updateDelimitedItem(current.hobbies, index, value, splitSkills),
    }));
  };

  const removeExperience = (id: string) => {
    setResume((current) => ({
      ...current,
      experience: current.experience.filter((item) => item.id !== id),
    }));
  };

  const removeEducation = (id: string) => {
    setResume((current) => ({
      ...current,
      education: current.education.filter((item) => item.id !== id),
    }));
  };

  const removeProject = (id: string) => {
    setResume((current) => ({
      ...current,
      projects: current.projects.filter((item) => item.id !== id),
    }));
  };

  const removeCertification = (id: string) => {
    setResume((current) => ({
      ...current,
      certifications: current.certifications.filter((item) => item.id !== id),
    }));
  };

  const toggleSection = (id: AccordionSectionId) => {
    setOpenSection((current) => {
      const nextSection = current === id ? null : id;

      if (nextSection && typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            const section = sectionRefs.current[nextSection];
            if (!section) {
              return;
            }

            const rect = section.getBoundingClientRect();
            const topOffset = window.innerWidth >= 980 ? 112 : 84;
            const bottomThreshold = window.innerHeight - 160;
            const isOutOfView = rect.top < topOffset || rect.bottom > bottomThreshold;

            if (!isOutOfView) {
              return;
            }

            window.scrollTo({
              top: Math.max(window.scrollY + rect.top - topOffset, 0),
              behavior: "smooth",
            });
          });
        });
      }

      return nextSection;
    });
  };

  const openAndScrollToSection = (id: AccordionSectionId) => {
    setOpenSection(id);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const section = sectionRefs.current[id];

        if (!section) {
          return;
        }

        const topOffset = window.innerWidth >= 980 ? 112 : 84;
        const rect = section.getBoundingClientRect();

        window.scrollTo({
          top: Math.max(window.scrollY + rect.top - topOffset, 0),
          behavior: "smooth",
        });
      });
    });
  };

  const generateSummary = () => {
    const role = resume.basics.headline.trim() || "candidate";
    const skillPhrase = skillItems.slice(0, 4).join(", ");
    const firstExperience = experienceItems[0];
    const firstProject = projectItems[0];
    const leadSkillText = skillPhrase ? ` with hands-on skills in ${skillPhrase}` : "";

    const nextSummary = firstExperience
      ? `Results-focused ${role}${leadSkillText}. Built practical experience${firstExperience.company ? ` at ${firstExperience.company}` : ""} and ready to contribute with clear communication, reliable execution, and strong problem solving.`
      : firstProject
        ? `Early-career ${role}${leadSkillText}. Built academic and personal projects such as ${firstProject.name || "real-world web applications"} and ready to contribute with fast learning and solid fundamentals.`
        : `Early-career ${role}${leadSkillText}. Focused on building strong fundamentals, practical project work, and clear communication for real-world teams.`;

    setResume((current) => ({
      ...current,
      summary: nextSummary,
    }));
  };

  const createDraftFromText = () => {
    const sourceText = quickDraftText.trim();

    if (!sourceText) {
      setQuickDraftMessage("Paste your background first, then create the draft.");
      setQuickDraftHighlights([]);
      return;
    }

    const lines = splitDraftStatements(sourceText);
    const originalLines = splitMultilineText(sourceText);
    const email = sourceText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
    const phone = sourceText.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? "";
    const linkedin = sourceText.match(/\b(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,)]*/i)?.[0] ?? "";
    const github = sourceText.match(/\b(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s,)]*/i)?.[0] ?? "";
    const website =
      sourceText.match(/\b(?:https?:\/\/)?(?!(?:www\.)?linkedin\.com)(?!(?:www\.)?github\.com)(?:gitlab\.com|[\w-]+\.(?:dev|app|com|in))\/?[^\s,)]*/i)?.[0] ?? "";
    const fullName = inferName(sourceText, [...originalLines, ...lines]);
    const headline = inferHeadline(sourceText);
    const skills = inferSkills(sourceText);
    const education = inferEducation(lines);
    const project = inferProject(sourceText, lines);
    const experience = inferExperience(sourceText, lines, headline);
    const hasExtractedResumeData = Boolean(
      fullName ||
        headline ||
        email ||
        phone ||
        linkedin ||
        github ||
        website ||
        skills.length > 0 ||
        education ||
        project ||
        experience,
    );
    const canCreateLooseSummary = looksLikeResumeText(sourceText);
    const summary = hasExtractedResumeData
      ? buildSummaryFromDraft(headline, skills, project)
      : canCreateLooseSummary
        ? createSummaryFromLooseText(sourceText)
        : "";

    if (!hasExtractedResumeData && !summary) {
      setQuickDraftMessage("I could not find resume details in this text. Paste details like name, role, skills, education, project, or experience.");
      setQuickDraftHighlights([]);
      return;
    }

    const changedSections: AccordionSectionId[] = [];

    if (fullName || headline || email || phone || linkedin || github || website) {
      changedSections.push("personal");
    }
    if (summary) {
      changedSections.push("summary");
    }
    if (skills.length > 0) {
      changedSections.push("skills");
    }
    if (education) {
      changedSections.push("education");
    }
    if (project) {
      changedSections.push("projects");
    }
    if (experience) {
      changedSections.push("experience");
    }

    setResume((current) => ({
      ...defaultResumeState,
      templateId: current.templateId || "focus",
      basics: {
        fullName,
        headline,
        email,
        phone,
        location: "",
        website,
        github,
        linkedin,
      },
      summary,
      skills: skills.join(", "),
      hobbies: "",
      education: education ? [education] : [createEducationEntry("education-1")],
      projects: project ? [project] : [createProjectEntry("project-1")],
      experience: experience ? [experience] : [createExperienceEntry("experience-1")],
      certifications: [createCertificationEntry("certification-1")],
      optionalSections: {
        experience: Boolean(experience),
        certifications: false,
        hobbies: false,
      },
    }));
    setQuickDraftHighlights(
      uniqueItems([
        fullName ? `Name: ${fullName}` : "",
        headline ? `Headline: ${headline}` : "",
        email ? `Email: ${email}` : "",
        phone ? `Phone: ${phone}` : "",
        linkedin ? "LinkedIn found" : "",
        github ? "GitHub found" : "",
        website ? "Website found" : "",
        skills.length > 0 ? `${skills.length} skills` : "",
        education ? `Education: ${education.degree || education.school || "found"}` : "",
        project ? `Project: ${project.name}` : "",
        experience ? `Experience: ${experience.role || "found"}` : "",
        summary ? "Summary" : "",
      ]),
    );
    setQuickDraftMessage(`Updated ${uniqueItems(changedSections).length} section${uniqueItems(changedSections).length === 1 ? "" : "s"}. Opened the first changed section below.`);
    openAndScrollToSection(changedSections[0] ?? "summary");
  };

  const applyDraftToSelectedSection = () => {
    const sourceText = quickDraftText.trim();

    if (!sourceText) {
      setQuickDraftMessage("Paste text first, choose the section, then apply it.");
      setQuickDraftHighlights([]);
      return;
    }

    const lines = splitDraftStatements(sourceText);
    const bulletText = paragraphToBullets(sourceText, smartDraftTarget === "experience" ? 5 : 4);

    if (smartDraftTarget === "summary") {
      const summaryText = createSummaryFromLooseText(sourceText);

      setResume((current) => ({
        ...current,
        summary: summaryText,
      }));
      setQuickDraftMessage("Updated Summary only.");
      setQuickDraftHighlights(["Section: Summary", "Format: short paragraph"]);
      openAndScrollToSection("summary");
      return;
    }

    if (smartDraftTarget === "skills") {
      const skills = inferSkills(sourceText);
      const fallbackSkills = splitSkills(sourceText).filter((item) => item.length <= 32);
      const nextSkills = uniqueItems(skills.length > 0 ? skills : fallbackSkills).slice(0, 18);

      if (nextSkills.length === 0) {
        setQuickDraftMessage("I could not find skills in this text. Try comma-separated skills like React, SQL, Communication.");
        setQuickDraftHighlights([]);
        return;
      }

      setResume((current) => ({
        ...current,
        skills: nextSkills.join(", "),
      }));
      setQuickDraftMessage("Updated Skills only.");
      setQuickDraftHighlights([`Section: Skills`, `${nextSkills.length} skills`]);
      openAndScrollToSection("skills");
      return;
    }

    if (!bulletText) {
      setQuickDraftMessage("I could not turn this into useful bullets. Paste 2-4 action/result sentences.");
      setQuickDraftHighlights([]);
      return;
    }

    if (smartDraftTarget === "projects") {
      const inferredProject = inferProject(sourceText, lines);

      setResume((current) => {
        const firstProject = current.projects[0] ?? createProjectEntry("project-1");

        return {
          ...current,
          projects: [
            {
              ...firstProject,
              name: firstProject.name || inferredProject?.name || "Key Project",
              link: firstProject.link || inferredProject?.link || "",
              details: inferredProject?.details || bulletText,
            },
            ...current.projects.slice(1),
          ],
        };
      });
      setQuickDraftMessage("Updated Project details only.");
      setQuickDraftHighlights(["Section: Projects", `${splitMultilineText(inferredProject?.details || bulletText).length} bullets`]);
      openAndScrollToSection("projects");
      return;
    }

    const inferredExperience = inferExperience(sourceText, lines, resume.basics.headline);

    setResume((current) => {
      const firstExperience = current.experience[0] ?? createExperienceEntry("experience-1");

      return {
        ...current,
        optionalSections: {
          ...current.optionalSections,
          experience: true,
        },
        experience: [
          {
            ...firstExperience,
            role: firstExperience.role || inferredExperience?.role || current.basics.headline || "Experience",
            company: firstExperience.company || inferredExperience?.company || "",
            location: firstExperience.location || inferredExperience?.location || "",
            duration: firstExperience.duration || inferredExperience?.duration || "",
            bullets: inferredExperience?.bullets || bulletText,
          },
          ...current.experience.slice(1),
        ],
      };
    });
    setQuickDraftMessage("Updated Experience bullets only.");
    setQuickDraftHighlights(["Section: Experience", `${splitMultilineText(inferredExperience?.bullets || bulletText).length} bullets`]);
    openAndScrollToSection("experience");
  };

  const exportPdf = async () => {
    const printRoot = printRootRef.current;

    if (!printRoot) {
      window.print();
      return;
    }

    const printFrame = document.createElement("iframe");
    const stylesheetMarkup = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style'),
    )
      .map((node) => node.outerHTML)
      .join("\n");
    const printDocumentTitle = escapeHtml(resume.basics.fullName.trim() || "Resume");
    const cleanupPrintFrame = () => {
      window.setTimeout(() => {
        printFrame.remove();
        setIsPreviewModeOpen(false);
      }, 400);
    };

    printFrame.setAttribute("title", "Resume PDF export");
    printFrame.style.position = "fixed";
    printFrame.style.top = "0";
    printFrame.style.left = "-10000px";
    printFrame.style.width = "794px";
    printFrame.style.height = "1123px";
    printFrame.style.border = "0";
    printFrame.style.pointerEvents = "none";

    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentDocument;

    if (!printDocument) {
      printFrame.remove();
      window.print();
      return;
    }

    printDocument.open();
    printDocument.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${printDocumentTitle}</title>
    ${stylesheetMarkup}
    <style>
      @page {
        size: A4;
        margin: 0;
      }

      html,
      body {
        width: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        background: #ffffff !important;
        color: #0f172a !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      body {
        font-family: "Inter", "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
        line-height: 1.45;
      }

      .resume-print-root,
      .resume-preview-card,
      .resume-preview-sheet {
        display: block !important;
        position: static !important;
        inset: auto !important;
        width: 100% !important;
        max-width: none !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: #ffffff !important;
        box-shadow: none !important;
      }

      .resume-preview-toolbar,
      .resume-preview-empty-body {
        display: none !important;
      }

      .resume-inline-editable,
      .resume-inline-editable:hover,
      .resume-inline-editable:focus {
        background: transparent !important;
        box-shadow: none !important;
        outline: 0 !important;
      }

      .resume-preview-header,
      .resume-preview-section-title,
      .resume-preview-entry-head {
        break-after: avoid-page;
        page-break-after: avoid;
      }

      .resume-preview-entry,
      .resume-preview-list li {
        break-inside: avoid-page;
        page-break-inside: avoid;
      }

      .resume-preview-sheet {
        box-sizing: border-box !important;
        min-height: 297mm !important;
        padding: 12mm !important;
      }
    </style>
  </head>
  <body>
    ${printRoot.outerHTML}
  </body>
</html>`);
    printDocument.close();

    const printWindow = printFrame.contentWindow;

    if (!printWindow) {
      printFrame.remove();
      window.print();
      return;
    }

    printWindow.addEventListener("afterprint", cleanupPrintFrame, { once: true });
    window.setTimeout(cleanupPrintFrame, 60_000);

    await new Promise((resolve) => window.setTimeout(resolve, 700));
    printWindow.focus();
    printWindow.print();
  };

  useEffect(() => {
    const closePreviewAfterPrint = () => {
      setIsPreviewModeOpen(false);
    };

    window.addEventListener("afterprint", closePreviewAfterPrint);

    return () => {
      window.removeEventListener("afterprint", closePreviewAfterPrint);
    };
  }, []);

  const isStructuredTemplate = resume.templateId === "structured";
  const isClassicTemplate = resume.templateId === "classic";
  const currentTemplate = templateOptions.find((template) => template.id === resume.templateId);
  const previewSectionOrder =
    isStructuredTemplate
      ? ["summary", "skills", "experience", "projects", "education", "certifications", "hobbies"]
      : resume.templateId === "focus"
        ? ["summary", "skills", "projects", "education", "experience", "certifications", "hobbies"]
        : resume.templateId === "modern"
          ? ["summary", "skills", "experience", "projects", "education", "certifications", "hobbies"]
          : ["summary", "skills", "experience", "projects", "education", "certifications", "hobbies"];
  const previewName = resume.basics.fullName.trim();
  const previewHeadline = resume.basics.headline.trim();
  const hasPreviewIdentity = Boolean(previewName || previewHeadline || previewContactLines.length > 0);
  const showExperiencePreview =
    resume.optionalSections.experience && experienceItems.length > 0;
  const showCertificationPreview =
    resume.optionalSections.certifications && certificationItems.length > 0;
  const showHobbiesPreview = resume.optionalSections.hobbies && hobbyItems.length > 0;
  const hasPreviewSections = Boolean(
    resume.summary.trim() ||
      showExperiencePreview ||
      educationItems.length > 0 ||
      projectItems.length > 0 ||
      skillItems.length > 0 ||
      showCertificationPreview ||
      showHobbiesPreview,
  );
  const isSectionVisible = (sectionKey: string) => {
    if (sectionKey === "summary") {
      return resume.summary.trim().length > 0;
    }
    if (sectionKey === "skills") {
      return skillItems.length > 0;
    }
    if (sectionKey === "education") {
      return educationItems.length > 0;
    }
    if (sectionKey === "projects") {
      return projectItems.length > 0;
    }
    if (sectionKey === "experience") {
      return showExperiencePreview;
    }
    if (sectionKey === "certifications") {
      return showCertificationPreview;
    }
    if (sectionKey === "hobbies") {
      return showHobbiesPreview;
    }

    return false;
  };
  const firstVisibleSectionKey = previewSectionOrder.find((sectionKey) => isSectionVisible(sectionKey)) ?? null;
  const PreviewEditableText = (props: Omit<Parameters<typeof EditableText>[0], "editable">) => (
    <EditableText {...props} editable={isDirectEditMode} />
  );

  const previewSheet = (
    <div className="resume-preview-sheet">
      <header
        className={joinClasses(
          "resume-preview-header",
          isStructuredTemplate && "resume-preview-header-structured",
        )}
      >
        {hasPreviewIdentity ? (
          <div>
            {previewName ? (
              <PreviewEditableText
                element="h2"
                className="resume-preview-name"
                value={previewName}
                placeholder="Full name"
                onCommit={(value) => updateBasics("fullName", value)}
              />
            ) : null}
            {previewHeadline ? (
              <PreviewEditableText
                element="p"
                className="resume-preview-headline"
                value={previewHeadline}
                placeholder="Headline"
                onCommit={(value) => updateBasics("headline", value)}
              />
            ) : null}
          </div>
        ) : (
          <div className="resume-preview-empty-hero">
            <p className="resume-preview-empty-title">Start with personal information</p>
            <p className="resume-preview-empty-copy">Your resume updates live as you type.</p>
          </div>
        )}
        {previewContactFields.length > 0 ? (
          <div className="resume-preview-contact">
            {previewContactFields.map((item) => (
              <span key={item.key} className="resume-preview-contact-item">
                {isDirectEditMode ? (
                  <PreviewEditableText
                    value={item.value}
                    placeholder={item.placeholder}
                    onCommit={(value) => updateBasics(item.key, value)}
                  />
                ) : item.href ? (
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div
        className={joinClasses(
          "resume-preview-body",
          isStructuredTemplate && "resume-preview-body-structured",
        )}
      >
        {!hasPreviewSections ? (
          <div className="resume-preview-empty-body">
            Add summary, education, skills, projects, or experience to build the resume.
          </div>
        ) : null}

        {previewSectionOrder.map((sectionKey) => {
          if (sectionKey === "summary" && resume.summary.trim()) {
            return (
              <PreviewSection
                key={sectionKey}
                title="Summary"
                sectionKey="summary"
                isFirst={firstVisibleSectionKey === sectionKey}
              >
                <p
                  className={joinClasses(
                    "resume-preview-copy",
                    isStructuredTemplate && "resume-preview-copy-structured",
                  )}
                >
                  <PreviewEditableText
                    value={resume.summary.trim()}
                    placeholder="Summary"
                    multiline
                    onCommit={(value) =>
                      setResume((current) => ({
                        ...current,
                        summary: value,
                      }))
                    }
                  />
                </p>
              </PreviewSection>
            );
          }

          if (sectionKey === "skills" && skillItems.length > 0) {
            return (
              <PreviewSection
                key={sectionKey}
                title="Skills"
                sectionKey="skills"
                isFirst={firstVisibleSectionKey === sectionKey}
              >
                {isStructuredTemplate ? (
                  <div className="resume-preview-structured-table">
                    <div className="resume-preview-structured-row">
                      <span className="resume-preview-structured-label">Core</span>
                      <PreviewEditableText
                        className="resume-preview-structured-value"
                        value={skillItems.join(" | ")}
                        placeholder="Skills"
                        onCommit={(value) =>
                          setResume((current) => ({
                            ...current,
                            skills: value
                              .split(/[|,\n]/)
                              .map((item) => item.trim())
                              .filter(Boolean)
                              .join(", "),
                          }))
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="resume-preview-skill-row">
                    {skillItems.map((skill, index) => (
                      <PreviewEditableText
                        key={skill}
                        value={skill}
                        placeholder="Skill"
                        onCommit={(value) => updateSkill(index, value)}
                        className={joinClasses(
                          "resume-preview-skill-pill",
                          isClassicTemplate && "resume-preview-skill-pill-classic",
                        )}
                      />
                    ))}
                  </div>
                )}
              </PreviewSection>
            );
          }

          if (sectionKey === "education" && educationItems.length > 0) {
            return (
              <PreviewSection
                key={sectionKey}
                title="Education"
                sectionKey="education"
                isFirst={firstVisibleSectionKey === sectionKey}
              >
                <div
                  className={joinClasses(
                    "resume-preview-stack",
                    isStructuredTemplate && "resume-preview-stack-structured",
                  )}
                >
                  {educationItems.map((item) => (
                    <div
                      key={item.id}
                      className={joinClasses(
                        "resume-preview-entry",
                        isStructuredTemplate && "resume-preview-entry-structured",
                      )}
                    >
                      <div className="resume-preview-entry-head">
                        <div>
                          <PreviewEditableText
                            element="p"
                            className="resume-preview-entry-title"
                            value={item.degree || "Degree"}
                            placeholder="Degree"
                            onCommit={(value) => updateEducation(item.id, "degree", value)}
                          />
                          <p className="resume-preview-entry-subtitle">
                            {isStructuredTemplate
                              ? (
                                  <PreviewEditableText
                                    value={item.school || "School / university"}
                                    placeholder="School / university"
                                    onCommit={(value) => updateEducation(item.id, "school", value)}
                                  />
                                )
                              : (
                                  <PreviewEditableText
                                    value={[item.school, item.details].filter(Boolean).join(" • ")}
                                    placeholder="School and details"
                                    onCommit={(value) => {
                                      const [school, ...details] = value.split("•").map((part) => part.trim());
                                      updateEducation(item.id, "school", school || "");
                                      updateEducation(item.id, "details", details.join(" • "));
                                    }}
                                  />
                                )}
                          </p>
                        </div>
                        {item.year ? (
                          <PreviewEditableText
                            className="resume-preview-entry-meta"
                            value={item.year}
                            placeholder="Year"
                            onCommit={(value) => updateEducation(item.id, "year", value)}
                          />
                        ) : null}
                      </div>
                      {isStructuredTemplate && item.details ? (
                        <PreviewEditableText
                          element="p"
                          className="resume-preview-copy resume-preview-copy-structured"
                          value={item.details}
                          placeholder="Education details"
                          multiline
                          onCommit={(value) => updateEducation(item.id, "details", value)}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </PreviewSection>
            );
          }

          if (sectionKey === "projects" && projectItems.length > 0) {
            return (
              <PreviewSection
                key={sectionKey}
                title="Projects"
                sectionKey="projects"
                isFirst={firstVisibleSectionKey === sectionKey}
              >
                <div
                  className={joinClasses(
                    "resume-preview-stack",
                    isStructuredTemplate && "resume-preview-stack-structured",
                  )}
                >
                  {projectItems.map((item) => (
                    <div
                      key={item.id}
                      className={joinClasses(
                        "resume-preview-entry",
                        isStructuredTemplate && "resume-preview-entry-structured",
                      )}
                    >
                      <div className="resume-preview-entry-head">
                        <div>
                          <PreviewEditableText
                            element="p"
                            className="resume-preview-entry-title"
                            value={item.name || "Project"}
                            placeholder="Project name"
                            onCommit={(value) => updateProject(item.id, "name", value)}
                          />
                          {item.link ? (
                            <p className="resume-preview-entry-subtitle">
                              {isDirectEditMode ? (
                                <PreviewEditableText
                                  value={item.link}
                                  placeholder="Project link"
                                  onCommit={(value) => updateProject(item.id, "link", value)}
                                />
                              ) : (
                                <a
                                  className="resume-preview-entry-link"
                                  href={normalizeWebsiteHref(item.link)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {item.link}
                                </a>
                              )}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <ul className="resume-preview-list">
                        {splitMultilineText(item.details).map((bullet, index) => (
                          <PreviewEditableText
                            key={`${item.id}-${bullet}`}
                            element="li"
                            value={bullet}
                            placeholder="Project bullet"
                            multiline
                            onCommit={(value) => updateProjectBullet(item.id, index, value)}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            );
          }

          if (sectionKey === "experience" && showExperiencePreview) {
            return (
              <PreviewSection
                key={sectionKey}
                title="Experience"
                sectionKey="experience"
                isFirst={firstVisibleSectionKey === sectionKey}
              >
                <div
                  className={joinClasses(
                    "resume-preview-stack",
                    isStructuredTemplate && "resume-preview-stack-structured",
                  )}
                >
                  {experienceItems.map((item) => (
                    <div
                      key={item.id}
                      className={joinClasses(
                        "resume-preview-entry",
                        isStructuredTemplate && "resume-preview-entry-structured",
                      )}
                    >
                      <div className="resume-preview-entry-head">
                        <div>
                          <PreviewEditableText
                            element="p"
                            className="resume-preview-entry-title"
                            value={item.role || "Role"}
                            placeholder="Role"
                            onCommit={(value) => updateExperience(item.id, "role", value)}
                          />
                          <PreviewEditableText
                            element="p"
                            className="resume-preview-entry-subtitle"
                            value={[item.company, item.location].filter(Boolean).join(" • ")}
                            placeholder="Company and location"
                            onCommit={(value) => {
                              const [company, location] = value.split("•").map((part) => part.trim());
                              updateExperience(item.id, "company", company || "");
                              updateExperience(item.id, "location", location || "");
                            }}
                          />
                        </div>
                        {item.duration ? (
                          <PreviewEditableText
                            className="resume-preview-entry-meta"
                            value={item.duration}
                            placeholder="Duration"
                            onCommit={(value) => updateExperience(item.id, "duration", value)}
                          />
                        ) : null}
                      </div>
                      <ul className="resume-preview-list">
                        {splitMultilineText(item.bullets).map((bullet, index) => (
                          <PreviewEditableText
                            key={`${item.id}-${bullet}`}
                            element="li"
                            value={bullet}
                            placeholder="Experience bullet"
                            multiline
                            onCommit={(value) => updateExperienceBullet(item.id, index, value)}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            );
          }

          if (sectionKey === "certifications" && showCertificationPreview) {
            return (
              <PreviewSection
                key={sectionKey}
                title="Certifications"
                sectionKey="certifications"
                isFirst={firstVisibleSectionKey === sectionKey}
              >
                <div
                  className={joinClasses(
                    "resume-preview-stack",
                    isStructuredTemplate && "resume-preview-stack-structured",
                  )}
                >
                  {certificationItems.map((item) => (
                    <div
                      key={item.id}
                      className={joinClasses(
                        "resume-preview-entry",
                        isStructuredTemplate && "resume-preview-entry-structured",
                      )}
                    >
                      <div className="resume-preview-entry-head">
                        <div>
                          <PreviewEditableText
                            element="p"
                            className="resume-preview-entry-title"
                            value={item.name || "Certification"}
                            placeholder="Certification"
                            onCommit={(value) => updateCertification(item.id, "name", value)}
                          />
                          {item.issuer ? (
                            <PreviewEditableText
                              element="p"
                              className="resume-preview-entry-subtitle"
                              value={item.issuer}
                              placeholder="Issuer"
                              onCommit={(value) => updateCertification(item.id, "issuer", value)}
                            />
                          ) : null}
                        </div>
                        {item.year ? (
                          <PreviewEditableText
                            className="resume-preview-entry-meta"
                            value={item.year}
                            placeholder="Year"
                            onCommit={(value) => updateCertification(item.id, "year", value)}
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            );
          }

          if (sectionKey === "hobbies" && showHobbiesPreview) {
            return (
              <PreviewSection
                key={sectionKey}
                title="Hobbies"
                sectionKey="hobbies"
                isFirst={firstVisibleSectionKey === sectionKey}
              >
                <div className="resume-preview-skill-row">
                  {hobbyItems.map((hobby, index) => (
                    <PreviewEditableText
                      key={hobby}
                      value={hobby}
                      placeholder="Hobby"
                      onCommit={(value) => updateHobby(index, value)}
                      className={joinClasses(
                        "resume-preview-skill-pill",
                        isClassicTemplate && "resume-preview-skill-pill-classic",
                      )}
                    />
                  ))}
                </div>
              </PreviewSection>
            );
          }

          return null;
        })}
      </div>
    </div>
  );

  return (
    <div className="resume-builder-page">
      <section className="fade-up resume-builder-hero resume-builder-hero-compact card-surface rounded-[1.6rem] px-5 py-5 sm:px-6 sm:py-5">
        <div className="resume-builder-hero-grid resume-builder-hero-grid-compact">
          <div className="resume-builder-hero-copy">
            <p className="jobs-directory-kicker">Resume Builder</p>
            <h1 className="resume-builder-hero-title">Build your resume on the template.</h1>
            <p className="resume-builder-hero-text">
              Edit the form or click the live resume preview. Switch styles anytime.
            </p>
          </div>
          <ActionButton
            variant="secondary"
            buttonType="button"
            onClick={() => setResume(starterResumeState)}
            className="resume-builder-hero-button"
          >
            Use Starter Resume
          </ActionButton>
        </div>
      </section>

      <section className="resume-builder-shell">
        <div className="resume-builder-editor">
          <section className="resume-smart-draft card-surface">
            <div className="resume-smart-draft-head">
              <div>
                <p className="resume-template-switch-label">Smart Draft</p>
                <h2 className="resume-smart-draft-title">Paste your story and let the builder fill the first draft.</h2>
              </div>
              <p className="resume-smart-draft-copy">
                Works in your browser: paste a rough intro, LinkedIn bio, or project notes.
              </p>
            </div>
            <Field label="Rough resume text">
              <textarea
                className="form-control resume-builder-control resume-builder-textarea resume-smart-draft-textarea"
                value={quickDraftText}
                onChange={(event) => {
                  setQuickDraftText(event.target.value);
                  setQuickDraftMessage("");
                  setQuickDraftHighlights([]);
                }}
                placeholder="Example: My name is Riya Sharma. I am a frontend developer fresher with React, JavaScript and SQL. I built a job tracker project using Next.js..."
              />
            </Field>
            <div className="resume-smart-draft-target">
              <p className="resume-smart-draft-target-label">Apply pasted text to</p>
              <div className="resume-smart-draft-target-grid">
                {smartDraftTargetOptions.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    className={joinClasses(
                      "resume-smart-draft-target-button",
                      smartDraftTarget === target.id && "resume-smart-draft-target-button-active",
                    )}
                    onClick={() => setSmartDraftTarget(target.id)}
                  >
                    <span>{target.label}</span>
                    <small>{target.description}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="resume-smart-draft-actions">
              <ActionButton
                variant="primary"
                buttonType="button"
                onClick={createDraftFromText}
                className="sm:w-auto"
              >
                Replace Resume With Draft
              </ActionButton>
              <ActionButton
                variant="secondary"
                buttonType="button"
                onClick={applyDraftToSelectedSection}
                className="sm:w-auto"
              >
                Apply To Selected Section
              </ActionButton>
            </div>
            {quickDraftMessage ? <p className="resume-smart-draft-message">{quickDraftMessage}</p> : null}
            {quickDraftHighlights.length > 0 ? (
              <div className="resume-smart-draft-detected" aria-label="Detected resume details">
                {quickDraftHighlights.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : null}
          </section>

          <div className="resume-accordion-list">
            <AccordionSection
              id="personal"
              title="Personal Information"
              isOpen={openSection === "personal"}
              onToggle={toggleSection}
              sectionRef={(node) => {
                sectionRefs.current.personal = node;
              }}
            >
              <div className="resume-template-switch-wrap">
                <div className="resume-template-panel">
                  <div className="resume-template-panel-head">
                    <div>
                      <p className="resume-template-switch-label">Template</p>
                      <p className="resume-template-panel-title">Choose your resume template</p>
                    </div>
                    <p className="resume-template-panel-copy">
                      Switch between ATS-safe, modern, projects-first, and structured resume styles anytime. Your content stays intact.
                    </p>
                  </div>
                  <div className="resume-template-switch">
                    {templateOptions.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() =>
                          setResume((current) => ({ ...current, templateId: template.id }))
                        }
                        className={joinClasses(
                          "resume-template-switch-button",
                          resume.templateId === template.id && "resume-template-switch-button-active",
                        )}
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="resume-builder-form-grid mt-4">
                <Field label="Full name">
                  <input
                    className="form-control resume-builder-control"
                    value={resume.basics.fullName}
                    onChange={(event) => updateBasics("fullName", event.target.value)}
                    placeholder="Your full name"
                  />
                </Field>
                <Field label="Headline">
                  <input
                    className="form-control resume-builder-control"
                    value={resume.basics.headline}
                    onChange={(event) => updateBasics("headline", event.target.value)}
                    placeholder="Frontend Developer"
                  />
                </Field>
                <Field label="Email">
                  <input
                    className="form-control resume-builder-control"
                    value={resume.basics.email}
                    onChange={(event) => updateBasics("email", event.target.value)}
                    placeholder="name@email.com"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className="form-control resume-builder-control"
                    value={resume.basics.phone}
                    onChange={(event) => updateBasics("phone", event.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </Field>
                <Field label="Location">
                  <input
                    className="form-control resume-builder-control"
                    value={resume.basics.location}
                    onChange={(event) => updateBasics("location", event.target.value)}
                    placeholder="Bengaluru, India"
                  />
                </Field>
                <Field label="Website / Portfolio">
                  <input
                    className="form-control resume-builder-control"
                    value={resume.basics.website}
                    onChange={(event) => updateBasics("website", event.target.value)}
                    placeholder="portfolio.dev"
                  />
                </Field>
                <Field label="GitHub">
                  <input
                    className="form-control resume-builder-control"
                    value={resume.basics.github}
                    onChange={(event) => updateBasics("github", event.target.value)}
                    placeholder="github.com/your-name"
                  />
                </Field>
                <Field label="LinkedIn">
                  <input
                    className="form-control resume-builder-control"
                    value={resume.basics.linkedin}
                    onChange={(event) => updateBasics("linkedin", event.target.value)}
                    placeholder="linkedin.com/in/your-name"
                  />
                </Field>
              </div>
            </AccordionSection>

            <AccordionSection
              id="summary"
              title="Summary"
              isOpen={openSection === "summary"}
              onToggle={toggleSection}
              sectionRef={(node) => {
                sectionRefs.current.summary = node;
              }}
            >
              <div className="resume-section-actions">
                <ActionButton
                  variant="secondary"
                  buttonType="button"
                  onClick={generateSummary}
                  className="job-card-action-button sm:w-auto"
                >
                  Generate Summary
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  buttonType="button"
                  onClick={() =>
                    setResume((current) => ({
                      ...current,
                      summary: paragraphToBullets(current.summary, 3).replace(/\n/g, " "),
                    }))
                  }
                  className="job-card-action-button sm:w-auto"
                >
                  Tighten Text
                </ActionButton>
              </div>
              <Field label="Summary">
                <textarea
                  className="form-control resume-builder-control resume-builder-textarea resume-summary-textarea"
                  value={resume.summary}
                  onChange={(event) =>
                    setResume((current) => ({ ...current, summary: event.target.value }))
                  }
                  placeholder="Write 2 to 4 lines about your strengths and role fit."
                />
              </Field>
            </AccordionSection>

            <AccordionSection
              id="education"
              title="Education"
              isOpen={openSection === "education"}
              onToggle={toggleSection}
              sectionRef={(node) => {
                sectionRefs.current.education = node;
              }}
            >
              <div className="space-y-4">
                {resume.education.map((item, index) => (
                  <div key={item.id} className="resume-entry-card">
                    <div className="resume-entry-head">
                      <h3 className="resume-entry-title">Education {index + 1}</h3>
                      <button type="button" onClick={() => removeEducation(item.id)} className="resume-entry-remove">
                        Remove
                      </button>
                    </div>
                    <div className="resume-builder-form-grid">
                      <Field label="Degree">
                        <input
                          className="form-control resume-builder-control"
                          value={item.degree}
                          onChange={(event) => updateEducation(item.id, "degree", event.target.value)}
                          placeholder="B.Tech in Computer Science"
                        />
                      </Field>
                      <Field label="School / University">
                        <input
                          className="form-control resume-builder-control"
                          value={item.school}
                          onChange={(event) => updateEducation(item.id, "school", event.target.value)}
                          placeholder="Your university"
                        />
                      </Field>
                      <Field label="Year">
                        <input
                          className="form-control resume-builder-control"
                          value={item.year}
                          onChange={(event) => updateEducation(item.id, "year", event.target.value)}
                          placeholder="2023 - 2027"
                        />
                      </Field>
                    </div>
                    <Field label="Details">
                      <textarea
                        className="form-control resume-builder-control resume-builder-textarea resume-builder-textarea-compact"
                        value={item.details}
                        onChange={(event) => updateEducation(item.id, "details", event.target.value)}
                        placeholder="CGPA, coursework, achievements"
                      />
                    </Field>
                  </div>
                ))}
                <ActionButton
                  variant="secondary"
                  buttonType="button"
                  onClick={() =>
                    setResume((current) => ({
                      ...current,
                      education: [...current.education, createEducationEntry(makeDynamicId("education"))],
                    }))
                  }
                  className="sm:w-auto"
                >
                  Add Education
                </ActionButton>
              </div>
            </AccordionSection>

            <AccordionSection
              id="skills"
              title="Skills"
              isOpen={openSection === "skills"}
              onToggle={toggleSection}
              sectionRef={(node) => {
                sectionRefs.current.skills = node;
              }}
            >
              <Field label="Skills">
                <textarea
                  className="form-control resume-builder-control resume-builder-textarea resume-builder-textarea-compact"
                  value={resume.skills}
                  onChange={(event) =>
                    setResume((current) => ({ ...current, skills: event.target.value }))
                  }
                  placeholder="JavaScript, React, Node.js, SQL, Communication"
                />
              </Field>
            </AccordionSection>

            <AccordionSection
              id="projects"
              title="Projects"
              isOpen={openSection === "projects"}
              onToggle={toggleSection}
              sectionRef={(node) => {
                sectionRefs.current.projects = node;
              }}
            >
              <div className="space-y-4">
                {resume.projects.map((item, index) => (
                  <div key={item.id} className="resume-entry-card">
                    <div className="resume-entry-head">
                      <h3 className="resume-entry-title">Project {index + 1}</h3>
                      <button type="button" onClick={() => removeProject(item.id)} className="resume-entry-remove">
                        Remove
                      </button>
                    </div>
                    <div className="resume-builder-form-grid">
                      <Field label="Project name">
                        <input
                          className="form-control resume-builder-control"
                          value={item.name}
                          onChange={(event) => updateProject(item.id, "name", event.target.value)}
                          placeholder="Job Portal Web Application"
                        />
                      </Field>
                      <Field label="Link">
                        <input
                          className="form-control resume-builder-control"
                          value={item.link}
                          onChange={(event) => updateProject(item.id, "link", event.target.value)}
                          placeholder="github.com/your-project"
                        />
                      </Field>
                    </div>
                    <Field label="Details">
                      <textarea
                        className="form-control resume-builder-control resume-builder-textarea"
                        value={item.details}
                        onChange={(event) => updateProject(item.id, "details", event.target.value)}
                        placeholder="What you built and the impact."
                      />
                    </Field>
                    <div className="resume-inline-actions">
                      <button
                        type="button"
                        className="resume-inline-action"
                        onClick={() => updateProject(item.id, "details", paragraphToBullets(item.details, 4))}
                      >
                        Make Bullets
                      </button>
                    </div>
                  </div>
                ))}
                <ActionButton
                  variant="secondary"
                  buttonType="button"
                  onClick={() =>
                    setResume((current) => ({
                      ...current,
                      projects: [...current.projects, createProjectEntry(makeDynamicId("project"))],
                    }))
                  }
                  className="sm:w-auto"
                >
                  Add Project
                </ActionButton>
              </div>
            </AccordionSection>

            <AccordionSection
              id="experience"
              title="Experience"
              isOpen={openSection === "experience"}
              onToggle={toggleSection}
              optionalLabel="Optional"
              sectionRef={(node) => {
                sectionRefs.current.experience = node;
              }}
            >
              <div className="resume-optional-toggle-row">
                <label className="resume-optional-toggle">
                  <input
                    type="checkbox"
                    checked={resume.optionalSections.experience}
                    onChange={(event) => updateOptionalSection("experience", event.target.checked)}
                  />
                  <span>Include this section</span>
                </label>
              </div>
              {experienceItems.length === 0 ? (
                <p className="resume-help-note">No experience yet? Add academic projects or internships.</p>
              ) : null}
              <div className="space-y-4">
                {resume.experience.map((item, index) => (
                  <div key={item.id} className="resume-entry-card">
                    <div className="resume-entry-head">
                      <h3 className="resume-entry-title">Experience {index + 1}</h3>
                      <button type="button" onClick={() => removeExperience(item.id)} className="resume-entry-remove">
                        Remove
                      </button>
                    </div>
                    <div className="resume-builder-form-grid">
                      <Field label="Role">
                        <input
                          className="form-control resume-builder-control"
                          value={item.role}
                          onChange={(event) => updateExperience(item.id, "role", event.target.value)}
                          placeholder="Software Support Engineer"
                        />
                      </Field>
                      <Field label="Company">
                        <input
                          className="form-control resume-builder-control"
                          value={item.company}
                          onChange={(event) => updateExperience(item.id, "company", event.target.value)}
                          placeholder="Company name"
                        />
                      </Field>
                      <Field label="Location">
                        <input
                          className="form-control resume-builder-control"
                          value={item.location}
                          onChange={(event) => updateExperience(item.id, "location", event.target.value)}
                          placeholder="Remote / City"
                        />
                      </Field>
                      <Field label="Duration">
                        <input
                          className="form-control resume-builder-control"
                          value={item.duration}
                          onChange={(event) => updateExperience(item.id, "duration", event.target.value)}
                          placeholder="Jan 2026 - Present"
                        />
                      </Field>
                    </div>
                    <Field label="Bullet points">
                      <textarea
                        className="form-control resume-builder-control resume-builder-textarea"
                        value={item.bullets}
                        onChange={(event) => updateExperience(item.id, "bullets", event.target.value)}
                        placeholder="Use one bullet per line."
                      />
                    </Field>
                    <div className="resume-inline-actions">
                      <button
                        type="button"
                        className="resume-inline-action"
                        onClick={() => updateExperience(item.id, "bullets", paragraphToBullets(item.bullets, 5))}
                      >
                        Make Bullets
                      </button>
                    </div>
                  </div>
                ))}
                <ActionButton
                  variant="secondary"
                  buttonType="button"
                  onClick={() =>
                    setResume((current) => ({
                      ...current,
                      experience: [...current.experience, createExperienceEntry(makeDynamicId("experience"))],
                    }))
                  }
                  className="sm:w-auto"
                >
                  Add Experience
                </ActionButton>
              </div>
            </AccordionSection>

            <AccordionSection
              id="certifications"
              title="Certifications"
              isOpen={openSection === "certifications"}
              onToggle={toggleSection}
              optionalLabel="Optional"
              sectionRef={(node) => {
                sectionRefs.current.certifications = node;
              }}
            >
              <div className="resume-optional-toggle-row">
                <label className="resume-optional-toggle">
                  <input
                    type="checkbox"
                    checked={resume.optionalSections.certifications}
                    onChange={(event) => updateOptionalSection("certifications", event.target.checked)}
                  />
                  <span>Include this section</span>
                </label>
              </div>
              <div className="space-y-4">
                {resume.certifications.map((item, index) => (
                  <div key={item.id} className="resume-entry-card">
                    <div className="resume-entry-head">
                      <h3 className="resume-entry-title">Certification {index + 1}</h3>
                      <button type="button" onClick={() => removeCertification(item.id)} className="resume-entry-remove">
                        Remove
                      </button>
                    </div>
                    <div className="resume-builder-form-grid">
                      <Field label="Name">
                        <input
                          className="form-control resume-builder-control"
                          value={item.name}
                          onChange={(event) => updateCertification(item.id, "name", event.target.value)}
                          placeholder="Certification name"
                        />
                      </Field>
                      <Field label="Issuer">
                        <input
                          className="form-control resume-builder-control"
                          value={item.issuer}
                          onChange={(event) => updateCertification(item.id, "issuer", event.target.value)}
                          placeholder="Issuer"
                        />
                      </Field>
                      <Field label="Year">
                        <input
                          className="form-control resume-builder-control"
                          value={item.year}
                          onChange={(event) => updateCertification(item.id, "year", event.target.value)}
                          placeholder="2025"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
                <ActionButton
                  variant="secondary"
                  buttonType="button"
                  onClick={() =>
                    setResume((current) => ({
                      ...current,
                      certifications: [
                        ...current.certifications,
                        createCertificationEntry(makeDynamicId("certification")),
                      ],
                    }))
                  }
                  className="sm:w-auto"
                >
                  Add Certification
                </ActionButton>
              </div>
            </AccordionSection>

            <AccordionSection
              id="hobbies"
              title="Hobbies"
              isOpen={openSection === "hobbies"}
              onToggle={toggleSection}
              optionalLabel="Optional"
              sectionRef={(node) => {
                sectionRefs.current.hobbies = node;
              }}
            >
              <div className="resume-optional-toggle-row">
                <label className="resume-optional-toggle">
                  <input
                    type="checkbox"
                    checked={resume.optionalSections.hobbies}
                    onChange={(event) => updateOptionalSection("hobbies", event.target.checked)}
                  />
                  <span>Include this section</span>
                </label>
              </div>
              <Field label="Hobbies">
                <textarea
                  className="form-control resume-builder-control resume-builder-textarea resume-builder-textarea-compact"
                  value={resume.hobbies}
                  onChange={(event) =>
                    setResume((current) => ({ ...current, hobbies: event.target.value }))
                  }
                  placeholder="Reading, football, volunteering"
                />
              </Field>
            </AccordionSection>
          </div>

          <div className="resume-builder-footer-actions card-surface">
            <div className="resume-builder-footer-actions-row">
              <ActionButton
                variant="secondary"
                buttonType="button"
                onClick={() => setIsPreviewModeOpen(true)}
                className="sm:w-auto"
              >
                Preview PDF
              </ActionButton>
              <ActionButton
                variant="primary"
                buttonType="button"
                onClick={exportPdf}
                className="sm:w-auto"
              >
                Export PDF
              </ActionButton>
              <ActionButton
                variant="muted"
                buttonType="button"
                onClick={() => setResume(defaultResumeState)}
                className="sm:w-auto"
              >
                Clear All
              </ActionButton>
            </div>
          </div>
        </div>

        <aside className="resume-builder-preview-column">
          <div className="resume-builder-sticky">
            <div
              className={joinClasses(
                "resume-preview-card",
                isDirectEditMode && "resume-preview-card-direct-edit",
                `resume-preview-${resume.templateId}`,
              )}
            >
              <div className="resume-preview-toolbar">
                <div className="resume-preview-toolbar-main">
                  <span className="resume-preview-toolbar-pill">{siteName} Resume</span>
                  <span className="resume-preview-toolbar-note">{currentTemplate?.label}</span>
                </div>
                <div className="resume-preview-edit-controls">
                  <span className="resume-preview-edit-hint">
                    {isDirectEditMode ? "Click resume text to edit" : "Prefer editing on the layout?"}
                  </span>
                  <button
                    type="button"
                    className={joinClasses(
                      "resume-direct-edit-toggle",
                      isDirectEditMode && "resume-direct-edit-toggle-active",
                    )}
                    onClick={() => setIsDirectEditMode((current) => !current)}
                    aria-pressed={isDirectEditMode}
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5">
                      <path
                        d="m5 13.7 1.1-3.9 6.8-6.8a1.5 1.5 0 0 1 2.1 2.1l-6.8 6.8L4.3 13l.7.7Zm6.9-9.6 2 2"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.6"
                      />
                    </svg>
                    <span>{isDirectEditMode ? "Editing on" : "Edit preview"}</span>
                  </button>
                </div>
              </div>
              {previewSheet}
            </div>
          </div>
        </aside>
      </section>

      <div ref={printRootRef} className="resume-print-root" aria-hidden="true">
        <div className={joinClasses("resume-preview-card", "resume-preview-print-card", `resume-preview-${resume.templateId}`)}>
          {previewSheet}
        </div>
      </div>

      {isPreviewModeOpen ? (
        <div className="resume-preview-modal" role="dialog" aria-modal="true" aria-label="PDF preview">
          <div className="resume-preview-modal-shell">
            <div className="resume-preview-modal-actions">
              <button
                type="button"
                className="resume-preview-modal-close"
                onClick={() => setIsPreviewModeOpen(false)}
              >
                Close
              </button>
              <ActionButton
                variant="primary"
                buttonType="button"
                onClick={exportPdf}
                className="sm:w-auto"
              >
                Export PDF
              </ActionButton>
            </div>
            <div className={joinClasses("resume-preview-card", "resume-preview-modal-card", `resume-preview-${resume.templateId}`)}>
              {previewSheet}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
