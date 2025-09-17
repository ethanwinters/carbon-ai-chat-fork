/*
 * Copyright IBM Corp. 2025
 */

import { JSX, DeclarationReflection, ReflectionKind } from "typedoc";
import {
  classNames,
  getKindClass,
  hasTypeParameters,
} from "../utils/helpers.js";

function renderIndexSignature(context, index) {
  return JSX.createElement(
    "li",
    {
      class: classNames(
        {
          "tsd-index-signature": true,
        },
        context.getReflectionClasses(index),
      ),
    },
    JSX.createElement(
      "div",
      { class: "tsd-signature" },
      index.flags.isReadonly &&
        JSX.createElement(
          JSX.Fragment,
          null,
          JSX.createElement(
            "span",
            { class: "tsd-signature-keyword" },
            "readonly",
          ),
          " ",
        ),
      JSX.createElement("span", { class: "tsd-signature-symbol" }, "["),
      index.parameters.map((item) =>
        JSX.createElement(
          JSX.Fragment,
          null,
          JSX.createElement("span", { class: getKindClass(item) }, item.name),
          ": ",
          context.type(item.type),
        ),
      ),
      JSX.createElement("span", { class: "tsd-signature-symbol" }, "]:"),
      " ",
      context.type(index.type),
    ),
    context.commentSummary(index),
    context.commentTags(index),
    context.typeDetailsIfUseful(index, index.type),
  );
}

export const reflectionTemplate = (context, props) => {
  if (
    props.model.kindOf(ReflectionKind.TypeAlias | ReflectionKind.Variable) &&
    props.model instanceof DeclarationReflection &&
    props.model.type
  ) {
    return context.memberDeclaration(props.model);
  }

  if (
    props.model.kindOf(ReflectionKind.ExportContainer) &&
    (props.model.isDeclaration() || props.model.isProject())
  ) {
    return context.moduleReflection(props.model);
  }

  return JSX.createElement(
    JSX.Fragment,
    null,
    props.model.hasComment() &&
      JSX.createElement(
        "section",
        { class: "tsd-panel tsd-comment" },
        context.commentSummary(props.model),
        context.commentTags(props.model),
      ),
    context.reflectionPreview(props.model),
    hasTypeParameters(props.model) &&
      JSX.createElement(
        JSX.Fragment,
        null,
        context.typeParameters(props.model.typeParameters),
      ),
    props.model instanceof DeclarationReflection &&
      JSX.createElement(
        JSX.Fragment,
        null,
        context.hierarchy(props.model.typeHierarchy),
        !!props.model.implementedTypes &&
          JSX.createElement(
            "section",
            { class: "tsd-panel" },
            JSX.createElement("h4", null, "Implements"),
            JSX.createElement(
              "ul",
              { class: "tsd-hierarchy" },
              props.model.implementedTypes.map((item) =>
                JSX.createElement("li", null, context.type(item)),
              ),
            ),
          ),
        !!props.model.implementedBy &&
          JSX.createElement(
            "section",
            { class: "tsd-panel" },
            JSX.createElement("h4", null, "Implemented by"),
            JSX.createElement(
              "ul",
              { class: "tsd-hierarchy" },
              props.model.implementedBy.map((item) =>
                JSX.createElement("li", null, context.type(item)),
              ),
            ),
          ),
        !!props.model.signatures?.length &&
          JSX.createElement(
            "section",
            { class: "tsd-panel" },
            context.memberSignatures(props.model),
          ),
        !!props.model.indexSignatures?.length &&
          JSX.createElement(
            "section",
            { class: "tsd-panel" },
            JSX.createElement(
              "h4",
              { class: "tsd-before-signature" },
              "Indexable",
            ),
            JSX.createElement(
              "ul",
              { class: "tsd-signatures" },
              props.model.indexSignatures.map((index) =>
                renderIndexSignature(context, index),
              ),
            ),
          ),
        !props.model.signatures && context.memberSources(props.model),
      ),
    !!props.model.childrenIncludingDocuments?.length &&
      context.index(props.model),
    context.members(props.model),
  );
};

export default reflectionTemplate;
