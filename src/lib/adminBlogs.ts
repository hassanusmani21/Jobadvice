import { getAllBlogsForAdmin } from "./blogs";
import { getRemoteBlogRecords, shouldUseRemoteAdminRecords } from "./adminRepoRecords";

export type AdminBlogRecord = {
  slug: string;
  title: string;
  topic: string;
  date: string;
  updatedAt: string;
  draft: boolean;
};

const toUtcDayTimestamp = (value: string) => Date.parse(`${value}T00:00:00Z`);

const isValidIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const toDateTimestampOrNull = (value: string) => {
  if (!isValidIsoDate(value)) {
    return null;
  }

  const timestamp = toUtcDayTimestamp(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return timestamp;
};

const sortByRecentDate = (firstRecord: AdminBlogRecord, secondRecord: AdminBlogRecord) => {
  const firstDate = toDateTimestampOrNull(firstRecord.date) || 0;
  const secondDate = toDateTimestampOrNull(secondRecord.date) || 0;
  if (secondDate !== firstDate) {
    return secondDate - firstDate;
  }

  const firstUpdatedAt = toDateTimestampOrNull(firstRecord.updatedAt) || 0;
  const secondUpdatedAt = toDateTimestampOrNull(secondRecord.updatedAt) || 0;
  if (secondUpdatedAt !== firstUpdatedAt) {
    return secondUpdatedAt - firstUpdatedAt;
  }

  return firstRecord.slug.localeCompare(secondRecord.slug);
};

export const getAdminBlogRecords = async () => {
  if (shouldUseRemoteAdminRecords()) {
    try {
      const remoteRecords = await getRemoteBlogRecords();
      if (remoteRecords.length > 0) {
        return remoteRecords.sort(sortByRecentDate);
      }
    } catch (error) {
      console.error("[adminBlogs] Falling back to bundled blog records:", error);
    }
  }

  const blogs = await getAllBlogsForAdmin();
  return blogs
    .map((blog) => ({
      slug: blog.slug,
      title: blog.title,
      topic: blog.topic,
      date: blog.date,
      updatedAt: blog.updatedAt,
      draft: blog.draft,
    }))
    .sort(sortByRecentDate);
};
