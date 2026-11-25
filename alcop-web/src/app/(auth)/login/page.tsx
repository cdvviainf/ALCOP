'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const loginSchema = z.object({
  email: z.string().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
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
    // Limpia cualquier caché previa (p. ej. ['me'] de una sesión anterior sin
    // logout limpio) para que el menú/permisos se construyan desde cero.
    queryClient.clear()
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
      {/* Panel izquierdo oscuro — oculto en móvil. Logo vertical naranja + blanco
          (propuesta de gráfica, dirección A). */}
      <aside className="hidden w-1/2 flex-col items-center justify-between bg-panel p-12 text-white lg:flex">
        <div />
        <div className="flex flex-col items-center text-center">
          <Image
            src="/marca/logo-vertical-blanco.png"
            alt="ALCOP Constructora"
            width={800}
            height={424}
            priority
            className="h-auto w-[300px]"
          />
          <p className="mt-10 max-w-sm text-base leading-relaxed text-panel-item">
            Sistema de inspección en terreno: prevención de riesgos e inspección técnica, centralizadas por obra.
          </p>
        </div>
        <p className="text-sm text-panel-muted">© 2026 ALCOP Constructora e Inmobiliaria</p>
      </aside>

      {/* Panel derecho — formulario */}
      <main className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Marca compacta visible solo en móvil */}
          <Image
            src="/marca/logo-horizontal-negro.png"
            alt="ALCOP Constructora"
            width={800}
            height={131}
            priority
            className="mb-10 h-auto w-[180px] lg:hidden"
          />

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
