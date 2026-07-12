import type { Textura, Drenaje } from '../dominio/tipos'

export interface TipoSueloInfo {
  textura: Textura
  nombre: string
  drenajeTipico: Drenaje
  descripcion: string
}

export const TIPOS_SUELO: TipoSueloInfo[] = [
  { textura: 'arenoso', nombre: 'Arenoso', drenajeTipico: 'bueno', descripcion: 'Ligero y suelto, drena rápido; retiene poca agua y nutrientes.' },
  { textura: 'franco', nombre: 'Franco', drenajeTipico: 'bueno', descripcion: 'Equilibrado entre arena, limo y arcilla; el ideal para huerto.' },
  { textura: 'arcilloso', nombre: 'Arcilloso', drenajeTipico: 'malo', descripcion: 'Pesado y compacto, retiene mucha agua; puede encharcarse.' },
]

export const GUIA_EXPERIMENTACION: { titulo: string; pasos: string[] }[] = [
  {
    titulo: 'Prueba del bote (sedimentación)',
    pasos: [
      'Llena un bote de cristal 1/3 con tierra del bancal y el resto con agua.',
      'Agita fuerte un minuto y déjalo reposar 24 horas.',
      'Se formarán capas: la arena abajo, el limo en medio y la arcilla arriba.',
      'La capa más gruesa indica la textura dominante de tu suelo.',
    ],
  },
  {
    titulo: 'Prueba del rollito (a mano)',
    pasos: [
      'Humedece un poco de tierra y amásala.',
      'Si puedes hacer un rollito fino que no se rompe, es arcilloso.',
      'Si se deshace enseguida y notas los granos, es arenoso.',
      'Si hace un rollito que se agrieta, es franco.',
    ],
  },
  {
    titulo: 'Prueba de drenaje',
    pasos: [
      'Cava un hoyo de unos 30 cm y llénalo de agua; deja que se vacíe.',
      'Vuelve a llenarlo y mide cuánto tarda en filtrar.',
      'Menos de 1-2 horas: drenaje bueno. Varias horas: drenaje malo (arcilloso).',
    ],
  },
  {
    titulo: 'Nota sobre el pH',
    pasos: [
      'La mayoría de hortalizas prefieren pH 6-7 (ligeramente ácido a neutro).',
      'Puedes medirlo con tiras/kit de jardinería baratos.',
      'Si no lo mides, asume un pH neutro; corrige solo si notas problemas.',
    ],
  },
]
