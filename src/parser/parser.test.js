import { beforeEach, describe, test, } from 'vitest';
import { parse } from './index.js';
import { addSerializers } from './serializers.js';

const defaultOptions = { ecmaVersion: 'latest' };
const parseTemplate = (code, options) => {
    options = options ? { ...defaultOptions, ...options } : defaultOptions;
    const ast = parse(code, options);
    return ast.body[0].expression; // remove preamble nodes
};

beforeEach(({ expect }) => addSerializers(expect, { 
    types: ['DomTemplateElement', 'TemplateInterpolator', 'Identifier', 'TemplateElement',] 
}));

describe('normal templates (no transformation)', () => {
    test('template literal', ({ expect }) => {
        const template = parseTemplate(/*html*/`\`<p>hello \${name}!</p>\``);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "end": 23,
            "expressions": [
              { "type": "Identifier", "start": 12, "end": 16, "name": "name" },
            ],
            "quasis": [
              { "type": "TemplateElement", "start": 1, "end": 10, "value": { "raw": "<p>hello ", "cooked": "<p>hello " }, "tail": false },
              { "type": "TemplateElement", "start": 17, "end": 22, "value": { "raw": "!</p>", "cooked": "!</p>" }, "tail": true },
            ],
            "start": 0,
            "type": "TemplateLiteral",
          }
        `);
    });

    test('tagged template literal', ({ expect }) => {
        const template = parseTemplate(/*html*/`tag\`<p>hello \${name}!</p>\``);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "end": 26,
            "quasi": Node {
              "end": 26,
              "expressions": [
                { "type": "Identifier", "start": 15, "end": 19, "name": "name" },
              ],
              "quasis": [
                { "type": "TemplateElement", "start": 4, "end": 13, "value": { "raw": "<p>hello ", "cooked": "<p>hello " }, "tail": false },
                { "type": "TemplateElement", "start": 20, "end": 25, "value": { "raw": "!</p>", "cooked": "!</p>" }, "tail": true },
              ],
              "start": 3,
              "type": "TemplateLiteral",
            },
            "start": 0,
            "tag": { "type": "Identifier", "start": 0, "end": 3, "name": "tag" },
            "type": "TaggedTemplateExpression",
          }
        `);
    });
});

describe('templates', () => {
    test('static template', ({ expect }) => {
        const template = parseTemplate(/*html*/`#\`<p>hello</p>\``);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "binders": [],
            "elements": [],
            "end": 15,
            "expressions": [],
            "html": "<p>hello</p>",
            "rootType": "element",
            "start": 0,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('simple template with single {...} interpolator', ({ expect }) => {
        const template = parseTemplate(/*html*/`#\`<p>hello {name}!</p>\``);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "binders": [
              {
                "end": 12,
                "index": 1,
                "interpolator": { "type": "TemplateInterpolator", "start": 11, "end": 12, "name": "{ " },
                "length": 3,
                "queryIndex": 0,
                "range": [
                  11,
                  12,
                ],
                "replacement": "<text-node></text-node>",
                "start": 11,
                "type": "ChildBinder",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "p", "length": 3, "queryIndex": 0, "start": 1, "end": 2, "range": [1, 2] },
            ],
            "end": 23,
            "expressions": [
              { "type": "Identifier", "start": 12, "end": 16, "name": "name" },
            ],
            "html": "<p data-bind>hello <text-node></text-node>!</p>",
            "rootType": "element",
            "start": 0,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('template with ${...}, {...}, and #{...} interpolators', ({ expect }) => {
        const template = parseTemplate(/*html*/`
            #\`
                <p>hello \${name}!</p>
                <p>count: <span>{count}</span></p>
                <p>#{ block }</p>
            \`
        `);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "binders": [
              {
                "end": 43,
                "index": 1,
                "interpolator": { "type": "TemplateInterpolator", "start": 41, "end": 43, "name": "\${ " },
                "length": 3,
                "queryIndex": 0,
                "range": [
                  41,
                  43,
                ],
                "replacement": "<text-node></text-node>",
                "start": 41,
                "type": "ChildBinder",
              },
              {
                "end": 87,
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 86, "end": 87, "name": "{ " },
                "length": 1,
                "queryIndex": 1,
                "range": [
                  86,
                  87,
                ],
                "replacement": "<text-node></text-node>",
                "start": 86,
                "type": "ChildBinder",
              },
              {
                "end": 126,
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 124, "end": 126, "name": "#{ " },
                "length": 1,
                "queryIndex": 2,
                "range": [
                  124,
                  126,
                ],
                "replacement": "<text-node></text-node>",
                "start": 124,
                "type": "ChildBinder",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "p", "length": 3, "queryIndex": 0, "start": 18, "end": 19, "range": [18, 19] },
              { "type": "DomTemplateElement", "name": "span", "length": 1, "queryIndex": 1, "start": 59, "end": 63, "range": [59, 63] },
              { "type": "DomTemplateElement", "name": "p", "length": 1, "queryIndex": 2, "start": 93, "end": 94, "range": [93, 94] },
            ],
            "end": 152,
            "expressions": [
              { "type": "Identifier", "start": 43, "end": 47, "name": "name" },
              { "type": "Identifier", "start": 87, "end": 92, "name": "count" },
              { "type": "Identifier", "start": 127, "end": 132, "name": "block" },
            ],
            "html": "<p data-bind>hello <text-node></text-node>!</p>
                          <p>count: <span data-bind><text-node></text-node></span></p>
                          <p data-bind><text-node></text-node></p>",
            "rootType": "fragment",
            "start": 13,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('template with complex expression in interpolator', ({ expect }) => {
        const template = parseTemplate(/*html*/`
            #\`<p>{x} + {y} = {x + y}</p>\`
        `);

        expect(template).toMatchInlineSnapshot(`
          Node {
            "binders": [
              {
                "end": 19,
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 18, "end": 19, "name": "{ " },
                "length": 5,
                "queryIndex": 0,
                "range": [
                  18,
                  19,
                ],
                "replacement": "<text-node></text-node>",
                "start": 18,
                "type": "ChildBinder",
              },
              {
                "end": 25,
                "index": 2,
                "interpolator": { "type": "TemplateInterpolator", "start": 24, "end": 25, "name": "{ " },
                "length": 5,
                "queryIndex": 0,
                "range": [
                  24,
                  25,
                ],
                "replacement": "<text-node></text-node>",
                "start": 24,
                "type": "ChildBinder",
              },
              {
                "end": 31,
                "index": 4,
                "interpolator": { "type": "TemplateInterpolator", "start": 30, "end": 31, "name": "{ " },
                "length": 5,
                "queryIndex": 0,
                "range": [
                  30,
                  31,
                ],
                "replacement": "<text-node></text-node>",
                "start": 30,
                "type": "ChildBinder",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "p", "length": 5, "queryIndex": 0, "start": 1, "end": 2, "range": [1, 2] },
            ],
            "end": 42,
            "expressions": [
              { "type": "Identifier", "start": 19, "end": 20, "name": "x" },
              { "type": "Identifier", "start": 25, "end": 26, "name": "y" },
              Node {
                "end": 36,
                "left": { "type": "Identifier", "start": 31, "end": 32, "name": "x" },
                "operator": "+",
                "right": { "type": "Identifier", "start": 35, "end": 36, "name": "y" },
                "start": 31,
                "type": "BinaryExpression",
              },
            ],
            "html": "<p data-bind><text-node></text-node> + <text-node></text-node> = <text-node></text-node></p>",
            "rootType": "element",
            "start": 13,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('property binders', ({ expect }) => {
        
        const template = parseTemplate(`
            #\`
                <p class={type}>hello!</p>
                <input required={isRequired} name="title">
                <div style="color: red" class={sectionType}></div>
            \`;        
        `);
        
        expect(template).toMatchInlineSnapshot(`
          Node {
            "binders": [
              {
                "attribute": "class",
                "end": 42,
                "interpolator": { "type": "TemplateInterpolator", "start": 41, "end": 42, "name": "{ " },
                "name": "class",
                "property": "className",
                "queryIndex": 0,
                "range": [
                  41,
                  42,
                ],
                "start": 41,
                "type": "PropertyBinder",
              },
              {
                "attribute": "required",
                "end": 92,
                "interpolator": { "type": "TemplateInterpolator", "start": 91, "end": 92, "name": "{ " },
                "name": "required",
                "property": "required",
                "queryIndex": 1,
                "range": [
                  91,
                  92,
                ],
                "start": 91,
                "type": "PropertyBinder",
              },
              {
                "attribute": "class",
                "end": 165,
                "interpolator": { "type": "TemplateInterpolator", "start": 164, "end": 165, "name": "{ " },
                "name": "class",
                "property": "className",
                "queryIndex": 2,
                "range": [
                  164,
                  165,
                ],
                "start": 164,
                "type": "PropertyBinder",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "p", "length": 1, "queryIndex": 0, "start": 18, "end": 19, "range": [18, 19] },
              { "type": "DomTemplateElement", "name": "input", "length": 0, "queryIndex": 1, "start": 57, "end": 62, "range": [57, 62] },
              { "type": "DomTemplateElement", "name": "div", "length": 0, "queryIndex": 2, "start": 106, "end": 109, "range": [106, 109] },
            ],
            "end": 198,
            "expressions": [
              { "type": "Identifier", "start": 42, "end": 46, "name": "type" },
              { "type": "Identifier", "start": 92, "end": 102, "name": "isRequired" },
              { "type": "Identifier", "start": 165, "end": 176, "name": "sectionType" },
            ],
            "html": "<p data-bind>hello!</p>
                          <input name="title" data-bind>
                          <div style="color: red" data-bind></div>",
            "rootType": "fragment",
            "start": 13,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('property and child binders', ({ expect }) => {
        
        const template = parseTemplate(`
            #\`
            <section>
                <h2 class="item-header">{title}</h2>
                <p class={category}>
                    <span class={type}>Hello</span> {name}!
                    {description}
                </p>
            </section>
            \`;
        `);
        
        expect(template).toMatchInlineSnapshot(`
          Node {
            "binders": [
              {
                "end": 79,
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 78, "end": 79, "name": "{ " },
                "length": 1,
                "queryIndex": 0,
                "range": [
                  78,
                  79,
                ],
                "replacement": "<text-node></text-node>",
                "start": 78,
                "type": "ChildBinder",
              },
              {
                "attribute": "class",
                "end": 117,
                "interpolator": { "type": "TemplateInterpolator", "start": 116, "end": 117, "name": "{ " },
                "name": "class",
                "property": "className",
                "queryIndex": 1,
                "range": [
                  116,
                  117,
                ],
                "start": 116,
                "type": "PropertyBinder",
              },
              {
                "attribute": "class",
                "end": 161,
                "interpolator": { "type": "TemplateInterpolator", "start": 160, "end": 161, "name": "{ " },
                "name": "class",
                "property": "className",
                "queryIndex": 2,
                "range": [
                  160,
                  161,
                ],
                "start": 160,
                "type": "PropertyBinder",
              },
              {
                "end": 181,
                "index": 3,
                "interpolator": { "type": "TemplateInterpolator", "start": 180, "end": 181, "name": "{ " },
                "length": 7,
                "queryIndex": 1,
                "range": [
                  180,
                  181,
                ],
                "replacement": "<text-node></text-node>",
                "start": 180,
                "type": "ChildBinder",
              },
              {
                "end": 209,
                "index": 5,
                "interpolator": { "type": "TemplateInterpolator", "start": 208, "end": 209, "name": "{ " },
                "length": 7,
                "queryIndex": 1,
                "range": [
                  208,
                  209,
                ],
                "replacement": "<text-node></text-node>",
                "start": 208,
                "type": "ChildBinder",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "h2", "length": 1, "queryIndex": 0, "start": 40, "end": 42, "range": [40, 42] },
              { "type": "DomTemplateElement", "name": "p", "length": 7, "queryIndex": 1, "start": 86, "end": 87, "range": [86, 87] },
              { "type": "DomTemplateElement", "name": "span", "length": 1, "queryIndex": 2, "start": 119, "end": 123, "range": [119, 123] },
            ],
            "end": 279,
            "expressions": [
              { "type": "Identifier", "start": 79, "end": 84, "name": "title" },
              { "type": "Identifier", "start": 117, "end": 125, "name": "category" },
              { "type": "Identifier", "start": 161, "end": 165, "name": "type" },
              { "type": "Identifier", "start": 181, "end": 185, "name": "name" },
              { "type": "Identifier", "start": 209, "end": 220, "name": "description" },
            ],
            "html": "<section>
                          <h2 class="item-header" data-bind><text-node></text-node></h2>
                          <p data-bind>
                              <span data-bind>Hello</span> <text-node></text-node>!
                              <text-node></text-node>
                          </p>
                      </section>",
            "rootType": "fragment",
            "start": 13,
            "type": "DomTemplateLiteral",
          }
        `);
    });

    test('nested template', ({ expect }) => {
        
        const template = parseTemplate(`
            #\`<p>#{ isVip ? #\`<span>VIP</span>\` : #\`guest\` }</p>\`;
        `);
        
        expect(template).toMatchInlineSnapshot(`
          Node {
            "binders": [
              {
                "end": 20,
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 18, "end": 20, "name": "#{ " },
                "length": 1,
                "queryIndex": 0,
                "range": [
                  18,
                  20,
                ],
                "replacement": "<text-node></text-node>",
                "start": 18,
                "type": "ChildBinder",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "p", "length": 1, "queryIndex": 0, "start": 1, "end": 2, "range": [1, 2] },
            ],
            "end": 66,
            "expressions": [
              Node {
                "alternate": Node {
                  "binders": [],
                  "elements": [],
                  "end": 59,
                  "expressions": [],
                  "html": "guest",
                  "rootType": "text",
                  "start": 51,
                  "type": "DomTemplateLiteral",
                },
                "consequent": Node {
                  "binders": [],
                  "elements": [],
                  "end": 48,
                  "expressions": [],
                  "html": "<span>VIP</span>",
                  "rootType": "element",
                  "start": 29,
                  "type": "DomTemplateLiteral",
                },
                "end": 59,
                "start": 21,
                "test": { "type": "Identifier", "start": 21, "end": 26, "name": "isVip" },
                "type": "ConditionalExpression",
              },
            ],
            "html": "<p data-bind><text-node></text-node></p>",
            "rootType": "element",
            "start": 13,
            "type": "DomTemplateLiteral",
          }
        `);
    });
});

describe('source locations, ranges', () => {

    test('elements', ({ expect, parser }) => {
        const template = parseTemplate(
            /*html*/`#\`
                <p>{text1}</p>
                <p>{text2}</p>\`
            `,
            { locations: true, ranges: true });

        expect(template).toMatchInlineSnapshot(`
          Node {
            "binders": [
              {
                "end": 23,
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 22, "end": 23, "loc": { "start": { "line": 2, "column": 19 }, "end": { "line": 2, "column": 20 } }, "range": [22, 23], "name": "{ " },
                "length": 1,
                "queryIndex": 0,
                "range": [
                  22,
                  23,
                ],
                "replacement": "<text-node></text-node>",
                "start": 22,
                "type": "ChildBinder",
              },
              {
                "end": 54,
                "index": 0,
                "interpolator": { "type": "TemplateInterpolator", "start": 53, "end": 54, "loc": { "start": { "line": 3, "column": 19 }, "end": { "line": 3, "column": 20 } }, "range": [53, 54], "name": "{ " },
                "length": 1,
                "queryIndex": 1,
                "range": [
                  53,
                  54,
                ],
                "replacement": "<text-node></text-node>",
                "start": 53,
                "type": "ChildBinder",
              },
            ],
            "elements": [
              { "type": "DomTemplateElement", "name": "p", "length": 1, "queryIndex": 0, "start": 18, "end": 19, "range": [18, 19] },
              { "type": "DomTemplateElement", "name": "p", "length": 1, "queryIndex": 1, "start": 42, "end": 43, "range": [42, 43] },
            ],
            "end": 65,
            "expressions": [
              { "type": "Identifier", "start": 23, "end": 28, "loc": { "start": { "line": 2, "column": 20 }, "end": { "line": 2, "column": 25 } }, "range": [23, 28], "name": "text1" },
              { "type": "Identifier", "start": 54, "end": 59, "loc": { "start": { "line": 3, "column": 20 }, "end": { "line": 3, "column": 25 } }, "range": [54, 59], "name": "text2" },
            ],
            "html": "<p data-bind><text-node></text-node></p>
                          <p data-bind><text-node></text-node></p>",
            "loc": SourceLocation {
              "end": Position {
                "column": 31,
                "line": 3,
              },
              "start": Position {
                "column": 0,
                "line": 1,
              },
            },
            "range": [
              0,
              65,
            ],
            "rootType": "fragment",
            "start": 0,
            "type": "DomTemplateLiteral",
          }
        `);
    });
});