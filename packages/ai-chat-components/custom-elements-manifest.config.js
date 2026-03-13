/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

export default {
  globs: ["src/**/*.ts"],
  exclude: ["**/__stories__"],
  outdir: ".",
  litelement: true,
  packagejson: false,
  plugins: [
    {
      name: "carbon-element-tag",
      analyzePhase({ ts, node, moduleDoc }) {
        if (!ts.isClassDeclaration(node) || !node.name) {
          return;
        }

        const decorators =
          (typeof ts.getDecorators === "function"
            ? ts.getDecorators(node)
            : node.decorators) ?? [];

        const decorator = decorators.find((decorator) => {
          if (!ts.isCallExpression(decorator.expression)) {
            return false;
          }

          const expression = decorator.expression.expression;
          const decoratorName = ts.isIdentifier(expression)
            ? expression.text
            : ts.isPropertyAccessExpression(expression)
              ? expression.name.text
              : undefined;

          return (
            decoratorName === "carbonElement" &&
            decorator.expression.arguments.length > 0 &&
            ts.isStringLiteral(decorator.expression.arguments[0])
          );
        });

        if (!decorator || !ts.isCallExpression(decorator.expression)) {
          return;
        }

        const tagName = decorator.expression.arguments[0].text;
        moduleDoc.declarations ??= [];
        const declaration = moduleDoc.declarations.find(
          (decl) => decl?.name === node.name?.text,
        );
        if (declaration) {
          declaration.tagName = tagName;
        }
      },
    },
    {
      name: "internal-members",
      analyzePhase({ ts, node, moduleDoc }) {
        // Handle class members (fields, methods, properties)
        if (!ts.isClassDeclaration(node) || !node.name) {
          return;
        }

        const className = node.name.text;
        moduleDoc.declarations ??= [];
        const classDeclaration = moduleDoc.declarations.find(
          (decl) => decl?.name === className,
        );

        if (!classDeclaration || !classDeclaration.members) {
          return;
        }

        // Check each member for @internal JSDoc tag
        node.members.forEach((member) => {
          const memberName = member.name?.getText();
          if (!memberName) {
            return;
          }

          // Get JSDoc comments for this member
          const jsDocTags = ts.getJSDocTags(member);
          const hasInternalTag = jsDocTags.some(
            (tag) => tag.tagName.text === "internal",
          );

          if (hasInternalTag) {
            // Find the corresponding member in the manifest
            const manifestMember = classDeclaration.members.find(
              (m) => m.name === memberName,
            );

            if (manifestMember) {
              // Mark as private to hide from Storybook
              manifestMember.privacy = "private";
            }
          }
        });
      },
    },
  ],
};
