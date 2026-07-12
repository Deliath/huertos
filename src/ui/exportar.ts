import { jsPDF } from 'jspdf'

export function svgAString(svg: SVGSVGElement): string {
  const clon = svg.cloneNode(true) as SVGSVGElement
  clon.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(clon)
}

function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}

async function svgACanvas(svg: SVGSVGElement): Promise<HTMLCanvasElement> {
  const texto = svgAString(svg)
  const blob = new Blob([texto], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('No se pudo cargar el SVG')); img.src = url })
    const canvas = document.createElement('canvas')
    canvas.width = svg.clientWidth || 480
    canvas.height = svg.clientHeight || 480
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
  } finally { URL.revokeObjectURL(url) }
}

export async function descargarPng(svg: SVGSVGElement, nombreArchivo: string): Promise<void> {
  const canvas = await svgACanvas(svg)
  await new Promise<void>((res) => canvas.toBlob((b) => { if (b) descargarBlob(b, nombreArchivo); res() }, 'image/png'))
}

export async function descargarPdf(svg: SVGSVGElement, nombreArchivo: string): Promise<void> {
  const canvas = await svgACanvas(svg)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(nombreArchivo)
}
