import { useState } from "react";
  import { useNavigate } from "react-router-dom";

  import { api } from "../../../lib/api/client";

  type LoginResponse = {
    accessToken: string;
    refreshToken: string;
    userId: number;
    fullName: string;
    email: string;
    role: string;
  };

  export function LoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("admin@clinic.local");
    const [password, setPassword] = useState("Admin123*");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();

      try {
        setLoading(true);
        setError("");

        const response = await api.post<LoginResponse>("/auth/login", {
          email,
          password,
        });

        localStorage.setItem("access_token", response.data.accessToken);
        localStorage.setItem("refresh_token", response.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(response.data));

        navigate("/");
      } catch {
        setError("No se pudo iniciar sesión. Revisa el correo y contraseña.");
      } finally {
        setLoading(false);
      }
    }

    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xl font-black text-white">
              OC
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              Iniciar sesión
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Entra al panel administrativo de OdontoCitas Pro.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Correo</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="admin@clinicadental.com"
                type="email"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Contraseña
              </span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="********"
                type="password"
              />
            </label>

            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </section>
      </main>
    );
  }