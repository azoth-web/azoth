/* compose, composeElement, create, createElement */

function compose(anchor, input, keepLast = false) {
    const type = typeof input;
    switch(true) {
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
            if(!keepLast) clear(anchor);
            break;
        case type === 'number':
            input = `${input}`;
        // eslint-disable-next-line no-fallthrough
        case type === 'string':
        case input instanceof Node:
            replace(anchor, input, keepLast);
            break;
        case type === 'function':
            compose(anchor, input(), keepLast);
            break;
        case input instanceof Promise:
            input.then(value => compose(anchor, value, keepLast));
            break;
        case Array.isArray(input):
            if(!keepLast) clear(anchor);
            composeArray(anchor, input);
            break;
        case type === 'object': {
            composeObject(anchor, input, keepLast);
            break;
        }
        default: {
            throwTypeError(input, type);
        }
    }
}

/* replace and clear */

function replace(anchor, input, keepLast) {
    if(!keepLast) clear(anchor);
    anchor.before(input);
    anchor.data = ++anchor.data;
}

function clear(anchor) {
    let node = anchor;
    let count = +anchor.data;

    while(count--) {
        const { previousSibling } = node;
        if(!previousSibling) break;

        if(previousSibling.nodeType === Node.COMMENT_NODE) {
            // TODO: how to guard for azoth comments only?
            clear(previousSibling);
        }

        clear(previousSibling);
        previousSibling.remove();
    }

    anchor.data = 0;
}


/* complex types */

function composeArray(anchor, array) {
    // TODO: optimize arrays here if Node[]
    for(let i = 0; i < array.length; i++) {
        compose(anchor, array[i], true);
    }
}

function composeObject(anchor, object, keepLast) {
    // TODO: distribute below:
    // if(!keepLast) clear(anchor);

    switch(true) {
        case object instanceof ReadableStream:
            composeStream(anchor, object, true);
            break;
        // w/o the !! this causes intermittent failures :p
        // maybe vitest/node thing?
        case !!object[Symbol.asyncIterator]:
            composeAsyncIterator(anchor, object, keepLast);
            break;
        case !!object.render:
            compose(anchor, object.render(), keepLast);
            break;
        // TODO:
        case !!object.subscribe:
        case !!object.on:
        default: {
            throwTypeErrorForObject(object);
        }
    }
}

async function composeStream(anchor, stream, keepLast) {
    stream.pipeTo(new WritableStream({
        write(chunk) {
            compose(anchor, chunk, keepLast);
        }
    }));
}

async function composeAsyncIterator(anchor, iterator, keepLast) {
    // TODO: use iterator and intercept system messages
    for await(const value of iterator) {
        compose(anchor, value, keepLast);
    }
}


/* thrown errors */

function throwTypeError(input, type, footer = '') {
    throw new TypeError(`\
Invalid compose {...} input type "${type}", value ${input}.\
${footer}`
    );
}

function throwTypeErrorForObject(obj) {
    let message = '';
    try {
        const json = JSON.stringify(obj, null, 2);
        message = `\n\nReceived as:\n\n${json}\n\n`;
    }
    catch(ex) {
        /* no-op */
    }
    throwTypeError(obj, 'object', message);
}

const templates = new Map();

function rendererById(id, isFragment = false) {
    if(templates.has(id)) return templates.get(id);

    const templateEl = document.getElementById(id);
    if(!templateEl) {
        throw new Error(`No template with id "${id}"`);
    }

    return rendererFactory(id, templateEl.content, isFragment);
}

function rendererFactory(id, node, isFragment) {
    const render = renderer(node, isFragment);
    templates.set(id, render);
    return render;
}

function renderer(fragment, isFragment) {
    if(!isFragment) fragment = fragment.firstElementChild;
    // TODO: malformed fragments...necessary?

    return function render() {
        const clone = fragment.cloneNode(true);
        const targets = clone.querySelectorAll('[data-bind]');
        return [clone, targets];
    };
}

const t14720b3874 = rendererById('14720b3874', true);

const ta51edaabfe = rendererById('a51edaabfe');

const t880311674b = rendererById('880311674b');

const tdfc9870d38 = rendererById('dfc9870d38');

const EMOJIS = 'EMOJIS';
async function fetchEmojis() {
    const json = localStorage.getItem(EMOJIS);
    if(json) {
        try {
            return JSON.parse(json);
        }
        catch(ex) {
            // failed parse
            localStorage.removeItem(EMOJIS);
        }
    }
    // await sleep(3000);
    const res = await fetch('https://emojihub.yurace.pro/api/all');
    const emojis = await res.json();

    localStorage.setItem(EMOJIS, JSON.stringify(emojis, true, 4));

    return emojis;
}

const List = fetchEmojis().then(emojis => EmojiList({
  emojis
}));
const App = (() => {
  const [__root, __targets] = t14720b3874(true);
  const __target0 =__targets[0];
  const __child0 = __target0.childNodes[3];
  compose(__child0, List);
  return __root;
})();
document.body.append(App);
function EmojiList({emojis}) {
  const __root = ta51edaabfe()[0];
  const __child0 = __root.childNodes[1];
  compose(__child0, emojis.map(Emoji));
  return __root;
}
function Emoji({name, unicode, htmlCode}) {
  const __root = t880311674b()[0];
  const __child0 = __root.childNodes[1];
  const __child1 = __root.childNodes[3];
  const __child2 = __root.childNodes[5];
  compose(__child0, InnerHtml({
    html: htmlCode.join('')
  }));
  compose(__child1, name);
  compose(__child2, unicode);
  return __root;
}
function InnerHtml({html, className = ''}) {
  const rawEmoji = (() => {
    const __root = tdfc9870d38()[0];
    __root.className = (className ?? '');
    return __root;
  })();
  rawEmoji.firstChild.innerHTML = html;
  return rawEmoji;
}