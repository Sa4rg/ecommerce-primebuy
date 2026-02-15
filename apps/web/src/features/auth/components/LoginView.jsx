import { useState } from "react";
import { useNavigate, Link, useLocation  } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";

export function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setStatus("loading");
      setError("");

      await login({ email, password });

      setStatus("success");
      const from = location.state?.from || "/checkout";
      navigate(from, { replace: true });
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Unknown error");
    }
  }

  return (
    <section>
      <h2>Login</h2>

      {status === "error" && (
        <div role="alert" className="error">
          <p>Something went wrong.</p>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Logging in..." : "Login"}
        </button>
      </form>

      <p>
        No account? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}
