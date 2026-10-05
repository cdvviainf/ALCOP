import { Folder } from 'lucide-react'
import { EmptyPage } from '@/components/shared/empty-page'

export default function BibliotecaPage() {
  return (
    <EmptyPage
      title="Biblioteca"
      description="Documentos y reportes PDF generados."
      icon={Folder}
    />
  )
}
