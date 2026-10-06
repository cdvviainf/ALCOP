'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowUp } from 'lucide-react'

import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const loginSchema = z.object({
  email: z.string().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

type LoginForm = z.infer<typeof loginSchema>

/** Marca ALCOP: casa/flecha-arriba en trazo naranja + wordmark. */
function BrandMark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="flex items-center justify-center rounded-md border-2 border-primary p-1.5">
        <ArrowUp className="size-5 text-primary" strokeWidth={2.5} />
      </span>
    </span>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Autenticación real contra Better Auth (proxy same-origin → alcop-api).
  const onSubmit = async (data: LoginForm) => {
    setAuthError(null)
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setAuthError('Credenciales inválidas. Verifica tu usuario y contraseña.')
      return
    }
    const from =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('from')
        : null
    // Solo rutas locales same-origin: `//evil.com` o `/\evil.com` son redirect
    // abierto (el browser los resuelve como cross-origin) — se descartan.
    const destino =
      from && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/\\')
        ? from
        : '/obras'
    router.push(destino)
    router.refresh()
  }

  return (
    <div className="flex min-h-svh">
      {/* Panel izquierdo oscuro — oculto en móvil */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-panel p-12 text-white lg:flex">
        {/* Marca de agua: contorno de casa muy tenue */}
        <svg
          aria-hidden
          viewBox="0 0 400 400"
          className="pointer-events-none absolute -top-10 left-1/2 w-[120%] -translate-x-1/2 text-white/[0.03]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M40 200 L200 60 L360 200" />
          <path d="M90 190 L90 360 L310 360 L310 190" />
        </svg>

        <div className="relative z-10 flex items-center gap-3">
          <BrandMark />
          <div className="leading-tight">
            <div className="text-xl font-bold tracking-wide text-white">ALCOP</div>
            <div className="text-[11px] font-medium tracking-[0.18em] text-label">
              CONSTRUCTORA E INMOBILIARIA
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Sistema de Inspección en Terreno
          </h1>
          <p className="mt-5 text-base leading-relaxed text-panel-item">
            Prevención de riesgos e inspección de obra, centralizadas por proyecto.
          </p>
        </div>

        <p className="relative z-10 text-sm text-panel-muted">
          © 2026 ALCOP Constructora e Inmobiliaria
        </p>
      </aside>

      {/* Panel derecho — formulario */}
      <main className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Marca compacta visible solo en móvil */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <div className="text-lg font-bold tracking-wide text-foreground">ALCOP</div>
          </div>

          <p className="text-xs font-semibold tracking-[0.18em] text-primary">
            ACCESO AL SISTEMA
          </p>
          <h2 className="mt-2 text-3xl font-bold text-foreground">Ingresa a tu cuenta</h2>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-9 space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs font-semibold tracking-[0.12em] text-label"
              >
                USUARIO
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@alcop.cl"
                autoComplete="email"
                className="h-12 rounded-lg bg-secondary px-4 text-sm"
                {...register('email')}
              />
              {errors.email ? (
                <p className="text-sm text-warn-fg">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold tracking-[0.12em] text-label"
              >
                CONTRASEÑA
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-12 rounded-lg bg-secondary px-4 text-sm"
                {...register('password')}
              />
              {errors.password ? (
                <p className="text-sm text-warn-fg">{errors.password.message}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                />
                Recordarme
              </label>
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:text-primary-hover"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {authError ? (
              <p className="text-sm font-medium text-warn-fg">{authError}</p>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <div className="my-7 h-px w-full bg-border" />

          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Acceso por obra — roles: Administrador, Jefe de Terreno y Prevencionista
          </p>
        </div>
      </main>
    </div>
  )
}
