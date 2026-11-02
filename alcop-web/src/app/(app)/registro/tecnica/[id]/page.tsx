'use client'

import { use } from 'react'

import { RegistroFormularioDetalle } from '@/components/modules/registro-formulario-detalle'

export default function RegistroTecnicoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <RegistroFormularioDetalle
      registroId={Number(id)}
      config={{
        apiBase: 'tecnica/registros',
        listHref: '/registro/tecnica',
        permiso: 'TEC_REGISTROS',
        listKey: 'registros-tecnica',
        fechaLabel: 'Fecha de aplicación',
        sinPreguntasAyuda: 'Agrega preguntas al formulario en Formularios.',
      }}
    />
  )
}
