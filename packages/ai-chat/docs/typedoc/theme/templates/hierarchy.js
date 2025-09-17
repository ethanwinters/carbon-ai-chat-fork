/*
 * Copyright IBM Corp. 2025
 */

import { JSX } from "typedoc";
import { getHierarchyRoots } from "../utils/helpers.js";

function renderBranch(context, root, seen) {
  if (seen.has(root)) {
    return JSX.createElement(
      "li",
      { "data-refl": root.id },
      JSX.createElement(
        "a",
        { href: context.urlTo(root) },
        context.reflectionIcon(root),
        root.name,
      ),
    );
  }

  seen.add(root);
  const children = [];
  for (const candidate of [
    ...(root.implementedBy || []),
    ...(root.extendedBy || []),
  ]) {
    if (candidate.reflection) {
      children.push(renderBranch(context, candidate.reflection, seen));
    }
  }

  return JSX.createElement(
    "li",
    {
      "data-refl": root.id,
      id: root.getFullName(),
    },
    JSX.createElement(
      "a",
      { href: context.urlTo(root) },
      context.reflectionIcon(root),
      root.name,
    ),
    !!children.length && JSX.createElement("ul", null, children),
  );
}

export const hierarchyTemplate = (context, props) => {
  const seen = new Set();
  const roots = getHierarchyRoots(props.project);

  return JSX.createElement(
    JSX.Fragment,
    null,
    JSX.createElement("h2", null, "Hierarchy summary"),
    roots.map((root) =>
      JSX.createElement(
        "ul",
        { class: "tsd-full-hierarchy" },
        renderBranch(context, root, seen),
      ),
    ),
  );
};

export default hierarchyTemplate;
