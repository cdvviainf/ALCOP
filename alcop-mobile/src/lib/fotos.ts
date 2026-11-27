import { Alert } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator'

import { api } from './api'

/** Archivo listo para subir en un FormData de React Native. */
export interface ArchivoFoto {
  uri: string
  name: string
  type: string
}

// Lado mayor de la foto antes de subirla: ahorra datos móviles; la API igual la
// optimiza según la calidad configurada.
const LADO_MAX = 2000

async function preparar(asset: ImagePicker.ImagePickerAsset): Promise<ArchivoFoto> {
  const ancho = asset.width ?? 0
  const alto = asset.height ?? 0
  const resize =
    Math.max(ancho, alto) > LADO_MAX ? [{ resize: ancho >= alto ? { width: LADO_MAX } : { height: LADO_MAX } }] : []
  const r = await manipulateAsync(asset.uri, resize, { compress: 0.85, format: SaveFormat.JPEG })
  return { uri: r.uri, name: `foto-${Date.now()}.jpg`, type: 'image/jpeg' }
}

/** Abre la cámara o la galería y devuelve las fotos elegidas (vacío si se cancela). */
export async function elegirFotos(origen: 'camara' | 'galeria', multiples = true): Promise<ArchivoFoto[]> {
  if (origen === 'camara') {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Cámara', 'Debes permitir el acceso a la cámara para tomar fotos.')
      return []
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
    if (res.canceled) return []
    return Promise.all(res.assets.map(preparar))
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.9,
    allowsMultipleSelection: multiples,
    selectionLimit: multiples ? 10 : 1,
  })
  if (res.canceled) return []
  return Promise.all(res.assets.map(preparar))
}

/** Agrega una foto al FormData con el formato que espera React Native. */
export function adjuntar(fd: FormData, campo: string, foto: ArchivoFoto) {
  fd.append(campo, foto as unknown as Blob)
}

function aBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  const paso = 0x8000
  for (let i = 0; i < bytes.length; i += paso) {
    bin += String.fromCharCode(...bytes.subarray(i, i + paso))
  }
  return btoa(bin)
}

/**
 * Foto protegida de la API como data URI. En Android, <Image> no envía el header
 * Cookie, así que se descarga con el cliente autenticado y se cachea por ruta.
 */
export function useFotoRemota(ruta: string) {
  return useQuery({
    queryKey: ['foto', ruta],
    queryFn: async () => {
      const res = await api.get(ruta.replace(/^\/api\//, ''))
      const tipo = res.headers.get('content-type') ?? 'image/jpeg'
      return `data:${tipo};base64,${aBase64(await res.arrayBuffer())}`
    },
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  })
}
