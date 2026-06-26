import { promises as fs } from "node:fs";
import path from "node:path";

const jobsDir = path.join(process.cwd(), "content", "jobs");

const targetFiles = [
  "apprentice-data-engineering-eaton.md",
  "intela-support-associate-services-specialist-i-deloitte.md",
  "intern-wipro-limited.md",
  "java-backend-developer-cgi.md",
  "trainee-transaction-processing-officer-mphasis.md",
  "ai-software-engineer-guidehouse.md",
  "associate-engineer-aws-devops-harman.md",
  "it-support-engineer-wipro.md",
  "junior-ai-engineer-infosys-limited.md",
  "project-engineer-emerson.md",
  "python-ai-developer-cgi.md",
  "technical-support-specialist-telephone-support-siemens-healthineers.md",
  "associate-linux-support-engineer-canonical.md",
  "graduate-engineer-trainee-emerson.md",
  "operations-trainee-1-caterpillar.md",
  "security-analyst-virtusa.md",
  "analyst-trainee-cognizant.md",
  "associate-analyst-contractual-irc293317-globallogic.md",
  "associate-software-engineer-heizen.md",
  "associate-software-engineer-reliaquest.md",
];

const frontMatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;

const introVariants = [
  "This listing looks most useful for candidates who want practical exposure rather than a purely theoretical role.",
  "This role stands out more as a skill-building opportunity than a generic apply-and-forget listing.",
  "For early-career applicants, this opening looks strongest when read as a capability check rather than just a title match.",
];

const resumeVariants = [
  "A better application here is usually built around proof of work, not just a list of buzzwords.",
  "This is the kind of role where a targeted resume can matter more than a broad general-purpose profile.",
  "Candidates will usually look stronger if the resume mirrors the employer's real workflow instead of repeating generic claims.",
];

const verificationVariants = [
  "Before submitting anything, compare the destination page against the details below and make sure the public source still matches the current listing.",
  "Treat the source page as the final authority and use these notes as a pre-apply check, not as a replacement for the employer instructions.",
  "Use this section as a filter before applying so you do not spend time on a role that has already changed on the employer side.",
];

const familyNotes = {
  data: "The strongest fit here is usually someone who can show clean reasoning around data flow, accuracy, validation, and structured problem-solving.",
  support:
    "This type of role usually rewards calm communication, issue-triage discipline, and the ability to explain problems clearly to users or teammates.",
  software:
    "The best fit is typically a candidate who can connect fundamentals to working projects, not someone who only lists tools without evidence of use.",
  ai: "AI-leaning roles usually become much more competitive, so practical examples, small shipped work, and clarity around problem selection matter a lot.",
  operations:
    "Operations-heavy roles often look simple from the title, but consistency, documentation habits, and process accuracy are what usually separate strong applicants.",
  engineering:
    "Engineering trainee roles generally favor candidates who can combine fundamentals, coachability, and execution discipline in real work settings.",
  security:
    "Security roles usually reward methodical thinking, investigation habits, and evidence that you can work carefully with risk, logs, or controls.",
};

