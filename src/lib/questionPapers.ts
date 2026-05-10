export type QuestionPaperResourceType =
  | "question-papers"
  | "syllabus"
  | "solutions"
  | "timetable"
  | "model-answers"
  | "results";

export type QuestionPaperRecord = {
  id: string;
  title: string;
  resourceType: QuestionPaperResourceType;
  course: string;
  branch: string;
  semester: string;
  examSession: string;
  examYear: number;
  subject: string;
  fileUrl: string;
  source: string;
};

export type QuestionPaperFilters = {
  query: string;
  resourceType: string;
  course: string;
  branch: string;
  semester: string;
  examSession: string;
  examYear: string;
};

const sessionPriority: Record<string, number> = {
  December: 6,
  November: 5,
  October: 4,
  June: 3,
  May: 2,
  April: 1,
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const includeIfMatches = (value: string, selectedValue: string) =>
  !selectedValue || normalizeText(value) === normalizeText(selectedValue);

const parseYear = (value: string) => {
  const year = Number.parseInt(value, 10);
  return Number.isFinite(year) ? year : null;
};

export const questionPaperResourceOptions: Array<{
  id: QuestionPaperResourceType;
  label: string;
}> = [
  { id: "question-papers", label: "Question Papers" },
  { id: "syllabus", label: "Syllabus" },
  { id: "solutions", label: "Solutions" },
  { id: "timetable", label: "Timetable" },
  { id: "model-answers", label: "Model Answers" },
  { id: "results", label: "Results" },
];

const records: QuestionPaperRecord[] = [
  {
    id: "be-comp-sem5-dbms-nov-2024",
    title: "Database Management Systems - Question Paper",
    resourceType: "question-papers",
    course: "BE",
    branch: "Computer Engineering",
    semester: "Semester 5",
    examSession: "November",
    examYear: 2024,
    subject: "Database Management Systems",
    fileUrl: "https://muquestionpapers.com/storage/questionpapers/be_comp_sem5_dbms_nov_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "be-comp-sem5-os-nov-2024",
    title: "Operating Systems - Question Paper",
    resourceType: "question-papers",
    course: "BE",
    branch: "Computer Engineering",
    semester: "Semester 5",
    examSession: "November",
    examYear: 2024,
    subject: "Operating Systems",
    fileUrl: "https://muquestionpapers.com/storage/questionpapers/be_comp_sem5_os_nov_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "be-comp-sem6-daa-may-2024",
    title: "Design and Analysis of Algorithms - Question Paper",
    resourceType: "question-papers",
    course: "BE",
    branch: "Computer Engineering",
    semester: "Semester 6",
    examSession: "May",
    examYear: 2024,
    subject: "Design and Analysis of Algorithms",
    fileUrl: "https://muquestionpapers.com/storage/questionpapers/be_comp_sem6_daa_may_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "be-it-sem6-ai-nov-2023",
    title: "Artificial Intelligence - Question Paper",
    resourceType: "question-papers",
    course: "BE",
    branch: "Information Technology",
    semester: "Semester 6",
    examSession: "November",
    examYear: 2023,
    subject: "Artificial Intelligence",
    fileUrl: "https://muquestionpapers.com/storage/questionpapers/be_it_sem6_ai_nov_2023.pdf",
    source: "Mumbai University",
  },
  {
    id: "be-it-sem5-cn-may-2024",
    title: "Computer Networks - Question Paper",
    resourceType: "question-papers",
    course: "BE",
    branch: "Information Technology",
    semester: "Semester 5",
    examSession: "May",
    examYear: 2024,
    subject: "Computer Networks",
    fileUrl: "https://muquestionpapers.com/storage/questionpapers/be_it_sem5_cn_may_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "be-extc-sem6-dsp-nov-2024",
    title: "Digital Signal Processing - Question Paper",
    resourceType: "question-papers",
    course: "BE",
    branch: "Electronics and Telecommunication",
    semester: "Semester 6",
    examSession: "November",
    examYear: 2024,
    subject: "Digital Signal Processing",
    fileUrl: "https://muquestionpapers.com/storage/questionpapers/be_extc_sem6_dsp_nov_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "be-mech-sem5-tom-may-2024",
    title: "Theory of Machines - Question Paper",
    resourceType: "question-papers",
    course: "BE",
    branch: "Mechanical Engineering",
    semester: "Semester 5",
    examSession: "May",
    examYear: 2024,
    subject: "Theory of Machines",
    fileUrl: "https://muquestionpapers.com/storage/questionpapers/be_mech_sem5_tom_may_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "bsc-it-sem5-awp-nov-2024",
    title: "Advanced Web Programming - Question Paper",
    resourceType: "question-papers",
    course: "Science",
    branch: "BSC Information Technology",
    semester: "Semester 5",
    examSession: "November",
    examYear: 2024,
    subject: "Advanced Web Programming",
    fileUrl: "https://muquestionpapers.com/storage/questionpapers/bsc_it_sem5_awp_nov_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "bsc-it-sem6-dwm-may-2024",
    title: "Data Warehousing and Mining - Question Paper",
    resourceType: "question-papers",
    course: "Science",
    branch: "BSC Information Technology",
    semester: "Semester 6",
    examSession: "May",
    examYear: 2024,
    subject: "Data Warehousing and Mining",
    fileUrl: "https://muquestionpapers.com/storage/questionpapers/bsc_it_sem6_dwm_may_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "bsc-cs-sem4-java-apr-2024",
    title: "Core Java - Question Paper",
    resourceType: "question-papers",
    course: "Science",
    branch: "BSC Computer Science",
    semester: "Semester 4",
    examSession: "April",
    examYear: 2024,
    subject: "Core Java",
    fileUrl: "https://muquestionpapers.com/storage/questionpapers/bsc_cs_sem4_java_apr_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "mca-sem2-java-nov-2024",
    title: "Java Enterprise Applications - Question Paper",
    resourceType: "question-papers",
    course: "Technology",
    branch: "MCA",
    semester: "Semester 2",
    examSession: "November",
    examYear: 2024,
    subject: "Java Enterprise Applications",
    fileUrl: "https://muquestionpapers.com/storage/questionpapers/mca_sem2_jea_nov_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "mca-sem3-cloud-may-2024",
    title: "Cloud Computing - Question Paper",
    resourceType: "question-papers",
    course: "Technology",
    branch: "MCA",
    semester: "Semester 3",
    examSession: "May",
    examYear: 2024,
    subject: "Cloud Computing",
    fileUrl: "https://muquestionpapers.com/storage/questionpapers/mca_sem3_cloud_may_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "be-comp-syllabus-sem5",
    title: "Semester 5 - Computer Engineering Syllabus",
    resourceType: "syllabus",
    course: "BE",
    branch: "Computer Engineering",
    semester: "Semester 5",
    examSession: "Updated",
    examYear: 2024,
    subject: "Syllabus",
    fileUrl: "https://muquestionpapers.com/storage/syllabus/be_comp_sem5_syllabus_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "be-it-syllabus-sem6",
    title: "Semester 6 - Information Technology Syllabus",
    resourceType: "syllabus",
    course: "BE",
    branch: "Information Technology",
    semester: "Semester 6",
    examSession: "Updated",
    examYear: 2024,
    subject: "Syllabus",
    fileUrl: "https://muquestionpapers.com/storage/syllabus/be_it_sem6_syllabus_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "bsc-it-syllabus-sem5",
    title: "Semester 5 - BSC IT Syllabus",
    resourceType: "syllabus",
    course: "Science",
    branch: "BSC Information Technology",
    semester: "Semester 5",
    examSession: "Updated",
    examYear: 2024,
    subject: "Syllabus",
    fileUrl: "https://muquestionpapers.com/storage/syllabus/bsc_it_sem5_syllabus_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "be-comp-dbms-solution-nov-2024",
    title: "DBMS - Solution Set",
    resourceType: "solutions",
    course: "BE",
    branch: "Computer Engineering",
    semester: "Semester 5",
    examSession: "November",
    examYear: 2024,
    subject: "Database Management Systems",
    fileUrl: "https://muquestionpapers.com/storage/solutions/be_comp_sem5_dbms_solution_nov_2024.pdf",
    source: "Faculty compiled",
  },
  {
    id: "be-it-cn-solution-may-2024",
    title: "Computer Networks - Solution Set",
    resourceType: "solutions",
    course: "BE",
    branch: "Information Technology",
    semester: "Semester 5",
    examSession: "May",
    examYear: 2024,
    subject: "Computer Networks",
    fileUrl: "https://muquestionpapers.com/storage/solutions/be_it_sem5_cn_solution_may_2024.pdf",
    source: "Faculty compiled",
  },
  {
    id: "bsc-it-awp-solution-nov-2024",
    title: "Advanced Web Programming - Solution Set",
    resourceType: "solutions",
    course: "Science",
    branch: "BSC Information Technology",
    semester: "Semester 5",
    examSession: "November",
    examYear: 2024,
    subject: "Advanced Web Programming",
    fileUrl: "https://muquestionpapers.com/storage/solutions/bsc_it_sem5_awp_solution_nov_2024.pdf",
    source: "Faculty compiled",
  },
  {
    id: "be-timetable-sem5-nov-2024",
    title: "BE Semester 5 Exam Timetable",
    resourceType: "timetable",
    course: "BE",
    branch: "Computer Engineering",
    semester: "Semester 5",
    examSession: "November",
    examYear: 2024,
    subject: "Timetable",
    fileUrl: "https://muquestionpapers.com/storage/timetable/be_sem5_timetable_nov_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "be-timetable-sem6-may-2024",
    title: "BE Semester 6 Exam Timetable",
    resourceType: "timetable",
    course: "BE",
    branch: "Information Technology",
    semester: "Semester 6",
    examSession: "May",
    examYear: 2024,
    subject: "Timetable",
    fileUrl: "https://muquestionpapers.com/storage/timetable/be_sem6_timetable_may_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "science-timetable-sem5-nov-2024",
    title: "Science Semester 5 Exam Timetable",
    resourceType: "timetable",
    course: "Science",
    branch: "BSC Information Technology",
    semester: "Semester 5",
    examSession: "November",
    examYear: 2024,
    subject: "Timetable",
    fileUrl: "https://muquestionpapers.com/storage/timetable/science_sem5_timetable_nov_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "be-comp-modelanswers-sem4",
    title: "Computer Engineering Semester 4 Model Answers",
    resourceType: "model-answers",
    course: "BE",
    branch: "Computer Engineering",
    semester: "Semester 4",
    examSession: "April",
    examYear: 2024,
    subject: "Model Answers",
    fileUrl: "https://muquestionpapers.com/storage/modelanswers/be_comp_sem4_modelanswers_2024.pdf",
    source: "Faculty compiled",
  },
  {
    id: "be-extc-modelanswers-sem6",
    title: "EXTC Semester 6 Model Answers",
    resourceType: "model-answers",
    course: "BE",
    branch: "Electronics and Telecommunication",
    semester: "Semester 6",
    examSession: "November",
    examYear: 2023,
    subject: "Model Answers",
    fileUrl: "https://muquestionpapers.com/storage/modelanswers/be_extc_sem6_modelanswers_2023.pdf",
    source: "Faculty compiled",
  },
  {
    id: "bsc-it-modelanswers-sem5",
    title: "BSC IT Semester 5 Model Answers",
    resourceType: "model-answers",
    course: "Science",
    branch: "BSC Information Technology",
    semester: "Semester 5",
    examSession: "November",
    examYear: 2024,
    subject: "Model Answers",
    fileUrl: "https://muquestionpapers.com/storage/modelanswers/bsc_it_sem5_modelanswers_2024.pdf",
    source: "Faculty compiled",
  },
  {
    id: "be-results-nov-2024",
    title: "BE Result Declaration - November 2024",
    resourceType: "results",
    course: "BE",
    branch: "Computer Engineering",
    semester: "Semester 5",
    examSession: "November",
    examYear: 2024,
    subject: "Result Notice",
    fileUrl: "https://muquestionpapers.com/storage/results/be_result_notice_nov_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "science-results-may-2024",
    title: "Science Result Declaration - May 2024",
    resourceType: "results",
    course: "Science",
    branch: "BSC Information Technology",
    semester: "Semester 6",
    examSession: "May",
    examYear: 2024,
    subject: "Result Notice",
    fileUrl: "https://muquestionpapers.com/storage/results/science_result_notice_may_2024.pdf",
    source: "Mumbai University",
  },
  {
    id: "mca-results-nov-2024",
    title: "MCA Result Declaration - November 2024",
    resourceType: "results",
    course: "Technology",
    branch: "MCA",
    semester: "Semester 3",
    examSession: "November",
    examYear: 2024,
    subject: "Result Notice",
    fileUrl: "https://muquestionpapers.com/storage/results/mca_result_notice_nov_2024.pdf",
    source: "Mumbai University",
  },
];

const toUniqueSortedValues = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );

