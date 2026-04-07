export type LearnPracticeMode = "browser_preview" | "code_editor" | "writing_lab";

export type LearnPracticeFile = {
  name: string;
  label: string;
  language: string;
  starter: string;
  helperText?: string;
};

export type LearnPracticeCheck =
  | {
      id: string;
      label: string;
      type: "includes";
      value: string;
      file?: string;
      caseSensitive?: boolean;
    }
  | {
      id: string;
      label: string;
      type: "one_of";
      values: string[];
      file?: string;
      caseSensitive?: boolean;
    }
  | {
      id: string;
      label: string;
      type: "min_length";
      value: number;
      file?: string;
    };

export type LearnPracticeConfig = {
  title: string;
  summary: string;
  mode: LearnPracticeMode;
  instructions: string[];
  files: LearnPracticeFile[];
  checks: LearnPracticeCheck[];
  previewEntryFile?: string;
  previewStylesheetFile?: string;
  previewScriptFile?: string;
};

const practiceCatalog: Record<string, LearnPracticeConfig> = {
  "frontend-development/frontend-foundations/semantic-html-layout": {
    title: "Build a semantic landing page skeleton",
    summary: "Practice page structure before adding visual polish.",
    mode: "browser_preview",
    instructions: [
      "Use semantic blocks like header, main, section, article, and footer.",
      "Create a clear H1 and supporting section headings.",
      "Structure the page in a way that will be easy to style next.",
    ],
    files: [
      {
        name: "index.html",
        label: "HTML",
        language: "html",
        starter: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Frontend Foundations</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header>
      <nav>
        <a href="/">Frontend Studio</a>
      </nav>
    </header>

    <main>
      <section class="hero">
        <h1>Build better frontend foundations</h1>
        <p>Use semantic structure before you start styling the page.</p>
      </section>
    </main>

    <footer>
      <p>Start with structure, then add style.</p>
    </footer>
  </body>
</html>`,
      },
      {
        name: "styles.css",
        label: "CSS",
        language: "css",
        starter: `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 24px;
  background: #f8fafc;
  color: #0f172a;
}

.hero {
  padding: 24px;
  border-radius: 24px;
  background: white;
}`,
      },
    ],
    checks: [
      { id: "header", label: "Use a semantic header", type: "includes", file: "index.html", value: "<header" },
      { id: "main", label: "Use a main content area", type: "includes", file: "index.html", value: "<main" },
      { id: "section", label: "Create at least one section block", type: "includes", file: "index.html", value: "<section" },
      { id: "h1", label: "Include one H1 heading", type: "includes", file: "index.html", value: "<h1" },
    ],
    previewEntryFile: "index.html",
    previewStylesheetFile: "styles.css",
  },
  "frontend-development/frontend-foundations/responsive-css-systems": {
    title: "Style a responsive features section",
    summary: "Practice spacing rhythm, layout, and breakpoints on one polished block.",
    mode: "browser_preview",
    instructions: [
      "Use grid or flexbox for the main layout.",
      "Keep card padding and spacing consistent.",
      "Add a responsive rule or wrapping behavior for small screens.",
    ],
    files: [
      {
        name: "index.html",
        label: "HTML",
        language: "html",
        starter: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Responsive Section</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <section class="feature-grid">
      <article class="feature-card">
        <h2>Fast UI</h2>
        <p>Frontend systems that stay readable.</p>
      </article>
      <article class="feature-card">
        <h2>Stable Layout</h2>
        <p>Responsive structure across screen sizes.</p>
      </article>
      <article class="feature-card">
        <h2>Reusable Code</h2>
        <p>Components and spacing systems that scale.</p>
      </article>
    </section>
  </body>
</html>`,
      },
      {
        name: "styles.css",
        label: "CSS",
        language: "css",
        starter: `.feature-grid {
}

.feature-card {
}
`,
      },
    ],
    checks: [
      { id: "layout", label: "Use a layout system on the section", type: "one_of", file: "styles.css", values: ["display: grid", "display:grid", "display: flex", "display:flex"] },
      { id: "gap", label: "Add spacing between items", type: "one_of", file: "styles.css", values: ["gap:", "column-gap:", "row-gap:"] },
      { id: "padding", label: "Add padding inside the cards", type: "includes", file: "styles.css", value: "padding" },
      { id: "responsive", label: "Handle smaller screens with media queries or wrapping", type: "one_of", file: "styles.css", values: ["@media", "flex-wrap"] },
    ],
    previewEntryFile: "index.html",
    previewStylesheetFile: "styles.css",
  },
  "frontend-development/javascript-and-react-ui/dom-events-and-state": {
    title: "Build an interactive filter bar",
    summary: "Use JavaScript state and click handling to drive visible UI changes.",
    mode: "browser_preview",
    instructions: [
      "Track one active filter in JavaScript.",
      "Update the selected button state after each click.",
      "Render the current selection visibly in the UI.",
    ],
    files: [
      {
        name: "index.html",
        label: "HTML",
        language: "html",
        starter: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Filter State</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <section class="panel">
      <div class="filters">
        <button data-filter="All" class="is-active">All</button>
        <button data-filter="Frontend">Frontend</button>
        <button data-filter="Full Stack">Full Stack</button>
      </div>
      <p id="status">Showing: All</p>
    </section>
    <script src="script.js"></script>
  </body>
</html>`,
      },
      {
        name: "styles.css",
        label: "CSS",
        language: "css",
        starter: `body {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  background: #f8fafc;
}

.panel {
  width: min(560px, calc(100vw - 32px));
  padding: 24px;
  border-radius: 24px;
  background: white;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

button {
  padding: 10px 16px;
  border-radius: 999px;
}

.is-active {
  background: #0f766e;
  color: white;
}`,
      },
      {
        name: "script.js",
        label: "JavaScript",
        language: "javascript",
        starter: `const buttons = document.querySelectorAll("[data-filter]");
const statusLabel = document.querySelector("#status");

let activeFilter = "All";

buttons.forEach((button) => {
  button.addEventListener("click", () => {
  });
});`,
      },
    ],
    checks: [
      { id: "state", label: "Track active filter as state", type: "includes", file: "script.js", value: "activeFilter" },
      { id: "events", label: "Listen for button click events", type: "includes", file: "script.js", value: "addEventListener" },
      { id: "status", label: "Update the status label", type: "includes", file: "script.js", value: "statusLabel" },
      { id: "class", label: "Change active button styles in code", type: "one_of", file: "script.js", values: ["classList", "is-active"] },
    ],
    previewEntryFile: "index.html",
    previewStylesheetFile: "styles.css",
    previewScriptFile: "script.js",
  },
  "frontend-development/javascript-and-react-ui/react-components-and-props": {
    title: "Plan a reusable React card component",
    summary: "Practice component structure and prop design in a frontend-friendly way.",
    mode: "code_editor",
    instructions: [
      "Write a component signature with clear prop names.",
      "Show at least two uses with different data.",
      "Keep the component focused on one UI job.",
    ],
    files: [
      {
        name: "FeatureCard.jsx",
        label: "JSX",
        language: "jsx",
        starter: `function FeatureCard({ title, description, icon, ctaLabel }) {
  return (
    <article>
      <h3>{title}</h3>
      <p>{description}</p>
      <button>{ctaLabel}</button>
    </article>
  );
}

export default function FeaturesSection() {
  return (
    <section>
      <FeatureCard
        title="Reusable UI"
        description="Use the same card pattern for different frontend sections."
        icon="UI"
        ctaLabel="Explore"
      />
      <FeatureCard
        title="Faster Delivery"
        description="Strong component design makes pages easier to scale."
        icon="Speed"
        ctaLabel="Start"
      />
    </section>
  );
}`,
      },
    ],
    checks: [
      { id: "component", label: "Create a reusable component", type: "includes", file: "FeatureCard.jsx", value: "function FeatureCard" },
      { id: "props", label: "Use props in the component signature", type: "one_of", file: "FeatureCard.jsx", values: ["title", "description", "ctaLabel"] },
      { id: "usage", label: "Render the component more than once", type: "one_of", file: "FeatureCard.jsx", values: ["<FeatureCard", "<FeatureCard "] },
      { id: "button", label: "Expose CTA or label content through props", type: "includes", file: "FeatureCard.jsx", value: "ctaLabel" },
    ],
  },
  "nodejs-full-stack/backend-with-node-express/express-routing-and-controllers": {
    title: "Plan Express routes and controllers",
    summary: "Structure backend endpoints cleanly instead of mixing routing and business logic.",
    mode: "code_editor",
    instructions: [
      "Keep route definitions small and direct.",
      "Map each route to a controller function.",
      "Name the endpoints around real product actions.",
    ],
    files: [
      {
        name: "jobs.routes.js",
        label: "Routes",
        language: "javascript",
        starter: `const express = require("express");
const router = express.Router();
const jobsController = require("./jobs.controller");

// add list, details, create, and update routes here

module.exports = router;`,
      },
      {
        name: "jobs.controller.js",
        label: "Controller",
        language: "javascript",
        starter: `exports.listJobs = (req, res) => {
};

exports.getJobDetails = (req, res) => {
};

exports.createJob = (req, res) => {
};

exports.updateJob = (req, res) => {
};`,
      },
    ],
    checks: [
      { id: "router", label: "Use an Express router", type: "includes", file: "jobs.routes.js", value: "express.Router" },
      { id: "methods", label: "Define route methods", type: "one_of", file: "jobs.routes.js", values: ["router.get", "router.post", "router.patch", "router.put"] },
      { id: "controller-map", label: "Connect routes to controller functions", type: "includes", file: "jobs.routes.js", value: "jobsController" },
      { id: "exports", label: "Expose controller handlers", type: "includes", file: "jobs.controller.js", value: "exports." },
    ],
  },
  "nodejs-full-stack/backend-with-node-express/mongodb-modeling-and-crud": {
    title: "Design a MongoDB-backed jobs model",
    summary: "Practice schema thinking and CRUD planning around a real feature.",
    mode: "code_editor",
    instructions: [
      "Define fields that a jobs product actually needs.",
      "Think about one validation rule that matters.",
      "Tie the model to create/read/update/delete behavior.",
    ],
    files: [
      {
        name: "job.model.js",
        label: "Model",
        language: "javascript",
        starter: `const jobSchema = {
  title: "",
  company: "",
  location: "",
  status: "",
};

module.exports = jobSchema;`,
      },
      {
        name: "crud-plan.txt",
        label: "Plan",
        language: "text",
        starter: `Create:

Read:

Update:

Delete:`,
      },
    ],
    checks: [
      { id: "title", label: "Include a title field in the model", type: "includes", file: "job.model.js", value: "title" },
      { id: "company", label: "Include company or organization data", type: "one_of", file: "job.model.js", values: ["company", "organization"] },
      { id: "status", label: "Include status or publish state", type: "includes", file: "job.model.js", value: "status" },
      { id: "crud", label: "Outline the CRUD flow in writing", type: "min_length", file: "crud-plan.txt", value: 80 },
    ],
  },
  "nodejs-full-stack/react-with-node-apis/react-fetching-and-form-state": {
    title: "Plan a React create-job form flow",
    summary: "Think through local state, request state, and post-submit UI behavior.",
    mode: "writing_lab",
    instructions: [
      "List the fields your form should collect.",
      "Describe loading, success, and error states.",
      "Explain what should happen after a successful submit.",
    ],
    files: [
      {
        name: "form-flow.txt",
        label: "Flow",
        language: "text",
        starter: `Fields:

Loading state:

Success state:

Error state:

After submit:`,
      },
    ],
    checks: [
      { id: "length", label: "Write enough detail to make the flow usable", type: "min_length", file: "form-flow.txt", value: 140 },
      { id: "loading", label: "Mention loading behavior", type: "one_of", file: "form-flow.txt", values: ["loading", "spinner", "disabled"] },
      { id: "error", label: "Mention error handling", type: "includes", file: "form-flow.txt", value: "error" },
      { id: "success", label: "Mention success or refresh behavior", type: "one_of", file: "form-flow.txt", values: ["success", "refresh", "clear", "updated list"] },
    ],
  },
  "nodejs-full-stack/react-with-node-apis/dashboard-state-and-api-integration": {
    title: "Sketch a jobs dashboard state map",
    summary: "Organize search, filters, list selection, and editor behavior around backend data.",
    mode: "writing_lab",
    instructions: [
      "List the key frontend state values.",
      "Map the major user actions to backend endpoints.",
      "Describe how the UI refreshes after create or update actions.",
    ],
    files: [
      {
        name: "dashboard-plan.txt",
        label: "Plan",
        language: "text",
        starter: `State:

Actions:

API mapping:

Refresh flow:`,
      },
    ],
    checks: [
      { id: "length", label: "Write a full state and API plan", type: "min_length", file: "dashboard-plan.txt", value: 180 },
      { id: "state", label: "Mention filter, list, or selected-item state", type: "one_of", file: "dashboard-plan.txt", values: ["filter", "selected", "list", "search"] },
      { id: "api", label: "Map actions to API endpoints", type: "includes", file: "dashboard-plan.txt", value: "API" },
      { id: "refresh", label: "Explain refresh or update behavior", type: "one_of", file: "dashboard-plan.txt", values: ["refresh", "refetch", "update the list", "optimistic"] },
    ],
  },
  "java-full-stack/spring-boot-foundations/spring-boot-project-structure": {
    title: "Map a Spring Boot feature structure",
    summary: "Break one feature into controller, service, repository, and model responsibilities.",
    mode: "writing_lab",
    instructions: [
      "Name the classes or packages involved.",
      "Describe what each layer should own.",
      "Follow one request from controller to response.",
    ],
    files: [
      {
        name: "structure-plan.txt",
        label: "Plan",
        language: "text",
        starter: `Controller:

Service:

Repository:

Model:

Request flow:`,
      },
    ],
    checks: [
      { id: "length", label: "Write a complete structure plan", type: "min_length", file: "structure-plan.txt", value: 150 },
      { id: "controller", label: "Mention controller responsibility", type: "includes", file: "structure-plan.txt", value: "Controller" },
      { id: "service", label: "Mention service responsibility", type: "includes", file: "structure-plan.txt", value: "Service" },
      { id: "repository", label: "Mention repository responsibility", type: "includes", file: "structure-plan.txt", value: "Repository" },
    ],
  },
  "java-full-stack/spring-boot-foundations/rest-apis-services-and-repositories": {
    title: "Design a publish-status REST flow",
    summary: "Practice API design and clear service boundaries in Java backend work.",
    mode: "code_editor",
    instructions: [
      "Choose an endpoint and HTTP method that fit the action.",
      "Describe what the service validates.",
      "Keep persistence responsibility in the repository layer.",
    ],
    files: [
      {
        name: "PublishStatusFlow.java",
        label: "Java",
        language: "java",
        starter: `class JobController {
}

class JobService {
}

class JobRepository {
}`,
      },
    ],
    checks: [
      { id: "controller", label: "Create a controller layer", type: "includes", file: "PublishStatusFlow.java", value: "JobController" },
      { id: "service", label: "Create a service layer", type: "includes", file: "PublishStatusFlow.java", value: "JobService" },
      { id: "repository", label: "Create a repository layer", type: "includes", file: "PublishStatusFlow.java", value: "JobRepository" },
      { id: "method", label: "Add method or action names for the publish flow", type: "one_of", file: "PublishStatusFlow.java", values: ["publish", "updateStatus", "setPublished"] },
    ],
  },
  "java-full-stack/java-frontend-integration/react-consuming-java-apis": {
    title: "Plan a frontend screen for Java API data",
    summary: "Focus on response handling, render states, and data-driven UI structure.",
    mode: "writing_lab",
    instructions: [
      "Describe loading, empty, success, and error states.",
      "List the fields each job card should render.",
      "Explain how refresh or update behavior should work.",
    ],
    files: [
      {
        name: "frontend-plan.txt",
        label: "Plan",
        language: "text",
        starter: `Loading:

Empty:

Success:

Error:

Rendered fields:

Refresh behavior:`,
      },
    ],
    checks: [
      { id: "length", label: "Write a usable render-flow plan", type: "min_length", file: "frontend-plan.txt", value: 150 },
      { id: "states", label: "Mention multiple render states", type: "one_of", file: "frontend-plan.txt", values: ["Loading", "Empty", "Error", "Success"] },
      { id: "fields", label: "List job card fields", type: "one_of", file: "frontend-plan.txt", values: ["title", "company", "location", "status"] },
      { id: "refresh", label: "Explain how data refresh works", type: "includes", file: "frontend-plan.txt", value: "Refresh" },
    ],
  },
  "java-full-stack/java-frontend-integration/sql-and-deployment-basics": {
    title: "Create a Java full-stack deployment checklist",
    summary: "Tie together backend, database, and frontend delivery concerns.",
    mode: "writing_lab",
    instructions: [
      "List the environment values the project needs.",
      "Mention one database verification step.",
      "Mention one frontend or API check after deploy.",
    ],
    files: [
      {
        name: "launch-checklist.txt",
        label: "Checklist",
        language: "text",
        starter: `Environment:

Database:

API:

Frontend:

Post-deploy checks:`,
      },
    ],
    checks: [
      { id: "length", label: "Write a real launch checklist", type: "min_length", file: "launch-checklist.txt", value: 140 },
      { id: "env", label: "Mention environment configuration", type: "one_of", file: "launch-checklist.txt", values: ["ENV", "database url", "secret", "api url"] },
      { id: "db", label: "Mention the database layer", type: "one_of", file: "launch-checklist.txt", values: ["Database", "migration", "schema", "SQL"] },
      { id: "frontend", label: "Mention a frontend or response check", type: "one_of", file: "launch-checklist.txt", values: ["Frontend", "render", "API", "request"] },
    ],
  },
  "django-full-stack/django-core-foundations/django-project-app-structure": {
    title: "Plan a Django learning app structure",
    summary: "Practice the project/app split and feature boundaries inside Django.",
    mode: "writing_lab",
    instructions: [
      "Name the app and the features it owns.",
      "List the main modules inside the app.",
      "Describe one request flow from URL to view to template.",
    ],
    files: [
      {
        name: "django-app-plan.txt",
        label: "Plan",
        language: "text",
        starter: `Project:

App:

Main modules:

Request flow:`,
      },
    ],
    checks: [
      { id: "length", label: "Write a clear Django app plan", type: "min_length", file: "django-app-plan.txt", value: 130 },
      { id: "project", label: "Mention the project layer", type: "includes", file: "django-app-plan.txt", value: "Project" },
      { id: "app", label: "Mention the app layer", type: "includes", file: "django-app-plan.txt", value: "App" },
      { id: "flow", label: "Describe the request flow", type: "includes", file: "django-app-plan.txt", value: "Request flow" },
    ],
  },
  "django-full-stack/django-core-foundations/models-admin-and-orm-basics": {
    title: "Design a Django lesson model",
    summary: "Connect model fields, admin workflow, and ORM thinking in one exercise.",
    mode: "code_editor",
    instructions: [
      "Define fields a lesson record really needs.",
      "Think about ordering, publish state, and slugs.",
      "Add notes on admin use or ORM queries around the model.",
    ],
    files: [
      {
        name: "models.py",
        label: "Python",
        language: "python",
        starter: `class Lesson:
    title = ""
    slug = ""
    summary = ""
`,
      },
      {
        name: "admin_notes.txt",
        label: "Admin Notes",
        language: "text",
        starter: `Admin workflow:

Useful ORM query:`,
      },
    ],
    checks: [
      { id: "title", label: "Include a title field", type: "includes", file: "models.py", value: "title" },
      { id: "slug", label: "Include a slug field", type: "includes", file: "models.py", value: "slug" },
      { id: "status", label: "Include publish state or ordering concerns", type: "one_of", file: "models.py", values: ["status", "published", "order", "position"] },
      { id: "admin", label: "Write admin or ORM notes", type: "min_length", file: "admin_notes.txt", value: 60 },
    ],
  },
  "django-full-stack/django-frontend-and-delivery/templates-forms-and-static-assets": {
    title: "Plan a Django contact form page",
    summary: "Tie template structure, form submission, and static assets into one product page.",
    mode: "writing_lab",
    instructions: [
      "Describe the template sections the page needs.",
      "Explain GET and POST flow clearly.",
      "Mention validation and success states.",
    ],
    files: [
      {
        name: "contact-page-plan.txt",
        label: "Plan",
        language: "text",
        starter: `Template sections:

GET flow:

POST flow:

Validation errors:

Success state:

Static assets:`,
      },
    ],
    checks: [
      { id: "length", label: "Write a complete template and form plan", type: "min_length", file: "contact-page-plan.txt", value: 150 },
      { id: "get", label: "Mention GET flow", type: "includes", file: "contact-page-plan.txt", value: "GET" },
      { id: "post", label: "Mention POST flow", type: "includes", file: "contact-page-plan.txt", value: "POST" },
      { id: "static", label: "Mention static assets", type: "one_of", file: "contact-page-plan.txt", values: ["Static", "CSS", "image", "script"] },
    ],
  },
  "django-full-stack/django-frontend-and-delivery/api-and-deployment-path": {
    title: "Create a Django launch checklist",
    summary: "Think through delivery, environment setup, and product checks beyond localhost.",
    mode: "writing_lab",
    instructions: [
      "List environment and host configuration concerns.",
      "Mention database and static-file setup.",
      "Call out one live behavior to verify after deploy.",
    ],
    files: [
      {
        name: "django-launch-checklist.txt",
        label: "Checklist",
        language: "text",
        starter: `Environment:

Hosts and security:

Database:

Static files:

Live verification:`,
      },
    ],
    checks: [
      { id: "length", label: "Write a practical launch checklist", type: "min_length", file: "django-launch-checklist.txt", value: 140 },
      { id: "env", label: "Mention environment or secret configuration", type: "one_of", file: "django-launch-checklist.txt", values: ["environment", "secret", "allowed hosts", "env"] },
      { id: "db", label: "Mention the database layer", type: "one_of", file: "django-launch-checklist.txt", values: ["database", "migration", "postgres", "schema"] },
      { id: "static", label: "Mention static file handling", type: "one_of", file: "django-launch-checklist.txt", values: ["static", "media", "collectstatic"] },
    ],
  },
};

export const getLearnPractice = (
  trackSlug: string,
  courseSlug: string,
  lessonSlug: string,
) => practiceCatalog[`${trackSlug}/${courseSlug}/${lessonSlug}`] || null;