const parseFrontMatter = (raw) => {
  const match = raw.match(frontMatterPattern);
  if (!match) {
    return null;
  }

  const lines = match[1].replace(/\r/g, "").split("\n");
  const data = {};
  let activeListKey = null;
  let activeBlockKey = null;

  for (const rawLine of lines) {
    const line = rawLine;

    const topLevelMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (topLevelMatch && !/^\s/.test(line)) {
      const [, key, value] = topLevelMatch;
      activeListKey = null;
      activeBlockKey = null;

      if (value === "|-" || value === "|" || value === ">-" || value === ">") {
        data[key] = [];
        activeBlockKey = key;
        continue;
      }

      if (!value) {
        data[key] = [];
        activeListKey = key;
        continue;
      }

      data[key] = value.replace(/^['"]|['"]$/g, "").trim();
      continue;
    }

    const listItemMatch = line.match(/^\s*-\s*(.+)$/);
    if (listItemMatch && activeListKey) {
      data[activeListKey].push(listItemMatch[1].replace(/^['"]|['"]$/g, "").trim());
      continue;
    }

    if (/^\s+/.test(line) && activeBlockKey) {
      const normalizedLine = line.trim();
      if (normalizedLine) {
        data[activeBlockKey].push(normalizedLine.replace(/^['"]|['"]$/g, "").trim());
      }
    }
  }

  return {
    data,
    frontMatter: match[1].trim(),
    body: match[2].trim(),
  };
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
};

const toSentence = (items, limit = 4) => {
  const cleaned = items
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, limit);

  if (cleaned.length === 0) {
    return "";
  }

  if (cleaned.length === 1) {
    return cleaned[0];
  }

  return `${cleaned.slice(0, -1).join(", ")} and ${cleaned.at(-1)}`;
};

const detectFamily = (title, skills) => {
  const source = `${title} ${skills.join(" ")}`.toLowerCase();

  if (/\b(ai|ml|machine learning|gen ai|python ai)\b/.test(source)) {
    return "ai";
  }

  if (/\b(data|etl|sql|pipeline|snowflake|spark)\b/.test(source)) {
    return "data";
  }

  if (/\b(support|service|helpdesk|ticket|incident)\b/.test(source)) {
    return "support";
  }

  if (/\b(security|soc|risk|compliance|threat)\b/.test(source)) {
    return "security";
  }

  if (/\b(operations|processing|analyst|transaction|back office)\b/.test(source)) {
    return "operations";
  }

  if (/\b(engineer|engineering|trainee|get|project engineer)\b/.test(source)) {
    return "engineering";
  }

  return "software";
};

const createBody = (frontMatter, index) => {
  const title = frontMatter.title || "This role";
  const company = frontMatter.company || "the employer";
  const location = frontMatter.location || "the listed location";
  const workMode = frontMatter.workMode || "";
  const employmentType = frontMatter.employmentType || "";
  const experience = frontMatter.experience || "experience range not clearly specified";
  const salary = frontMatter.salary || "Not mentioned";
  const education = toArray(frontMatter.education);
  const skills = toArray(frontMatter.skills);
  const responsibilities = toArray(frontMatter.responsibilities);
  const eligibilityLines = toArray(frontMatter.eligibilityCriteria);
  const jobTiming = frontMatter.jobTiming || "Not mentioned";
  const family = detectFamily(title, skills);
  const intro = introVariants[index % introVariants.length];
  const resumeLead = resumeVariants[index % resumeVariants.length];
  const verificationLead = verificationVariants[index % verificationVariants.length];
  const opportunityLabel = employmentType
    ? `${employmentType.toLowerCase()} opportunity`
    : "career opportunity";
  const workModeSentence = workMode
    ? `The listing currently points to a ${workMode.toLowerCase()} setup.`
    : "The work setup should still be confirmed on the employer page.";
  const workStyleLabel = workMode ? workMode.toLowerCase() : "the listed work setup";

  const firstSkillSentence = toSentence(skills, 5);
  const firstResponsibilitySentence = toSentence(responsibilities, 3);
  const firstEducationSentence = toSentence(education, 3);
  const firstEligibilitySentence = toSentence(eligibilityLines, 3);

  return `## Editorial review

${title} at ${company} looks like a ${opportunityLabel} in ${location}. ${workModeSentence} ${intro}

${familyNotes[family]} ${
    firstSkillSentence
      ? `From the public listing, the most visible skill signals are ${firstSkillSentence}.`
      : "The role still needs a careful read on the employer side because the technical depth is not obvious from the title alone."
  } ${
    firstEducationSentence
      ? `Education relevance appears strongest for candidates with backgrounds in ${firstEducationSentence}.`
      : ""
  }

## Why this opening may be worth a closer look

- The listing suggests the team values ${firstResponsibilitySentence || "hands-on execution, teamwork, and reliable delivery"}.
- Experience is described as ${experience}, which means applicants should compare their current level honestly before applying.
- ${
    firstEligibilitySentence
      ? `Eligibility signals include ${firstEligibilitySentence}.`
      : "The employer page should be checked carefully for exact eligibility and hiring conditions."
  }
- Compensation is currently shown as "${salary}", so treat salary details as unconfirmed until the destination page states them clearly.

## Resume angle for this role

${resumeLead} For ${title}, the resume should make it easy to spot matching coursework, projects, tools, and outcomes in the first screen. ${
    firstSkillSentence
      ? `A stronger version would connect your profile to ${firstSkillSentence}.`
      : "If the skill requirements look broad, pick two or three areas where you can show real work and make those easy to verify."
  }

- Put one project, internship task, lab, or work example near the top that proves role-relevant execution.
- Use action language that matches the listing instead of vague phrases like "hardworking" or "quick learner" without evidence.
- If you have measurable results, add them. Even student projects become stronger when they show scale, accuracy, speed, automation, or customer impact.

tip: If you do not fully match every requirement, focus on the closest practical proof you already have instead of stretching the resume with weak claims.

## Verification notes before you apply

${verificationLead} Confirm the company name, location, timing, and application path on the official page. The current listing mentions ${jobTiming.toLowerCase()} for timing and ${workStyleLabel} for work style, but these details can change without notice.

warning: Do not treat this page as a hiring guarantee. If the destination page asks for unusual payments, private documents too early, or details that do not match ${company}, stop and verify the source first.`;
};

const overwrite = process.argv.includes("--overwrite");
let updatedCount = 0;

for (const [index, fileName] of targetFiles.entries()) {
  const filePath = path.join(jobsDir, fileName);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = parseFrontMatter(raw);

  if (!parsed || (parsed.body && !overwrite)) {
    continue;
  }

  const body = createBody(parsed.data, index);
  const updatedFile = `---\n${parsed.frontMatter}\n---\n\n${body}\n`;
  await fs.writeFile(filePath, updatedFile, "utf8");
  updatedCount += 1;
}

console.log(`Seeded editorial body content for ${updatedCount} job files.`);
