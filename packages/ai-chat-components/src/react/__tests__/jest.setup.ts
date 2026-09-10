/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import '@carbon/web-components/es/components/feature-flags/index.js';

// Run the suite under Carbon's v12 behavior.
//
// Carbon resolves a render-time flag by walking up to the nearest
// `<feature-flags>` ancestor, so a component only sees the flag when it is
// mounted inside one. Testing Library appends its container straight to
// `document.body`, which would make it a sibling of the scope rather than a
// descendant. Redirect those appends into the scope.
//
// This runs once per test file, not per test: patching in `beforeEach` would
// re-bind an already-patched `appendChild`, nesting each test's scope inside
// the previous one.
const scope = document.createElement('feature-flags');
scope.setAttribute('enable-v12-release', '');
const appendToBody = document.body.appendChild.bind(document.body);
const removeFromBody = document.body.removeChild.bind(document.body);
appendToBody(scope);
document.body.appendChild = (node: any) =>
  node === scope ? appendToBody(node) : scope.appendChild(node);
document.body.removeChild = (node: any) =>
  node.parentNode === scope ? scope.removeChild(node) : removeFromBody(node);

beforeEach(() => {
  // Mock DOMParser for icon transformation tests
  if (typeof DOMParser === 'undefined') {
    (global as any).DOMParser = class DOMParser {
      parseFromString(str: string, _type: string) {
        // Simple mock for testing - in real browser this would parse the string
        const doc = {
          querySelector: (selector: string) => {
            if (selector === 'svg' && str.includes('<svg')) {
              // Extract attributes from SVG string
              const viewBoxMatch = str.match(/viewBox="([^"]*)"/);
              const fillMatch = str.match(/fill="([^"]*)"/);
              const xmlnsMatch = str.match(/xmlns="([^"]*)"/);

              // Extract path data
              const pathMatch = str.match(/<path[^>]*d="([^"]*)"[^>]*>/);

              const mockSVG = {
                tagName: 'svg',
                getAttribute: (attr: string) => {
                  if (attr === 'viewBox') {
                    return viewBoxMatch ? viewBoxMatch[1] : '0 0 32 32';
                  }
                  if (attr === 'fill') {
                    return fillMatch ? fillMatch[1] : 'currentColor';
                  }
                  if (attr === 'xmlns') {
                    return xmlnsMatch
                      ? xmlnsMatch[1]
                      : 'http://www.w3.org/2000/svg';
                  }
                  return null;
                },
                childNodes: pathMatch
                  ? [
                      {
                        nodeType: 1, // ELEMENT_NODE
                        tagName: 'path',
                        attributes: [
                          {
                            name: 'd',
                            value: pathMatch[1],
                          },
                        ],
                      },
                    ]
                  : [],
                cloneNode: function (_deep: boolean) {
                  return this;
                },
              };

              return mockSVG;
            }
            return null;
          },
        };
        return doc;
      }
    };
  }

  // Mock Node constants if not available
  if (typeof Node === 'undefined') {
    (global as any).Node = {
      ELEMENT_NODE: 1,
      TEXT_NODE: 3,
    };
  }
});
