import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_DATA_PATH = path.join(ROOT, "data", "resources.json");
const REQUIRED_CATEGORIES = [
  "ai-tools",
  "courses",
  "software",
  "printables",
  "assistance",
];
const REQUIRED_TEXT_FIELDS = [
  "id",
  "name",
  "provider",
  "category",
  "description",
  "freeTierLimits",
  "url",
  "region",
  "lastVerified",
  "caveat",
];
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isRealIsoDate(value) {
  if (!ISO_DATE_PATTERN.test(String(value))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function validateDataset(data, { today = todayIso() } = {}) {
  const errors = [];

  if (!isPlainObject(data)) {
    return ["The root of the data file must be an object."];
  }

  if (!isPlainObject(data.meta)) {
    errors.push("meta must be an object.");
  } else {
    if (typeof data.meta.title !== "string" || !data.meta.title.trim()) {
      errors.push("meta.title must be a non-empty string.");
    }
    if (!Number.isInteger(data.meta.version) || data.meta.version < 1) {
      errors.push("meta.version must be a positive integer.");
    }
    if (!isRealIsoDate(data.meta.lastReviewed)) {
      errors.push("meta.lastReviewed must be a real date in YYYY-MM-DD format.");
    } else if (data.meta.lastReviewed > today) {
      errors.push("meta.lastReviewed cannot be in the future.");
    }
    if (
      typeof data.meta.coverageNote !== "string" ||
      data.meta.coverageNote.trim().length < 20
    ) {
      errors.push("meta.coverageNote must be a useful, non-empty string.");
    }
  }

  if (!Array.isArray(data.categories)) {
    errors.push("categories must be an array.");
  }

  const categories = Array.isArray(data.categories) ? data.categories : [];
  const categoryIds = new Set();

  categories.forEach((category, index) => {
    const label = `categories[${index}]`;
    if (!isPlainObject(category)) {
      errors.push(`${label} must be an object.`);
      return;
    }
    if (typeof category.id !== "string" || !ID_PATTERN.test(category.id)) {
      errors.push(`${label}.id must be a lowercase slug.`);
    } else if (categoryIds.has(category.id)) {
      errors.push(`${label}.id "${category.id}" is duplicated.`);
    } else {
      categoryIds.add(category.id);
    }
    if (typeof category.label !== "string" || category.label.trim().length < 2) {
      errors.push(`${label}.label must be a non-empty string.`);
    }
    if (
      typeof category.blurb !== "string" ||
      category.blurb.trim().length < 20
    ) {
      errors.push(`${label}.blurb must be a useful, non-empty string.`);
    }
  });

  for (const categoryId of REQUIRED_CATEGORIES) {
    if (!categoryIds.has(categoryId)) {
      errors.push(`The required category "${categoryId}" is missing.`);
    }
  }

  if (!Array.isArray(data.resources)) {
    errors.push("resources must be an array.");
    return errors;
  }

  if (data.resources.length === 0) {
    errors.push("resources must contain at least one resource.");
  }

  const resourceIds = new Set();
  const resourceUrls = new Set();

  data.resources.forEach((resource, index) => {
    const label = `resources[${index}]${resource?.id ? ` (${resource.id})` : ""}`;

    if (!isPlainObject(resource)) {
      errors.push(`${label} must be an object.`);
      return;
    }

    for (const field of REQUIRED_TEXT_FIELDS) {
      if (typeof resource[field] !== "string" || !resource[field].trim()) {
        errors.push(`${label}.${field} must be a non-empty string.`);
      }
    }

    if (typeof resource.id === "string") {
      if (!ID_PATTERN.test(resource.id)) {
        errors.push(`${label}.id must be a lowercase slug.`);
      }
      if (resourceIds.has(resource.id)) {
        errors.push(`${label}.id "${resource.id}" is duplicated.`);
      }
      resourceIds.add(resource.id);
    }

    if (
      typeof resource.category === "string" &&
      !categoryIds.has(resource.category)
    ) {
      errors.push(
        `${label}.category "${resource.category}" does not match a category id.`,
      );
    }

    if (typeof resource.description === "string") {
      if (resource.description.trim().length < 60) {
        errors.push(`${label}.description is too short to be useful.`);
      }
      if (resource.description.length > 600) {
        errors.push(`${label}.description is too long for a card.`);
      }
    }

    if (
      typeof resource.freeTierLimits === "string" &&
      resource.freeTierLimits.trim().length < 50
    ) {
      errors.push(`${label}.freeTierLimits must explain the actual limits.`);
    }

    if (
      typeof resource.caveat === "string" &&
      resource.caveat.trim().length < 30
    ) {
      errors.push(`${label}.caveat must be a meaningful caution.`);
    }

    if (!Array.isArray(resource.tags)) {
      errors.push(`${label}.tags must be an array.`);
    } else {
      if (resource.tags.length < 2) {
        errors.push(`${label}.tags must contain at least two tags.`);
      }
      const seenTags = new Set();
      resource.tags.forEach((tag, tagIndex) => {
        if (typeof tag !== "string" || !tag.trim()) {
          errors.push(`${label}.tags[${tagIndex}] must be a non-empty string.`);
          return;
        }
        if (tag.trim().length > 32) {
          errors.push(`${label}.tags[${tagIndex}] is too long.`);
        }
        const normalized = tag.trim().toLocaleLowerCase();
        if (seenTags.has(normalized)) {
          errors.push(`${label}.tags contains "${tag}" more than once.`);
        }
        seenTags.add(normalized);
      });
    }

    if (typeof resource.url === "string") {
      try {
        const url = new URL(resource.url);
        if (url.protocol !== "https:") {
          errors.push(`${label}.url must use https.`);
        }
        if (!url.hostname.includes(".")) {
          errors.push(`${label}.url must point to a public website.`);
        }
        if (url.username || url.password) {
          errors.push(`${label}.url must not include credentials.`);
        }
        const normalizedUrl = url.href;
        if (resourceUrls.has(normalizedUrl)) {
          errors.push(`${label}.url is used by more than one resource.`);
        }
        resourceUrls.add(normalizedUrl);
      } catch {
        errors.push(`${label}.url is not a valid URL.`);
      }
    }

    if (!isRealIsoDate(resource.lastVerified)) {
      errors.push(
        `${label}.lastVerified must be a real date in YYYY-MM-DD format.`,
      );
    } else {
      if (resource.lastVerified > today) {
        errors.push(`${label}.lastVerified cannot be in the future.`);
      }
      if (
        isPlainObject(data.meta) &&
        isRealIsoDate(data.meta.lastReviewed) &&
        resource.lastVerified > data.meta.lastReviewed
      ) {
        errors.push(
          `${label}.lastVerified cannot be after meta.lastReviewed.`,
        );
      }
    }
  });

  const usedCategories = new Set(
    data.resources
      .map((resource) => resource?.category)
      .filter((category) => typeof category === "string"),
  );

  for (const categoryId of categoryIds) {
    if (!usedCategories.has(categoryId)) {
      errors.push(`Category "${categoryId}" has no resources.`);
    }
  }

  return errors;
}

async function readDataset(filePath) {
  const contents = await readFile(filePath, "utf8");
  try {
    return JSON.parse(contents);
  } catch (error) {
    throw new Error(`Could not parse ${path.basename(filePath)}: ${error.message}`);
  }
}

async function main() {
  const filePath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : DEFAULT_DATA_PATH;

  try {
    const data = await readDataset(filePath);
    const errors = validateDataset(data);

    if (errors.length > 0) {
      console.error(`Data validation failed with ${errors.length} issue(s):`);
      for (const error of errors) console.error(`- ${error}`);
      process.exitCode = 1;
      return;
    }

    console.log(
      `Validated ${data.resources.length} resources across ${data.categories.length} categories.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

const isEntryPoint =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  await main();
}
