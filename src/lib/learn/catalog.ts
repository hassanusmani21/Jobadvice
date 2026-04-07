export type LearnLesson = {
  slug: string;
  title: string;
  summary: string;
  durationMinutes: number;
  goals: string[];
  contentBlocks: Array<{
    title: string;
    paragraphs: string[];
  }>;
  quickCheck: string[];
  assignment: {
    title: string;
    brief: string;
    tasks: string[];
    deliverable: string;
  };
};

export type LearnCourse = {
  slug: string;
  title: string;
  summary: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  estimatedHours: number;
  outcome: string;
  skills: string[];
  lessons: LearnLesson[];
};

export type LearnTrack = {
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  estimatedHours: number;
  outcome: string;
  skills: string[];
  courses: LearnCourse[];
};

const learnCatalog: LearnTrack[] = [
  {
    slug: "frontend-development",
    title: "Frontend Development",
    tagline: "Start with clean UI structure, styling, interaction, and React thinking.",
    summary:
      "A focused frontend track covering semantic HTML, CSS systems, interactive JavaScript, and the component mindset needed for modern product work.",
    level: "Beginner",
    estimatedHours: 20,
    outcome: "Build polished responsive pages and step confidently into React-based frontend work.",
    skills: ["HTML", "CSS", "JavaScript", "React"],
    courses: [
      {
        slug: "frontend-foundations",
        title: "Frontend Foundations",
        summary:
          "Learn structure, spacing, layout, and responsive behavior before moving into frameworks.",
        level: "Beginner",
        estimatedHours: 9,
        outcome: "Create stable landing sections, reusable cards, and responsive layouts with confidence.",
        skills: ["Semantic HTML", "CSS Layout", "Spacing Systems", "Responsive Design"],
        lessons: [
          {
            slug: "semantic-html-layout",
            title: "Semantic HTML Layout",
            summary: "Learn how to structure real pages with clear sections, headings, and reusable content blocks.",
            durationMinutes: 22,
            goals: [
              "Use semantic tags like header, main, section, article, and footer correctly.",
              "Break a page into meaningful blocks before touching styling.",
              "Write markup that is easier to style, maintain, and explain later.",
            ],
            contentBlocks: [
              {
                title: "Structure before style",
                paragraphs: [
                  "A messy frontend usually starts with messy HTML. When the structure is clear, your CSS becomes simpler and your responsive rules stop fighting each other.",
                  "Semantic markup also helps accessibility and makes your page easier to read for teammates, browsers, and future you.",
                ],
              },
              {
                title: "Think in reusable sections",
                paragraphs: [
                  "Most product pages are made from repeatable blocks: hero, feature list, testimonials, pricing, FAQ, and footer. Build those blocks intentionally.",
                  "That habit becomes important later when you move into component-based systems like React.",
                ],
              },
            ],
            quickCheck: [
              "Why is semantic HTML better than wrapping every block in a generic div?",
              "When should you use an article element inside a section?",
              "How does clean HTML reduce CSS problems later?",
            ],
            assignment: {
              title: "Build a product landing skeleton",
              brief:
                "Create a clean landing page structure for a developer product with header, hero, features, pricing, and footer sections.",
              tasks: [
                "Use semantic tags for the main blocks.",
                "Add one strong H1 and supportive section headings.",
                "Include at least three repeated feature items inside a reusable section.",
              ],
              deliverable: "A single HTML page with a clean semantic structure ready for styling.",
            },
          },
          {
            slug: "responsive-css-systems",
            title: "Responsive CSS Systems",
            summary: "Use spacing, layout rules, and breakpoints deliberately instead of styling by guesswork.",
            durationMinutes: 26,
            goals: [
              "Choose a repeatable spacing rhythm instead of random values.",
              "Use flexbox or grid where each one fits best.",
              "Make a section work well on desktop, tablet, and mobile widths.",
            ],
            contentBlocks: [
              {
                title: "Spacing creates polish",
                paragraphs: [
                  "A lot of frontends look unprofessional because spacing changes randomly from one section to the next. Consistency matters more than decoration.",
                  "Padding, margin, gap, and max-width should feel like a system, not a series of lucky numbers.",
                ],
              },
              {
                title: "Responsive design is planning, not patching",
                paragraphs: [
                  "If your layout only works at one screen width, it is not finished. Decide how cards wrap, how text widths shrink, and how buttons stack before the page breaks.",
                  "That makes your UI more reliable and reduces last-minute CSS fixes later.",
                ],
              },
            ],
            quickCheck: [
              "What is the practical difference between padding and gap?",
              "When is grid better than flexbox for a layout?",
              "Why should responsive behavior be planned early instead of patched later?",
            ],
            assignment: {
              title: "Style a responsive card section",
              brief:
                "Take a plain section with three cards and turn it into a polished responsive layout with consistent spacing and readable typography.",
              tasks: [
                "Use one layout system for the card container.",
                "Apply a repeatable spacing rhythm across cards and buttons.",
                "Make the section wrap or stack cleanly on smaller screens.",
              ],
              deliverable: "A responsive card section that looks stable across screen sizes.",
            },
          },
        ],
      },
      {
        slug: "javascript-and-react-ui",
        title: "JavaScript and React UI",
        summary:
          "Move from static pages to interface logic, UI state, and reusable component thinking.",
        level: "Beginner",
        estimatedHours: 11,
        outcome: "Build interactive UI pieces and understand the frontend patterns used in React apps.",
        skills: ["DOM", "Events", "UI State", "React Components"],
        lessons: [
          {
            slug: "dom-events-and-state",
            title: "DOM Events and State",
            summary: "Use JavaScript to react to clicks, update content, and keep small UI state organized.",
            durationMinutes: 24,
            goals: [
              "Connect user actions to visible interface changes.",
              "Track simple UI state instead of editing many nodes blindly.",
              "Build toggles, counters, and filters that feel responsive.",
            ],
            contentBlocks: [
              {
                title: "Events are user intent",
                paragraphs: [
                  "Most frontend interaction starts with one simple rule: the user did something, so the interface should respond clearly. That might be a click, a tab change, or a filter selection.",
                  "Good event handling keeps the logic small and predictable. One action should change only the state that actually matters.",
                ],
              },
              {
                title: "State keeps the UI honest",
                paragraphs: [
                  "If only one tab should be active or one filter should be selected, model that as state instead of manually patching many classes every time.",
                  "That same mindset carries directly into React later.",
                ],
              },
            ],
            quickCheck: [
              "What makes a click handler easier to maintain?",
              "Why is it useful to store the current UI state in a variable?",
              "When should JavaScript control the interface instead of only CSS?",
            ],
            assignment: {
              title: "Build a dashboard filter bar",
              brief:
                "Create three filter buttons and a status label so the UI clearly reflects the current selection.",
              tasks: [
                "Track the active filter in one variable.",
                "Update the selected button style after each click.",
                "Render the selected filter text visibly on the page.",
              ],
              deliverable: "A small interactive filter component with clear state-driven behavior.",
            },
          },
          {
            slug: "react-components-and-props",
            title: "React Components and Props",
            summary: "Learn how frontend teams split screens into reusable pieces and pass data clearly.",
            durationMinutes: 28,
            goals: [
              "Think in components instead of one giant page file.",
              "Pass data through props with clear naming.",
              "Spot the difference between reusable UI and hardcoded markup.",
            ],
            contentBlocks: [
              {
                title: "Components reduce repetition",
                paragraphs: [
                  "If the same card, badge, or button appears multiple times, that is a sign it should become a component. Reuse keeps the UI cleaner and easier to update.",
                  "A component should have one clear job and receive the data it needs through props.",
                ],
              },
              {
                title: "Props are input, not mystery state",
                paragraphs: [
                  "Props make component behavior explicit. Instead of hiding values deep in the file, you pass the title, description, status, or action label from the parent.",
                  "That makes components easier to reason about and easier to test.",
                ],
              },
            ],
            quickCheck: [
              "When should repeated markup become a component?",
              "Why are props useful for reusable UI?",
              "What happens when a component tries to do too many unrelated jobs?",
            ],
            assignment: {
              title: "Design a reusable feature card API",
              brief:
                "Plan a React feature card component that accepts props for title, description, icon, and CTA label.",
              tasks: [
                "List the props the card should accept.",
                "Write one component signature.",
                "Show two uses with different card content.",
              ],
              deliverable: "A clean component plan showing reusable props and clear usage.",
            },
          },
        ],
      },
    ],
  },
  {
    slug: "nodejs-full-stack",
    title: "Node.js Full Stack",
    tagline: "Build JavaScript across the frontend, backend, database, and API layer.",
    summary:
      "A full-stack JavaScript path covering Express APIs, database CRUD, and the frontend patterns needed to connect React to a Node backend.",
    level: "Beginner",
    estimatedHours: 22,
    outcome: "Understand the full request flow from frontend UI to backend routes, database logic, and response handling.",
    skills: ["Node.js", "Express", "MongoDB", "React", "REST APIs"],
    courses: [
      {
        slug: "backend-with-node-express",
        title: "Backend With Node and Express",
        summary:
          "Learn how routes, controllers, services, and persistence fit together in a Node backend.",
        level: "Beginner",
        estimatedHours: 10,
        outcome: "Build a small Express backend with clear route structure and basic CRUD flow.",
        skills: ["Express Routing", "Controllers", "CRUD", "MongoDB"],
        lessons: [
          {
            slug: "express-routing-and-controllers",
            title: "Express Routing and Controllers",
            summary: "Understand how requests move from route definitions into focused controller logic.",
            durationMinutes: 24,
            goals: [
              "Separate route setup from business logic.",
              "Understand the job of req, res, and controller functions.",
              "Keep backend files organized as the app grows.",
            ],
            contentBlocks: [
              {
                title: "Routes should stay thin",
                paragraphs: [
                  "If route files become full of business logic, the backend gets hard to maintain quickly. A cleaner pattern is to route the request and let controllers handle the work.",
                  "That keeps your API structure readable and makes testing easier later.",
                ],
              },
              {
                title: "Controllers turn HTTP into app logic",
                paragraphs: [
                  "Controllers receive the request, read parameters, call the next layer, and return a response. They should understand the API contract without becoming a dumping ground for every concern.",
                  "This structure matters in real projects because features grow faster than beginners expect.",
                ],
              },
            ],
            quickCheck: [
              "Why should routes stay thinner than controllers?",
              "What is the responsibility of a controller in Express?",
              "How does file separation help when the project grows?",
            ],
            assignment: {
              title: "Plan a jobs API route set",
              brief:
                "Design the route and controller structure for a jobs module with list, details, create, and update actions.",
              tasks: [
                "List the endpoints you need.",
                "Map each endpoint to a controller function name.",
                "Explain what each controller should return.",
              ],
              deliverable: "A simple Express route-to-controller plan for a jobs module.",
            },
          },
          {
            slug: "mongodb-modeling-and-crud",
            title: "MongoDB Modeling and CRUD",
            summary: "Model basic data and connect create, read, update, and delete flow to the backend.",
            durationMinutes: 28,
            goals: [
              "Think about document shape before writing handlers.",
              "Understand CRUD operations in practical backend work.",
              "Keep simple schema choices aligned with frontend needs.",
            ],
            contentBlocks: [
              {
                title: "Data shape affects everything",
                paragraphs: [
                  "A weak model creates pain later in both backend code and frontend rendering. Start by deciding what one job, user, or project document should actually contain.",
                  "That makes route design and validation more predictable.",
                ],
              },
              {
                title: "CRUD is the core workflow",
                paragraphs: [
                  "Most admin panels and dashboards are CRUD systems at the core: create records, read them, update them, and delete or archive them when needed.",
                  "Understanding that cycle clearly is more valuable than memorizing random methods.",
                ],
              },
            ],
            quickCheck: [
              "Why should you decide document shape before building every endpoint?",
              "What does CRUD cover in a practical app?",
              "How does backend data shape affect frontend rendering?",
            ],
            assignment: {
              title: "Design a jobs collection",
              brief:
                "Define a MongoDB job document for a hiring platform and explain the CRUD operations your API will support.",
              tasks: [
                "List the main fields in the document.",
                "Describe one create, one read, one update, and one delete action.",
                "Call out one validation rule that matters.",
              ],
              deliverable: "A small MongoDB model plan with CRUD behavior mapped around it.",
            },
          },
        ],
      },
      {
        slug: "react-with-node-apis",
        title: "React With Node APIs",
        summary:
          "Connect a frontend to backend endpoints and structure a simple dashboard experience around async data.",
        level: "Beginner",
        estimatedHours: 12,
        outcome: "Fetch backend data confidently, manage forms, and structure an admin-style frontend flow.",
        skills: ["React Data Fetching", "Forms", "Async State", "Dashboard UI"],
        lessons: [
          {
            slug: "react-fetching-and-form-state",
            title: "React Fetching and Form State",
            summary: "Move data between forms, frontend state, and backend APIs without losing clarity.",
            durationMinutes: 26,
            goals: [
              "Handle loading, success, and error states clearly.",
              "Keep form input state predictable.",
              "Connect a frontend action to a backend endpoint thoughtfully.",
            ],
            contentBlocks: [
              {
                title: "Async UI needs visible states",
                paragraphs: [
                  "Users should know when the UI is loading, when a request succeeds, and when something failed. Silent async work makes dashboards feel broken.",
                  "Good state naming helps here more than fancy abstractions do.",
                ],
              },
              {
                title: "Forms are data pipelines",
                paragraphs: [
                  "A form is not only markup. It is a flow from user input to local state to an API request and then back into visible feedback.",
                  "If you think in that pipeline, full-stack frontend work becomes much easier to reason about.",
                ],
              },
            ],
            quickCheck: [
              "Why should loading and error states be explicit in the UI?",
              "What makes form state easier to reason about?",
              "How does a submit flow move from the frontend to the backend and back?",
            ],
            assignment: {
              title: "Plan a create-job form flow",
              brief:
                "Outline the frontend behavior for a create-job form that sends data to a Node API and then updates the UI.",
              tasks: [
                "List the key form fields you need.",
                "Describe loading, success, and error states.",
                "Explain what the UI should do after a successful submit.",
              ],
              deliverable: "A clean React form-state plan connected to a backend request flow.",
            },
          },
          {
            slug: "dashboard-state-and-api-integration",
            title: "Dashboard State and API Integration",
            summary: "Organize lists, filters, and action panels in a frontend that depends on backend data.",
            durationMinutes: 28,
            goals: [
              "Break a dashboard into reusable UI sections.",
              "Keep list, filter, and selected-item state separate.",
              "Plan how frontend actions map to backend endpoints.",
            ],
            contentBlocks: [
              {
                title: "Dashboards are state-heavy frontends",
                paragraphs: [
                  "Dashboards often juggle filters, list views, forms, and result panels at the same time. That is why clean state boundaries matter.",
                  "You do not want one click to unpredictably affect everything else on the screen.",
                ],
              },
              {
                title: "Map UI actions to backend actions",
                paragraphs: [
                  "Every button in the dashboard should have a clear backend meaning: fetch records, update status, create entry, or archive something.",
                  "This mapping helps you design both the UI and the API with less confusion.",
                ],
              },
            ],
            quickCheck: [
              "Why is it useful to separate filter state from selected-item state?",
              "How do dashboards become hard to maintain when state is mixed together?",
              "Why should frontend actions map clearly to backend endpoints?",
            ],
            assignment: {
              title: "Sketch a jobs dashboard flow",
              brief:
                "Plan the state and API interactions for a jobs workspace with search, status filters, entry list, and an editor panel.",
              tasks: [
                "List the major UI state values.",
                "Map at least four frontend actions to backend endpoints.",
                "Describe how the UI should refresh after a record update.",
              ],
              deliverable: "A dashboard interaction plan showing clear state and API flow.",
            },
          },
        ],
      },
    ],
  },
  {
    slug: "java-full-stack",
    title: "Java Full Stack",
    tagline: "Learn the backend rigor of Java and the frontend integration patterns around it.",
    summary:
      "A Java full-stack path built around Spring Boot, relational thinking, API design, and the frontend workflow needed to consume Java services cleanly.",
    level: "Beginner",
    estimatedHours: 22,
    outcome: "Understand how enterprise-style backend structure connects to modern frontend applications.",
    skills: ["Java", "Spring Boot", "REST APIs", "SQL", "React"],
    courses: [
      {
        slug: "spring-boot-foundations",
        title: "Spring Boot Foundations",
        summary:
          "Learn the layers, classes, and API patterns that make Java backend projects feel organized instead of intimidating.",
        level: "Beginner",
        estimatedHours: 10,
        outcome: "Read and shape a simple Spring Boot project with controller, service, repository, and model layers.",
        skills: ["Controllers", "Services", "Repositories", "Entity Design"],
        lessons: [
          {
            slug: "spring-boot-project-structure",
            title: "Spring Boot Project Structure",
            summary: "Understand the file and class layout that keeps Java backend projects readable.",
            durationMinutes: 25,
            goals: [
              "Recognize the purpose of controller, service, repository, and model packages.",
              "Understand how classes flow through a request lifecycle.",
              "Reduce confusion by seeing the app as connected layers.",
            ],
            contentBlocks: [
              {
                title: "Java projects need structure early",
                paragraphs: [
                  "Java full-stack work feels heavier than small script projects because the code is split into more layers on purpose. That structure becomes useful as the codebase grows.",
                  "Once you understand the job of each layer, Spring Boot starts to feel much less intimidating.",
                ],
              },
              {
                title: "Follow the request path",
                paragraphs: [
                  "A request enters the controller, flows into the service layer, may touch a repository, and finally returns a response object. That path is the backbone of the backend.",
                  "Thinking in that flow helps you debug and design features more clearly.",
                ],
              },
            ],
            quickCheck: [
              "What is the purpose of the service layer in a Spring Boot app?",
              "Why do Java backends split work across multiple packages?",
              "How does a request typically move through the backend?",
            ],
            assignment: {
              title: "Map a Spring Boot feature flow",
              brief:
                "Outline the classes and methods needed for a job-posting feature in a Spring Boot application.",
              tasks: [
                "Name the controller, service, repository, and model classes.",
                "Describe what each layer should do.",
                "Show how data would move from request to response.",
              ],
              deliverable: "A class-level plan for one Spring Boot feature.",
            },
          },
          {
            slug: "rest-apis-services-and-repositories",
            title: "REST APIs, Services, and Repositories",
            summary: "Connect backend layers together and shape clean API endpoints around business logic.",
            durationMinutes: 28,
            goals: [
              "Keep REST endpoints aligned with real app actions.",
              "Understand why services should own business rules.",
              "Use repositories as persistence access instead of mixing DB logic everywhere.",
            ],
            contentBlocks: [
              {
                title: "REST should mirror real features",
                paragraphs: [
                  "Good API endpoints are shaped around what the product actually needs, not around random technical convenience. That makes frontend integration smoother too.",
                  "An endpoint should read like an app capability: list jobs, create job, update status, archive record.",
                ],
              },
              {
                title: "Repositories are not business logic",
                paragraphs: [
                  "The repository layer should focus on data access. Validation, rules, and feature behavior belong in services so your app remains easier to change.",
                  "That separation becomes more valuable as features become more complex.",
                ],
              },
            ],
            quickCheck: [
              "Why should business rules stay out of repository classes?",
              "What makes an API endpoint feel aligned with the product?",
              "How does clean service design help frontend developers too?",
            ],
            assignment: {
              title: "Design a job status update API",
              brief:
                "Plan the endpoint, service method, and repository interaction for changing a job record from draft to published.",
              tasks: [
                "Define the endpoint and HTTP method.",
                "Explain what validation belongs in the service.",
                "Describe what the repository should update.",
              ],
              deliverable: "A small REST flow design for a publish action.",
            },
          },
        ],
      },
      {
        slug: "java-frontend-integration",
        title: "Java Frontend Integration",
        summary:
          "Focus on how frontend apps consume Java APIs and how database-backed backend features shape the UI.",
        level: "Beginner",
        estimatedHours: 12,
        outcome: "Connect React or admin-style frontends to Java APIs and think through data-backed screens more clearly.",
        skills: ["Frontend Integration", "Async UI", "SQL Thinking", "Delivery Flow"],
        lessons: [
          {
            slug: "react-consuming-java-apis",
            title: "React Consuming Java APIs",
            summary: "Plan how a frontend requests, renders, and updates data coming from Spring Boot services.",
            durationMinutes: 24,
            goals: [
              "Understand the response flow from Java backend to frontend UI.",
              "Handle loading, empty, and error states clearly.",
              "Translate backend response shapes into understandable frontend components.",
            ],
            contentBlocks: [
              {
                title: "API shape affects UI shape",
                paragraphs: [
                  "A frontend becomes easier to build when the backend response is consistent and predictable. Field names, nesting, and list shape all matter.",
                  "That is why frontend and backend thinking should stay connected even when they live in separate layers.",
                ],
              },
              {
                title: "Render states matter as much as the fetch call",
                paragraphs: [
                  "Fetching data is the easy part. A professional frontend also needs a clear empty state, a helpful loading state, and visible error handling.",
                  "Those states are what make data-heavy screens feel stable.",
                ],
              },
            ],
            quickCheck: [
              "Why does backend response shape influence frontend component design?",
              "What render states should a data screen handle well?",
              "How can predictable API responses reduce frontend complexity?",
            ],
            assignment: {
              title: "Plan a jobs list frontend",
              brief:
                "Design the frontend state and render flow for a jobs list screen powered by a Spring Boot API.",
              tasks: [
                "Describe the loading, empty, success, and error states.",
                "List the fields each job card should display.",
                "Explain how the screen should react after a refresh or update.",
              ],
              deliverable: "A frontend data-flow plan for a Java-backed jobs screen.",
            },
          },
          {
            slug: "sql-and-deployment-basics",
            title: "SQL and Deployment Basics",
            summary: "Connect database thinking and deployment awareness to the full-stack workflow.",
            durationMinutes: 26,
            goals: [
              "Understand why relational data design matters in Java projects.",
              "Think about environment setup and deployment flow early.",
              "See how persistence and delivery affect the whole stack.",
            ],
            contentBlocks: [
              {
                title: "Relational thinking shapes backend design",
                paragraphs: [
                  "Java full-stack work often lives with SQL-backed systems. Entities, relationships, and query patterns affect service logic and frontend needs.",
                  "You do not need deep database theory to start, but you do need to think clearly about how records connect.",
                ],
              },
              {
                title: "Deployment is part of the product",
                paragraphs: [
                  "A feature is not done when it works only on localhost. Environment variables, database access, build flow, and API URLs all affect whether the app truly ships.",
                  "That awareness makes you much more effective as a full-stack developer.",
                ],
              },
            ],
            quickCheck: [
              "Why do entity relationships matter before you even write every query?",
              "What environment details can break a full-stack app at deploy time?",
              "Why should database design and frontend needs stay connected?",
            ],
            assignment: {
              title: "Outline a deployment checklist",
              brief:
                "Create a simple launch checklist for a Java full-stack feature that includes frontend, backend, and database concerns.",
              tasks: [
                "List the environment values the app depends on.",
                "Call out one database check and one API check.",
                "Mention one frontend behavior to verify after deployment.",
              ],
              deliverable: "A practical deployment checklist for a Java full-stack feature.",
            },
          },
        ],
      },
    ],
  },
  {
    slug: "django-full-stack",
    title: "Django Full Stack",
    tagline: "Build with Python, Django apps, templates, forms, and data-backed product flow.",
    summary:
      "A Django full-stack path that covers project structure, models, ORM thinking, templates, forms, and the delivery flow needed to ship Python web applications.",
    level: "Beginner",
    estimatedHours: 21,
    outcome: "Understand how Django ties backend logic, rendered frontend pages, and data models together in one practical stack.",
    skills: ["Python", "Django", "Templates", "ORM", "PostgreSQL"],
    courses: [
      {
        slug: "django-core-foundations",
        title: "Django Core Foundations",
        summary:
          "Learn how Django projects are organized and how models, admin, and ORM queries support product features.",
        level: "Beginner",
        estimatedHours: 10,
        outcome: "Build a mental model for Django apps, data modeling, and admin-backed workflows.",
        skills: ["Project Structure", "Apps", "Models", "Admin", "ORM"],
        lessons: [
          {
            slug: "django-project-app-structure",
            title: "Django Project and App Structure",
            summary: "Understand the project/app split and how Django organizes features cleanly.",
            durationMinutes: 24,
            goals: [
              "Understand the difference between a Django project and a Django app.",
              "Recognize where settings, URLs, views, and templates fit.",
              "Organize a feature as a coherent app instead of random files.",
            ],
            contentBlocks: [
              {
                title: "Projects hold apps, apps hold features",
                paragraphs: [
                  "A Django project is the overall site configuration, while each app groups a specific feature area. That separation helps large products stay manageable.",
                  "Once you see that clearly, Django feels much more systematic.",
                ],
              },
              {
                title: "Feature boundaries matter",
                paragraphs: [
                  "Jobs, blog, accounts, or learning modules can each live as separate apps. That helps URL structure, views, templates, and models stay easier to reason about.",
                  "It is one of the reasons Django scales well for structured products.",
                ],
              },
            ],
            quickCheck: [
              "What is the difference between a Django project and a Django app?",
              "Why is app-level organization useful in a growing product?",
              "Where do views and URL patterns fit into the request flow?",
            ],
            assignment: {
              title: "Plan a learn app structure",
              brief:
                "Design the app-level structure for a Django learning module with lessons, assignments, and practice pages.",
              tasks: [
                "Name the app and the feature responsibilities it owns.",
                "List the main files or modules you expect inside it.",
                "Describe one request flow from URL to rendered response.",
              ],
              deliverable: "A clean Django app plan for one product feature area.",
            },
          },
          {
            slug: "models-admin-and-orm-basics",
            title: "Models, Admin, and ORM Basics",
            summary: "Use Django’s model layer and admin surface to manage product data more effectively.",
            durationMinutes: 28,
            goals: [
              "Model data cleanly around real product records.",
              "Understand how the admin can accelerate content and data workflows.",
              "Use ORM-style thinking to read and update data safely.",
            ],
            contentBlocks: [
              {
                title: "Models define the product data",
                paragraphs: [
                  "A strong Django model gives shape to the feature. Titles, status, publish dates, relationships, and validation rules all influence the rest of the app.",
                  "If the model is weak, templates and views become harder to maintain.",
                ],
              },
              {
                title: "Admin is a workflow tool",
                paragraphs: [
                  "Django admin is not only a convenience. It can become the fastest way to review, edit, and manage structured records while the product is still evolving.",
                  "That makes it especially useful for content-heavy internal tools.",
                ],
              },
            ],
            quickCheck: [
              "Why should model fields reflect real product needs rather than vague field ideas?",
              "How can Django admin speed up a workflow?",
              "What does ORM thinking help you avoid compared with writing everything manually?",
            ],
            assignment: {
              title: "Design a lesson model",
              brief:
                "Define a Django model for a lesson record that supports title, slug, summary, publish status, and ordering.",
              tasks: [
                "List the important fields and one validation concern.",
                "Explain how the admin might help manage these records.",
                "Describe one ORM query you would need on a lessons page.",
              ],
              deliverable: "A Django lesson model plan with admin and query considerations.",
            },
          },
        ],
      },
      {
        slug: "django-frontend-and-delivery",
        title: "Django Frontend and Delivery",
        summary:
          "Focus on the rendered frontend side of Django, including templates, forms, static assets, and deployment awareness.",
        level: "Beginner",
        estimatedHours: 11,
        outcome: "Render clean Django pages, handle form flow, and think through how the app ships beyond localhost.",
        skills: ["Templates", "Forms", "Static Files", "Deployment"],
        lessons: [
          {
            slug: "templates-forms-and-static-assets",
            title: "Templates, Forms, and Static Assets",
            summary: "Tie Django views to rendered UI, user input, and frontend assets in one coherent flow.",
            durationMinutes: 26,
            goals: [
              "Understand how views pass data into templates.",
              "Handle form submission and validation flow clearly.",
              "Use static files as part of the rendered frontend layer.",
            ],
            contentBlocks: [
              {
                title: "Templates are the frontend layer in classic Django",
                paragraphs: [
                  "Django templates let you build real product pages without separating everything into a different frontend app. That can be fast and powerful when the project fits it.",
                  "Good template structure still needs the same frontend discipline: clean sections, readable data, and reusable patterns.",
                ],
              },
              {
                title: "Forms need clear request flow",
                paragraphs: [
                  "A form is not complete when it only renders. You need to think through GET, POST, validation, errors, success feedback, and what the user sees next.",
                  "That full request cycle is a big part of Django product work.",
                ],
              },
            ],
            quickCheck: [
              "How does a Django view pass information into a template?",
              "What steps happen in a clean form submission flow?",
              "Why should template structure still follow good frontend habits?",
            ],
            assignment: {
              title: "Plan a contact form page",
              brief:
                "Outline the template, view, form behavior, and static assets for a clean Django contact page.",
              tasks: [
                "Describe the template sections you need.",
                "Explain the GET and POST behavior clearly.",
                "Mention one success and one validation-error state.",
              ],
              deliverable: "A Django page-flow plan for a template-driven form feature.",
            },
          },
          {
            slug: "api-and-deployment-path",
            title: "API and Deployment Path",
            summary: "See how Django projects can evolve toward APIs and what matters when the app is deployed.",
            durationMinutes: 24,
            goals: [
              "Understand when Django serves rendered pages and when it should expose APIs.",
              "Think through environment variables, static files, and database setup for deployment.",
              "Connect development choices to delivery choices earlier.",
            ],
            contentBlocks: [
              {
                title: "Django can serve pages or APIs",
                paragraphs: [
                  "Some Django products stay template-driven, while others grow into API-backed systems. The right choice depends on how the frontend is built and how interactive the product needs to be.",
                  "Understanding both paths helps you plan a stack more intelligently.",
                ],
              },
              {
                title: "Deployment changes the constraints",
                paragraphs: [
                  "Static files, secret keys, database access, allowed hosts, and environment setup matter as soon as the app leaves localhost.",
                  "A full-stack developer should think about those constraints before the final day of launch.",
                ],
              },
            ],
            quickCheck: [
              "When is a template-driven Django page enough, and when is an API more useful?",
              "What deployment details can break a Django app even if local development works?",
              "Why should delivery concerns influence stack decisions early?",
            ],
            assignment: {
              title: "Create a Django launch checklist",
              brief:
                "Write a checklist for taking a Django feature from local development to a hosted environment.",
              tasks: [
                "List important environment and database requirements.",
                "Call out one static-file or media concern.",
                "Mention one post-deploy check you would run on the live feature.",
              ],
              deliverable: "A practical launch checklist for a Django feature.",
            },
          },
        ],
      },
    ],
  },
];

