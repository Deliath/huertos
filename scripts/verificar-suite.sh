#!/usr/bin/env bash
# Comprueba que la suite de tests es fiable.
#
# El problema que vigila: cuando Vitest no consigue arrancar un proceso de
# trabajo, el archivo afectado no se ejecuta y el resumen no lo distingue de
# los que sí pasaron. Por eso no basta con mirar el código de salida: hay que
# comparar el número de archivos ejecutados con los que hay en el disco.
set -u

ejecuciones=${1:-3}
esperados=$(find src -name '*.test.ts' -o -name '*.test.tsx' | wc -l | tr -d ' ')
fallos=0

echo "Archivos de test en el disco: $esperados"
echo "Ejecuciones a realizar: $ejecuciones"
echo

for i in $(seq 1 "$ejecuciones"); do
  registro=$(mktemp)
  inicio=$SECONDS
  npm test >"$registro" 2>&1
  salida=$?
  duracion=$(( SECONDS - inicio ))

  # Vitest colorea la salida; se quitan los códigos ANSI antes de analizarla.
  limpio=$(mktemp)
  sed -E 's/\x1b\[[0-9;]*m//g' "$registro" >"$limpio"

  archivos=$(sed -nE 's/.*Test Files.*\(([0-9]+)\).*/\1/p' "$limpio" | tail -1)
  tests=$(sed -nE 's/.*[^A-Za-z]Tests +.*\(([0-9]+)\).*/\1/p' "$limpio" | tail -1)
  archivos=${archivos:-0}
  tests=${tests:-0}

  estado="OK"
  if [ "$salida" -ne 0 ]; then estado="FALLO (salida $salida)"; fi
  if [ "$archivos" -ne "$esperados" ]; then estado="FALLO (solo $archivos de $esperados archivos)"; fi

  printf 'Ejecución %s: %s — %s archivos, %s tests, %s s\n' "$i" "$estado" "$archivos" "$tests" "$duracion"

  if [ "$estado" != "OK" ]; then
    fallos=$(( fallos + 1 ))
    echo "  Registro completo en: $registro"
  else
    rm -f "$registro"
  fi
  rm -f "$limpio"
done

echo
if [ "$fallos" -ne 0 ]; then
  echo "La suite NO es fiable: $fallos de $ejecuciones ejecuciones no cumplen el criterio."
  exit 1
fi
echo "La suite es fiable: $ejecuciones de $ejecuciones ejecuciones correctas."
