import { useState } from 'react'
import type { PerfilSuelo, Textura } from '../dominio/tipos'
import { sueloManual } from '../dominio/suelo'
import { TIPOS_SUELO } from '../datos/suelos'

// Editor de suelo: textura + pH. Si la textura queda "(sin especificar)" emite null,
// para que el paso de suelo posterior siga pidiendo la elección (comportamiento previo).
export function EditorSuelo({ inicial, onCambio }: { inicial: PerfilSuelo | null; onCambio: (s: PerfilSuelo | null) => void }) {
  const [textura, setTextura] = useState<'' | Textura>(inicial?.textura ?? '')
  const [ph, setPh] = useState(inicial ? String(inicial.ph) : '6.5')

  function emitir(t: '' | Textura, p: string) {
    if (t === '') { onCambio(null); return }
    const phNum = Number(p)
    onCambio(sueloManual(t, Number.isFinite(phNum) && phNum > 0 ? phNum : 6.5))
  }

  const info = TIPOS_SUELO.find((x) => x.textura === textura)

  return (
    <section>
      <h3>Tu suelo</h3>
      <label>Tipo de suelo{' '}
        <select
          aria-label="Tipo de suelo"
          value={textura}
          onChange={(e) => { const t = e.target.value as '' | Textura; setTextura(t); emitir(t, ph) }}
        >
          <option value="">(sin especificar)</option>
          {TIPOS_SUELO.map((t) => <option key={t.textura} value={t.textura}>{t.nombre}</option>)}
        </select>
      </label>
      {info && <p><em>{info.descripcion}</em></p>}
      <label>pH{' '}
        <input
          aria-label="pH del suelo"
          type="number" step="0.1" min="0" max="14"
          value={ph}
          disabled={textura === ''}
          onChange={(e) => { setPh(e.target.value); emitir(textura, e.target.value) }}
        />
      </label>
      {textura === '' && <p>Si no lo indicas aquí, podrás elegirlo en el paso siguiente.</p>}
    </section>
  )
}