export const getLearnTracks = () => learnCatalog;

export const getLearnTrack = (trackSlug: string) =>
  learnCatalog.find((track) => track.slug === trackSlug) || null;

export const getLearnCourse = (trackSlug: string, courseSlug: string) => {
  const track = getLearnTrack(trackSlug);
  if (!track) {
    return null;
  }

  const course = track.courses.find((entry) => entry.slug === courseSlug) || null;
  if (!course) {
    return null;
  }

  return {
    track,
    course,
  };
};

export const getLearnLesson = (trackSlug: string, courseSlug: string, lessonSlug: string) => {
  const courseEntry = getLearnCourse(trackSlug, courseSlug);
  if (!courseEntry) {
    return null;
  }

  const lessonIndex = courseEntry.course.lessons.findIndex((entry) => entry.slug === lessonSlug);
  if (lessonIndex < 0) {
    return null;
  }

  const lesson = courseEntry.course.lessons[lessonIndex];
  const nextLesson = courseEntry.course.lessons[lessonIndex + 1] || null;

  return {
    ...courseEntry,
    lesson,
    nextLesson,
  };
};

export const getLearnStats = () => {
  const courseCount = learnCatalog.reduce((total, track) => total + track.courses.length, 0);
  const lessonCount = learnCatalog.reduce(
    (total, track) =>
      total + track.courses.reduce((courseTotal, course) => courseTotal + course.lessons.length, 0),
    0,
  );

  return {
    trackCount: learnCatalog.length,
    courseCount,
    lessonCount,
  };
};

export const getAllLearnRoutes = () => {
  const routes = ["/learn"];

  for (const track of learnCatalog) {
    routes.push(`/learn/${track.slug}`);

    for (const course of track.courses) {
      routes.push(`/learn/${track.slug}/${course.slug}`);

      for (const lesson of course.lessons) {
        routes.push(`/learn/${track.slug}/${course.slug}/${lesson.slug}`);
      }
    }
  }

  return routes;
};
