/**
 * Link-only starter catalogue for Bodhya's Resource feature.
 * These entries point to original providers; Bodhya does not redistribute their files.
 */
export const STARTER_RESOURCES = [
  {
    id: "starter-diksha", title: "DIKSHA learning portal",
    description: "Curriculum-aligned school learning resources, lessons, videos, activities and quizzes. Select the student's board, grade and subject.",
    subject: "School Education", topic: "Curriculum resources", academic_level: "School",
    resource_type: "portal", source_name: "DIKSHA", source_url: "https://diksha.gov.in/",
    license_notes: "Opens the original portal. Check the terms on each resource before copying or redistributing it.", language: "Multiple", tags: ["India", "school", "curriculum"], verification_status: "approved"
  },
  {
    id: "starter-epathshala", title: "ePathshala digital resources",
    description: "NCERT digital learning portal for textbooks and supplementary resources. Choose the correct class and subject.",
    subject: "School Education", topic: "Digital textbooks", academic_level: "School",
    resource_type: "textbook", source_name: "ePathshala", source_url: "https://epathshala.nic.in/",
    license_notes: "Link-only entry. Check NCERT and item-specific permissions before reuse.", language: "Multiple", tags: ["NCERT", "textbooks", "India"], verification_status: "approved"
  },
  {
    id: "starter-ncert", title: "NCERT textbook portal",
    description: "Official textbook access point for NCERT school subjects. Locate a book by class and subject on the original website.",
    subject: "School Education", topic: "Official textbooks", academic_level: "School",
    resource_type: "textbook", source_name: "NCERT", source_url: "https://ncert.nic.in/textbook.php",
    license_notes: "Bodhya links to the source. Do not assume all textbook text, images and media have identical reuse permissions.", language: "Multiple", tags: ["NCERT", "textbooks", "official"], verification_status: "approved"
  },
  {
    id: "starter-swayam", title: "SWAYAM online courses",
    description: "Online courses across school, undergraduate and other learning levels. Check the provider, syllabus and current course dates.",
    subject: "General Education", topic: "Online courses", academic_level: "All levels",
    resource_type: "course", source_name: "SWAYAM", source_url: "https://swayam.gov.in/",
    license_notes: "Course materials may have provider-specific conditions. Follow the terms on the source page.", language: "Multiple", tags: ["India", "MOOC", "courses"], verification_status: "approved"
  },
  {
    id: "starter-nptel", title: "NPTEL engineering and science courses",
    description: "Engineering, technology, mathematics and science courses from participating Indian institutes.",
    subject: "Engineering & Computer Science", topic: "Engineering courses", academic_level: "Undergraduate",
    resource_type: "course", source_name: "NPTEL", source_url: "https://nptel.ac.in/",
    license_notes: "Link-only entry. Verify current availability and permissions on the original course page.", language: "English", tags: ["IIT", "engineering", "science"], verification_status: "approved"
  },
  {
    id: "starter-openstax", title: "OpenStax open textbooks",
    description: "Free textbooks for selected school and university subjects. Check the licence of the specific book and any included components.",
    subject: "Science & Mathematics", topic: "Open textbooks", academic_level: "Undergraduate",
    resource_type: "book", source_name: "OpenStax", source_url: "https://openstax.org/subjects",
    license_notes: "Check the exact book licence and attribution conditions before copying, adapting or redistributing content.", language: "English", tags: ["open textbook", "science", "math"], verification_status: "approved"
  },
  {
    id: "starter-khan", title: "Khan Academy lessons and practice",
    description: "Lessons and practice exercises across mathematics, science and other subjects, with learning paths for different levels.",
    subject: "Multi-subject", topic: "Lessons and practice", academic_level: "School",
    resource_type: "practice", source_name: "Khan Academy", source_url: "https://www.khanacademy.org/",
    license_notes: "Link-only entry. Follow current site terms and item-specific reuse conditions.", language: "Multiple", tags: ["lessons", "practice", "math", "science"], verification_status: "approved"
  },
  {
    id: "starter-mitocw", title: "MIT OpenCourseWare",
    description: "Published university course materials, including selected lecture notes, assignments and course resources.",
    subject: "Engineering & Computer Science", topic: "University course materials", academic_level: "Undergraduate",
    resource_type: "lecture", source_name: "MIT OpenCourseWare", source_url: "https://ocw.mit.edu/",
    license_notes: "Check the terms on the relevant course or content page before reusing materials.", language: "English", tags: ["MIT", "university", "lecture notes"], verification_status: "approved"
  },
  {
    id: "starter-openlibrary", title: "Open Library book catalogue",
    description: "Search book records by title, author, subject or ISBN. Borrowing and full-text availability depend on the specific book and its rights status.",
    subject: "Books & Reading", topic: "Book discovery", academic_level: "All levels",
    resource_type: "book", source_name: "Open Library", source_url: "https://openlibrary.org/",
    license_notes: "Catalogue metadata and book access have separate terms. Use only legally available copies or borrowing options.", language: "Multiple", tags: ["books", "catalogue", "reading"], verification_status: "approved"
  },
  {
    id: "starter-gutenberg", title: "Project Gutenberg public-domain books",
    description: "A catalogue of ebooks primarily focused on works that are public domain in the United States. Check the status in your own jurisdiction.",
    subject: "Books & Literature", topic: "Public-domain reading", academic_level: "All levels",
    resource_type: "book", source_name: "Project Gutenberg", source_url: "https://www.gutenberg.org/",
    license_notes: "Public-domain status can vary by country. Check the specific title's notice and local law.", language: "Multiple", tags: ["books", "literature", "public domain"], verification_status: "approved"
  },
  {
    id: "starter-libretexts", title: "LibreTexts open learning library",
    description: "Open educational textbooks and learning content across several disciplines. Individual pages may have different attribution requirements.",
    subject: "Multi-subject", topic: "Open educational resources", academic_level: "School and university",
    resource_type: "textbook", source_name: "LibreTexts", source_url: "https://libretexts.org/",
    license_notes: "Check the licence and attribution on each book or page before reuse.", language: "English", tags: ["OER", "textbooks", "open learning"], verification_status: "approved"
  },
  {
    id: "starter-ocw", title: "Open course materials from OER Commons",
    description: "Search and discover educational materials. Confirm creator, suitability and licence for each result.",
    subject: "Multi-subject", topic: "Open educational resources", academic_level: "All levels",
    resource_type: "portal", source_name: "OER Commons", source_url: "https://www.oercommons.org/",
    license_notes: "Check the licence shown on each item. Listing in a directory does not itself guarantee unrestricted reuse.", language: "Multiple", tags: ["OER", "teaching", "learning"], verification_status: "approved"
  },
];

export const RESOURCE_TYPES = [
  { value: "all", label: "All resource types" },
  { value: "book", label: "Books" },
  { value: "textbook", label: "Textbooks" },
  { value: "notes", label: "Notes & summaries" },
  { value: "course", label: "Courses" },
  { value: "lecture", label: "Lectures" },
  { value: "video", label: "Videos" },
  { value: "practice", label: "Practice & quizzes" },
  { value: "article", label: "Articles" },
  { value: "research_paper", label: "Research papers" },
  { value: "portal", label: "Learning portals" },
  { value: "interactive", label: "Interactive tools" },
  { value: "other", label: "Other" },
];

export const RESOURCE_TYPE_ICONS = {
  book: "📚", textbook: "📖", notes: "🗒️", course: "🎓", lecture: "🧑‍🏫",
  video: "▶️", practice: "✍️", article: "📰", research_paper: "🔬",
  portal: "🌐", interactive: "🧩", other: "📎"
};
