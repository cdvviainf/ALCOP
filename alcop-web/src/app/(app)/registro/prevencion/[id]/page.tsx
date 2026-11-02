'use client'

import { use } from 'react'

import { RegistroFormularioDetalle } from '@/components/modules/registro-formulario-detalle'

export default function RegistroDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <RegistroFormularioDetalle
      registroId={Number(id)}
      config={{
        apiBase: 'prevencion/registros',
        listHref: '/registro/prevencion',
        permiso: 'PREV_REGISTROS',
        listKey: 'registros',
        fechaLabel: 'Fecha programada',
        sinPreguntasAyuda:
          'Agrega preguntas al formulario en Formularios y vuelve a agendarlo, o agenda otro formulario que ya tenga preguntas.',
      }}
    />
  )
}