export const getAllQuestionPaperRecords = () => records;

export const normalizeQuestionPaperFilters = (input: Partial<QuestionPaperFilters>): QuestionPaperFilters => ({
  query: input.query?.trim() || "",
  resourceType: input.resourceType?.trim() || "",
  course: input.course?.trim() || "",
  branch: input.branch?.trim() || "",
  semester: input.semester?.trim() || "",
  examSession: input.examSession?.trim() || "",
  examYear: input.examYear?.trim() || "",
});

export const filterQuestionPaperRecords = (
  allRecords: QuestionPaperRecord[],
  filters: QuestionPaperFilters,
) => {
  const normalizedQuery = normalizeText(filters.query);
  const yearFilter = parseYear(filters.examYear);

  return allRecords.filter((record) => {
    if (normalizedQuery) {
      const searchableText = normalizeText(
        [
          record.title,
          record.subject,
          record.branch,
          record.course,
          record.semester,
          record.examSession,
          String(record.examYear),
          questionPaperResourceOptions.find((item) => item.id === record.resourceType)?.label || "",
        ].join(" "),
      );

      if (!searchableText.includes(normalizedQuery)) {
        return false;
      }
    }

    if (!includeIfMatches(record.resourceType, filters.resourceType)) {
      return false;
    }
    if (!includeIfMatches(record.course, filters.course)) {
      return false;
    }
    if (!includeIfMatches(record.branch, filters.branch)) {
      return false;
    }
    if (!includeIfMatches(record.semester, filters.semester)) {
      return false;
    }
    if (!includeIfMatches(record.examSession, filters.examSession)) {
      return false;
    }

    if (yearFilter && record.examYear !== yearFilter) {
      return false;
    }

    return true;
  });
};

export const sortQuestionPaperRecords = (allRecords: QuestionPaperRecord[]) =>
  [...allRecords].sort((firstItem, secondItem) => {
    if (firstItem.examYear !== secondItem.examYear) {
      return secondItem.examYear - firstItem.examYear;
    }

    const firstPriority = sessionPriority[firstItem.examSession] ?? 0;
    const secondPriority = sessionPriority[secondItem.examSession] ?? 0;
    if (firstPriority !== secondPriority) {
      return secondPriority - firstPriority;
    }

    return firstItem.title.localeCompare(secondItem.title);
  });

export const getQuestionPaperFilterOptions = (allRecords: QuestionPaperRecord[]) => ({
  courses: toUniqueSortedValues(allRecords.map((record) => record.course)),
  branches: toUniqueSortedValues(allRecords.map((record) => record.branch)),
  semesters: toUniqueSortedValues(allRecords.map((record) => record.semester)),
  sessions: toUniqueSortedValues(allRecords.map((record) => record.examSession)),
  years: Array.from(new Set(allRecords.map((record) => String(record.examYear)))).sort(
    (firstYear, secondYear) => Number.parseInt(secondYear, 10) - Number.parseInt(firstYear, 10),
  ),
});
