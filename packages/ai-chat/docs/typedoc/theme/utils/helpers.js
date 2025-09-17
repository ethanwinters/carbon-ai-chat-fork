/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import {
  DeclarationReflection,
  ProjectReflection,
  ReferenceReflection,
  ReflectionKind,
  SignatureReflection,
} from "typedoc";

/**
 * Merge CSS class names while dropping falsy entries.
 */
export function classNames(names, extraCss) {
  const css = Object.keys(names)
    .filter((key) => names[key])
    .concat(extraCss || "")
    .join(" ")
    .trim()
    .replace(/\s+/g, " ");

  return css.length ? css : undefined;
}

/**
 * Resolve the reflection kind class, following links across references.
 */
export function getKindClass(reflection) {
  if (reflection instanceof ReferenceReflection) {
    return getKindClass(reflection.getTargetReflectionDeep());
  }

  return ReflectionKind.classString(reflection.kind);
}

/**
 * Determine whether the reflection declares type parameters.
 */
export function hasTypeParameters(reflection) {
  return (
    (reflection instanceof DeclarationReflection ||
      reflection instanceof SignatureReflection) &&
    reflection.typeParameters != null &&
    reflection.typeParameters.length > 0
  );
}

const hierarchyCache = new WeakMap();

/**
 * Build the root class/interface reflections for the hierarchy page.
 */
export function getHierarchyRoots(project) {
  const cached = hierarchyCache.get(project);
  if (cached) {
    return cached;
  }

  const allClasses = project.getReflectionsByKind(
    ReflectionKind.ClassOrInterface,
  );
  const roots = allClasses.filter((refl) => {
    // Skip classes that nothing derives from.
    if (!refl.implementedBy && !refl.extendedBy) {
      return false;
    }

    // If we do not extend or implement anything, we are a root node.
    if (!refl.implementedTypes && !refl.extendedTypes) {
      return true;
    }

    // Otherwise, ensure every extended/implemented type resolves to an external declaration.
    const relatedTypes = [
      ...(refl.implementedTypes || []),
      ...(refl.extendedTypes || []),
    ];

    return relatedTypes.every(
      (type) =>
        !type.visit({
          reference(ref) {
            return ref.reflection !== undefined;
          },
        }),
    );
  });

  const result = roots.sort((a, b) => a.name.localeCompare(b.name));
  hierarchyCache.set(project, result);
  return result;
}

/**
 * Return the display name including version (if present).
 */
export function getDisplayName(reflection) {
  let version = "";

  if (
    (reflection instanceof DeclarationReflection ||
      reflection instanceof ProjectReflection) &&
    reflection.packageVersion
  ) {
    version = ` - v${reflection.packageVersion}`;
  }

  return `${reflection.name}${version}`;
}
