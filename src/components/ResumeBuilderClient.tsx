"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import ActionButton from "@/components/ActionButton";
import { siteName, siteUrl } from "@/lib/site";

type ResumeTemplateId = "classic" | "modern" | "focus" | "structured";
type ResumeBasics = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
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

const storageKey = "jobadvice-resume-builder-v1";

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

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

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
  templateId: "focus",
  basics: {
    fullName: "Aarav Sharma",
    headline: "Backend Developer Intern",
    email: "aarav.sharma@mail.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, India",
    website: "aaravsharma.dev",
    linkedin: "linkedin.com/in/aarav-sharma",
  },
  summary:
    "Early-career backend developer focused on Node.js, APIs, databases, and automation. Built project-ready web tools, improved query performance in academic work, and enjoys turning complex requirements into clean implementation plans.",
  skills:
    "Node.js, Express.js, TypeScript, REST APIs, PostgreSQL, MongoDB, Git, Docker, SQL, Problem Solving, Communication, Debugging",
  hobbies: "Open-source building, tech writing, mentoring juniors",
  optionalSections: {
    experience: true,
    certifications: true,
    hobbies: true,
  },
  experience: [
    {
      id: "experience-1",
      role: "Backend Developer Intern",
      company: "Campus Product Lab",
      location: "Remote",
      duration: "Jan 2026 - Present",
      bullets:
        "Built REST APIs in Node.js and Express for student project workflows.\nImproved SQL query response time by 28% through indexing and query cleanup.\nCollaborated with design and frontend contributors using Git-based review flow.",
    },
  ],
  education: [
    {
      id: "education-1",
      degree: "B.Tech in Computer Science",
      school: "SRM Institute of Science and Technology",
      year: "2023 - 2027",
      details: "CGPA: 8.7/10 • Relevant coursework: DBMS, Operating Systems, Data Structures",
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "Job Tracker Dashboard",
      link: "github.com/aarav/job-tracker",
      details:
        "Created a full-stack dashboard to track applications, deadlines, and interview stages using Node.js, PostgreSQL, and React.",
    },
    {
      id: "project-2",
      name: "Resume Keyword Checker",
      link: "resumecheck.aaravsharma.dev",
      details:
        "Built a keyword matching utility that compares resume text with job descriptions and highlights missing terms for ATS improvement.",
    },
  ],
  certifications: [
    {
      id: "certification-1",
      name: "Node.js Developer Certification",
      issuer: "Infosys Springboard",
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
}: {
  title: string;
  children: ReactNode;
  sectionKey?: string;
}) {
  return (
    <section
      className={joinClasses(
        "resume-preview-section",
        sectionKey && `resume-preview-section-${sectionKey}`,
      )}
    >
      <h3 className="resume-preview-section-title">{title}</h3>
      {children}
    </section>
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
    resume.basics.email.trim(),
    resume.basics.phone.trim(),
    resume.basics.location.trim(),
    resume.basics.website.trim(),
    resume.basics.linkedin.trim(),
  ].filter((item) => item.length > 0);

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

  const isStructuredTemplate = resume.templateId === "structured";
  const isClassicTemplate = resume.templateId === "classic";
  const currentTemplate = templateOptions.find((template) => template.id === resume.templateId);
  const previewSectionOrder =
    isStructuredTemplate
      ? ["summary", "skills", "education", "projects", "experience", "certifications", "hobbies"]
      : resume.templateId === "focus"
        ? ["summary", "projects", "skills", "education", "experience", "certifications", "hobbies"]
        : resume.templateId === "modern"
          ? ["summary", "skills", "projects", "education", "experience", "certifications", "hobbies"]
          : ["summary", "education", "skills", "projects", "experience", "certifications", "hobbies"];
  const printableSiteUrl = siteUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
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

  const previewSheet = (
    <div className="resume-preview-sheet">
      <div
        className={joinClasses(
          "resume-preview-brandline",
          isStructuredTemplate && "resume-preview-brandline-structured",
        )}
      >
        <span className="resume-preview-brandline-label">Built with</span>
        <span className="resume-preview-brandline-url">{printableSiteUrl}</span>
      </div>

      <header
        className={joinClasses(
          "resume-preview-header",
          isStructuredTemplate && "resume-preview-header-structured",
        )}
      >
        {hasPreviewIdentity ? (
          <div>
            {previewName ? <h2 className="resume-preview-name">{previewName}</h2> : null}
            {previewHeadline ? <p className="resume-preview-headline">{previewHeadline}</p> : null}
          </div>
        ) : (
          <div className="resume-preview-empty-hero">
            <p className="resume-preview-empty-title">Start with personal information</p>
            <p className="resume-preview-empty-copy">Your resume updates live as you type.</p>
          </div>
        )}
        {previewContactLines.length > 0 ? (
          <div className="resume-preview-contact">
            {previewContactLines.map((item) => (
              <span key={item}>{item}</span>
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
              <PreviewSection key={sectionKey} title="Summary" sectionKey="summary">
                <p
                  className={joinClasses(
                    "resume-preview-copy",
                    isStructuredTemplate && "resume-preview-copy-structured",
                  )}
                >
                  {resume.summary.trim()}
                </p>
              </PreviewSection>
            );
          }

          if (sectionKey === "skills" && skillItems.length > 0) {
            return (
              <PreviewSection key={sectionKey} title="Skills" sectionKey="skills">
                {isStructuredTemplate ? (
                  <div className="resume-preview-structured-table">
                    <div className="resume-preview-structured-row">
                      <span className="resume-preview-structured-label">Core</span>
                      <span className="resume-preview-structured-value">{skillItems.join(" | ")}</span>
                    </div>
                  </div>
                ) : (
                  <div className="resume-preview-skill-row">
                    {skillItems.map((skill) => (
                      <span
                        key={skill}
                        className={joinClasses(
                          "resume-preview-skill-pill",
                          isClassicTemplate && "resume-preview-skill-pill-classic",
                        )}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </PreviewSection>
            );
          }

          if (sectionKey === "education" && educationItems.length > 0) {
            return (
              <PreviewSection key={sectionKey} title="Education" sectionKey="education">
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
                          <p className="resume-preview-entry-title">{item.degree || "Degree"}</p>
                          <p className="resume-preview-entry-subtitle">
                            {isStructuredTemplate
                              ? item.school || "School / university"
                              : [item.school, item.details].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                        {item.year ? <span className="resume-preview-entry-meta">{item.year}</span> : null}
                      </div>
                      {isStructuredTemplate && item.details ? (
                        <p className="resume-preview-copy resume-preview-copy-structured">{item.details}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </PreviewSection>
            );
          }

          if (sectionKey === "projects" && projectItems.length > 0) {
            return (
              <PreviewSection key={sectionKey} title="Projects" sectionKey="projects">
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
                          <p className="resume-preview-entry-title">{item.name || "Project"}</p>
                          {item.link ? <p className="resume-preview-entry-subtitle">{item.link}</p> : null}
                        </div>
                      </div>
                      <ul className="resume-preview-list">
                        {splitMultilineText(item.details).map((bullet) => (
                          <li key={bullet}>{bullet}</li>
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
              <PreviewSection key={sectionKey} title="Experience" sectionKey="experience">
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
                          <p className="resume-preview-entry-title">{item.role || "Role"}</p>
                          <p className="resume-preview-entry-subtitle">
                            {[item.company, item.location].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                        {item.duration ? <span className="resume-preview-entry-meta">{item.duration}</span> : null}
                      </div>
                      <ul className="resume-preview-list">
                        {splitMultilineText(item.bullets).map((bullet) => (
                          <li key={bullet}>{bullet}</li>
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
              <PreviewSection key={sectionKey} title="Certifications" sectionKey="certifications">
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
                          <p className="resume-preview-entry-title">{item.name || "Certification"}</p>
                          {item.issuer ? <p className="resume-preview-entry-subtitle">{item.issuer}</p> : null}
                        </div>
                        {item.year ? <span className="resume-preview-entry-meta">{item.year}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            );
          }

          if (sectionKey === "hobbies" && showHobbiesPreview) {
            return (
              <PreviewSection key={sectionKey} title="Hobbies" sectionKey="hobbies">
                <div className="resume-preview-skill-row">
                  {hobbyItems.map((hobby) => (
                    <span
                      key={hobby}
                      className={joinClasses(
                        "resume-preview-skill-pill",
                        isClassicTemplate && "resume-preview-skill-pill-classic",
                      )}
                    >
                      {hobby}
                    </span>
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
            <h1 className="resume-builder-hero-title">Build your resume one section at a time.</h1>
            <p className="resume-builder-hero-text">
              Keep it simple on the left. Watch it update live on the right.
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
                      ATS-friendly, clean, and fresher-focused layouts.
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
                onClick={() => window.print()}
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
            <div className={joinClasses("resume-preview-card", `resume-preview-${resume.templateId}`)}>
              <div className="resume-preview-toolbar">
                <span className="resume-preview-toolbar-pill">{siteName} Resume</span>
                <span className="resume-preview-toolbar-note">{currentTemplate?.label}</span>
              </div>
              {previewSheet}
            </div>
          </div>
        </aside>
      </section>

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
                onClick={() => window.print()}
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
