export function PantallaInicio({ onEmpezar }: { onEmpezar: () => void }) {
  return (
    <div>
      <h1>🌱 Planifica tu huerto</h1>
      <p>Dinos dónde estás y qué te gustaría cultivar, y te propondremos qué plantar, dónde y cuándo, con una estimación de tu cosecha.</p>
      <button type="button" onClick={onEmpezar}>Crear mi huerto</button>
      <p style={{ marginTop: 24, fontSize: '0.85em', color: '#555' }}>
        Contenido bajo licencia{' '}
        <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY-NC 4.0
        </a>{' '}
        (Reconocimiento – No Comercial).
      </p>
    </div>
  )
}
