import { describe, expect, it, test } from 'vitest'
import { nombreMes, numero, rangoMeses } from './formato'

test('nombreMes mapea índices a nombres', () => {
  expect(nombreMes(0)).toBe('enero')
  expect(nombreMes(11)).toBe('diciembre')
  expect(nombreMes(12)).toBe('enero')
})

test('rangoMeses formatea inicio y fin', () => {
  expect(rangoMeses(6, 8)).toBe('julio – septiembre')
  expect(rangoMeses(4, 4)).toBe('mayo')
})

describe('numero', () => {
  it('usa la coma como separador decimal', () => {
    expect(numero(2.88, 2)).toBe('2,88')
    expect(numero(1.2)).toBe('1,2')
  })

  it('no arrastra ceros finales innecesarios', () => {
    expect(numero(6)).toBe('6')
    expect(numero(2.5, 2)).toBe('2,5')
  })

  it('redondea a los decimales pedidos', () => {
    expect(numero(2.88)).toBe('2,9')
    expect(numero(0.04, 2)).toBe('0,04')
  })

  it('por defecto muestra un decimal como mucho', () => {
    expect(numero(3.14159)).toBe('3,1')
  })
})
