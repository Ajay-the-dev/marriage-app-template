// Unsplash photos keep their download name: <photographer>-<photo id>-unsplash.<ext>
// Eg: akhmad-jazuli-zYFqp49xEaM-unsplash.jpg → Akhmad Jazuli, unsplash.com/photos/zYFqp49xEaM
const UNSPLASH_FILE = /([^/]+)-([A-Za-z0-9_-]{11})-unsplash\.\w+$/;

const UTM = "utm_source=wedding_invitation&utm_medium=referral";

// Credit for an Unsplash image path, or null for any other image
export const unsplashCredit = (src) => {
  const match = UNSPLASH_FILE.exec(src || "");
  if (!match) return null;
  const [, slug, id] = match;
  const photographer = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return {
    photographer,
    photoUrl: `https://unsplash.com/photos/${id}?${UTM}`,
    unsplashUrl: `https://unsplash.com/?${UTM}`,
  };
};
