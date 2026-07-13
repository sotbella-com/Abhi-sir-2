import { BASE_URL, IMAGE_URL } from "@/constants/constants";
import { useNavigate } from "react-router-dom";

function getRemainingPath(fullUrl) {
  try {
    const full = new URL(fullUrl);
    const base = new URL(BASE_URL);

    // Match hostname only (ignoring protocol)
    if (full.hostname !== base.hostname) {
      throw new Error("Base URL hostname does not match full URL hostname");
    }

    let remainingPath = full.pathname;
    if (full.pathname.startsWith(base.pathname)) {
      remainingPath = full.pathname.slice(base.pathname.length);
    }

    return remainingPath + full.search + full.hash;
  } catch (error) {
    return fullUrl;
  }
}

function getImageUrl(imagePath) {
  if (!imagePath) return null;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    if (imagePath.startsWith(IMAGE_URL)) {
      return imagePath;
    } else {
      return imagePath;
    }
  }

  // Ensure IMAGE_URL ends with '/' and imagePath doesn't start with '/'
  const base = IMAGE_URL.endsWith("/") ? IMAGE_URL : IMAGE_URL + "/";
  const path = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;

  return base + path;
}

// const handleNavigate = (link, target = "_blank") => {
//   if (link) window.open(getRemainingPath(link), target);
// };

const handleNavigate = (link) => {
  if (link) window.location.href = getRemainingPath(link);
};

const toKebabCase = (str) =>
  str
    ?.toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "") // Remove special chars
    .replace(/\s+/g, "-"); // Replace spaces with -

const useNavigateToProduct = () => {
  const navigate = useNavigate();

  return (titleOrHandle, id) => {
    if (!titleOrHandle || !id) return;

    // ✅ If already kebab-case (from testimonials API), use as-is
    const isAlreadySlug =
      titleOrHandle.includes("-") &&
      titleOrHandle === titleOrHandle.toLowerCase();

    const slug = isAlreadySlug
      ? titleOrHandle
      : toKebabCase(titleOrHandle);

    navigate(`/product/${slug}`);
  };
};


export {
  getRemainingPath,
  getImageUrl,
  handleNavigate,
  useNavigateToProduct,
  toKebabCase,
};
