# Diferencias entre `origin/main` vs `origin/master`

- Generado: 2026-01-21 21:54
- Rama actual (al generar): master

## Lectura rápida

- `origin/main` está **594 commits por detrás** de `origin/master`.
- `origin/main` no tiene commits adicionales respecto a `origin/master` (0 ahead).

## Resumen (ahead/behind)

Comando:
```bash
git rev-list --left-right --count origin/master...origin/main
```

Resultado:
```text
5940
```

Interpretación:
- **594** = commits que existen en `origin/master` y NO existen en `origin/main`.
- **0** = commits que existen en `origin/main` y NO existen en `origin/master`.

## Commits únicos (detalle)

Para ver el listado completo (puede ser largo), ejecuta:
```bash
git log --left-right --cherry-pick --oneline origin/master...origin/main
```

Guía de lectura:
- Prefijo `<` = commit está en `origin/master`.
- Prefijo `>` = commit está en `origin/main`.

## Archivos diferentes (resumen)

Para ver el resumen por archivo:
```bash
git diff --name-status origin/master..origin/main
```

Para invertir la comparación:
```bash
git diff --name-status origin/main..origin/master
```

## Recomendación

Si el objetivo es alinear `origin/main` al estado actual, lo correcto es sincronizar `origin/main` con `origin/master` bajo el proceso del repo (merge/fast-forward o estrategia aprobada).
