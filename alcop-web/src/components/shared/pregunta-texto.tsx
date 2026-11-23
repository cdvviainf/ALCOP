import { Fragment } from 'react'

// Marcas de revisión en Pregunta.texto (import de MS Forms, 23-11-2026):
//   **texto** → pregunta nueva, en negrita · *Rev* → pregunta similar a revisar, en rojo.
// Se quitan editando el texto en el constructor de formularios.
const MARCAS = /(\*\*[^*]+\*\*|\*Rev\*)/g

export function PreguntaTexto({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(MARCAS).map((parte, i) =>
        parte === '*Rev*' ? (
          <span key={i} className="font-semibold text-red-600">
            *Rev*
          </span>
        ) : parte.startsWith('**') && parte.endsWith('**') && parte.length > 4 ? (
          <strong key={i} className="font-bold">
            {parte.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        ),
      )}
    </>
  )
}
