# Guía de Contribución - Backend

## Ramas principales
- **main**: código estable, no hacer push directo. Solo merge desde `develop`.
- **develop**: integración de features terminadas, no push directo. Solo merge desde ramas `feature/*` o `hotfix/*`.

## Ramas de trabajo
- **feature/HU-XXX** → desarrollo de nuevas funcionalidades (HU = Historia de Usuario)
- **hotfix/BUG-YYY** → corrección de bugs críticos (BUG = ID del bug)

## Flujo de Pull Request (PR)
1. Crear rama feature o hotfix desde `develop`.
2. Hacer commits claros y pequeños. Ej: `feat(HU-BE-01): Inicializa proyecto Node.js con Express`
3. Abrir Pull Request hacia `develop`.
4. Revisión obligatoria: al menos 1 aprobador.
5. Estado de CI debe pasar (tests, lint, build).
6. Merge mediante GitHub.
7. Borrar rama feature/hotfix después del merge.

## Buenas prácticas de commits
- Prefijo claro: `feat`, `fix`, `chore`, `docs`, `refactor`
- Referencia a HU o BUG en el commit
- Mensajes cortos y descriptivos

## Código y pruebas
- Seguir las reglas de ESLint y Prettier
- Escribir tests unitarios
- Actualizar documentación si hay cambios funcionales
