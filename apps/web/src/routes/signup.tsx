import { createFileRoute } from "@tanstack/react-router";
import { SignupForm } from "../features/auth/SignupForm";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="page page-narrow">
      <h1>Sign up</h1>
      <p className="muted">The first account created becomes admin; everyone after is a scout.</p>
      <SignupForm />
    </div>
  );
}
