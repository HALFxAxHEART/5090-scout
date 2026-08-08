import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPCClient, useTRPC } from "../../lib/trpc";

export function SignupForm() {
  const trpcClient = useTRPCClient();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await trpcClient.auth.register.mutate({ displayName, email, password });
      await queryClient.invalidateQueries({ queryKey: trpc.auth.me.queryKey() });
      await navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="displayName">Name</label>
        <input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="button primary" disabled={submitting}>
        {submitting ? "Creating account…" : "Sign up"}
      </button>
    </form>
  );
}
