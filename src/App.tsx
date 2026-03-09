import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { searchMovies, type MovieSearchResult } from "./lib/omdb";

export default function App() {

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setMessage(error.message);
        return;
      }

      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/movie-night/",
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link!");
    }
  };

  const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    setMessage(error.message);
    return;
  }

  setSession(null);
  setResults([]);
  setMessage("Signed out");
};

  const runSearch = async () => {
    try {
      setLoading(true);
      setMessage("");
      const movies = await searchMovies(query);
      setResults(movies);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Movie Night</h1>

      <div style={{ marginBottom: "2rem" }}>
  <h2>Login</h2>

  {session ? (
    <div>
      <p style={{ marginBottom: "0.75rem" }}>
        Logged in as <strong>{session.user.email}</strong>
      </p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  ) : (
    <div>
      <input
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={signIn} style={{ marginLeft: "0.5rem" }}>
        Send Magic Link
      </button>
    </div>
  )}
</div>

      <div style={{ marginBottom: "2rem" }}>
        <h2>Search Movies</h2>
        <input
          placeholder="Search OMDb..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
       <button onClick={runSearch} disabled={!query || loading || !session} style={{ marginLeft: "0.5rem" }}>
        {loading ? "Searching..." : "Search"}
      </button>
      </div>

      {!session && <p style={{ opacity: 0.8 }}>Log in to search movies.</p>}

      {message && <p>{message}</p>}

      <div style={{ display: "grid", gap: "1rem" }}>
        {results.map((movie) => (
          <div
            key={movie.imdbId}
            style={{
              display: "flex",
              gap: "1rem",
              padding: "1rem",
              border: "1px solid #444",
              borderRadius: "8px",
            }}
          >
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                style={{ width: 80, height: 120, objectFit: "cover", borderRadius: 4 }}
              />
            ) : (
              <div style={{ width: 80, height: 120, background: "#333", borderRadius: 4 }} />
            )}

            <div>
              <h3 style={{ margin: 0 }}>{movie.title}</h3>
              <p style={{ margin: "0.5rem 0 0" }}>{movie.year}</p>
              <p style={{ margin: "0.25rem 0 0", opacity: 0.8 }}>{movie.imdbId}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}