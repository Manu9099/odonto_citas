export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
        <div className="hidden bg-slate-950 p-10 text-white lg:block">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">OdontoCitas Pro</p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight">Gestiona tu clínica con una experiencia premium.</h1>
          <p className="mt-4 max-w-md text-sm text-slate-300">
           Agenda, pacientes, pagos y recordatorios en una sola plataforma.
                    </p>
                  </div>
                  <div className="flex items-center justify-center p-8 md:p-12">
                    <div className="w-full max-w-md space-y-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-950">Iniciar sesión</h2>
                        <p className="mt-1 text-sm text-slate-500">Entra al panel administrativo de la clínica.</p>
                      </div>
                              <form className="space-y-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-slate-700">Correo</label>
                                      <input className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950" placeholder="admin@clinicadental.com" />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-slate-700">Contraseña</label>
                                      <input type="password" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950" placeholder="••••••••" />
                                    </div>
                                        <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:opacity-95">
                                                    Entrar
                                                  </button>
                                                </form>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                          );
                                        }