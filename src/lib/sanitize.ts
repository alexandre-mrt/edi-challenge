/** Strip HTML tags from a string */
function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Trim and strip HTML from input, enforce max length */
function cleanString(input: unknown, maxLength: number): string {
  if (typeof input !== "string") return "";
  return stripHtml(input).trim().slice(0, maxLength);
}

const NAME_PATTERN = /^[a-zA-Z0-9\s\-\u00C0-\u024F]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ETH_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

interface SanitizeResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly sanitized?: SanitizedBadgeInput;
}

export interface SanitizedBadgeInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly mainProject: string;
  readonly details: string;
  readonly imageLink: string;
  readonly recipientWallet: string;
  readonly startDate: string;
  readonly completionDate: string;
}

export function sanitizeBadgeInput(data: Record<string, unknown>): SanitizeResult {
  const firstName = cleanString(data.firstName, 50);
  const lastName = cleanString(data.lastName, 50);
  const mainProject = cleanString(data.mainProject, 100);
  const details = cleanString(data.details, 200);
  const imageLink = cleanString(data.imageLink, 500_000);
  const recipientWallet = cleanString(data.recipientWallet, 42);
  const startDate = cleanString(data.startDate, 10);
  const completionDate = cleanString(data.completionDate, 10);

  if (!firstName || !lastName) {
    return { valid: false, error: "First name and last name are required" };
  }

  if (!NAME_PATTERN.test(firstName)) {
    return { valid: false, error: "First name contains invalid characters" };
  }

  if (!NAME_PATTERN.test(lastName)) {
    return { valid: false, error: "Last name contains invalid characters" };
  }

  if (mainProject && mainProject.length > 100) {
    return { valid: false, error: "Main project exceeds 100 characters" };
  }

  if (details && details.length > 200) {
    return { valid: false, error: "Details exceeds 200 characters" };
  }

  if (imageLink) {
    const isHttpUrl = /^https?:\/\/.+/.test(imageLink);
    const isDataUrl = /^data:image\/.+/.test(imageLink);
    if (!isHttpUrl && !isDataUrl) {
      return { valid: false, error: "Image link must be a valid HTTP(S) or data:image URL" };
    }
  }

  if (!recipientWallet || !ETH_ADDRESS_PATTERN.test(recipientWallet)) {
    return { valid: false, error: "Invalid recipient wallet address" };
  }

  if (startDate && !DATE_PATTERN.test(startDate)) {
    return { valid: false, error: "Start date must be in YYYY-MM-DD format" };
  }

  if (completionDate && !DATE_PATTERN.test(completionDate)) {
    return { valid: false, error: "Completion date must be in YYYY-MM-DD format" };
  }

  return {
    valid: true,
    sanitized: {
      firstName,
      lastName,
      mainProject,
      details,
      imageLink,
      recipientWallet,
      startDate,
      completionDate,
    },
  };
}
