export function PantallaInicio({ onEmpezar }: { onEmpezar: () => void }) {
  return (
    <div>
      <h1>🌱 Planifica tu huerto</h1>
      <p>Dinos dónde estás y qué te gustaría cultivar, y te propondremos qué plantar, dónde y cuándo, con una estimación de tu cosecha.</p>
      <button type="button" onClick={onEmpezar}>Crear mi huerto</button>
    </div>
  )
}
