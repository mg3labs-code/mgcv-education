// Shared route constants for student / textbook paths.
// Every component that navigates to a textbook page MUST import from here
// so URLs never diverge again.

export const ROUTES = {
  student: {
    root: "/student",
    textbook: "/student/textbook",
    textbookLab: "/student/textbook-lab",
    episode: (id: string) => `/student/episode/${id}`,
  },
  textbook: {
    root: "/student/textbook",
    chapter: (chapterId: string) => `/student/textbook/${chapterId}`,
    episode: (chapterId: string, episodeId: string) => `/student/textbook/${chapterId}/${episodeId}`,
    episodeWithLayer: (chapterId: string, episodeId: string, layer: string) =>
      `/student/textbook/${chapterId}/${episodeId}?layer=${layer}`,
    episodeWithMode: (chapterId: string, episodeId: string, mode: string) =>
      `/student/textbook/${chapterId}/${episodeId}?mode=${mode}`,
  },
} as const;
