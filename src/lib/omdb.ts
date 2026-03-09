import { supabase } from "./supabase";

export type MovieSearchResult = {
  imdbId: string;
  title: string;
  year: string;
  posterUrl: string | null;
  type: string;
};

export async function searchMovies(query: string): Promise<MovieSearchResult[]> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message || "Failed to get session");
  }

  if (!sessionData.session) {
    throw new Error("You are not logged in");
  }

  const { data, error } = await supabase.functions.invoke("movie-search", {
    body: { q: query },
  });

  if (error) {
    throw new Error(error.message || "Movie search failed");
  }

  const results: MovieSearchResult[] = data?.results ?? [];

  const dedupedResults = results.filter(
    (movie: MovieSearchResult, index: number, array: MovieSearchResult[]) =>
      index === array.findIndex((m: MovieSearchResult) => m.imdbId === movie.imdbId)
  );

  return dedupedResults;
}