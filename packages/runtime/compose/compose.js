/* compose, composeElement, create, createElement */
export const IGNORE = Symbol.for('azoth.compose.IGNORE');

export function compose(anchor, input, keepLast, props, slottable) {
    if(keepLast !== true) keepLast = false;
    const type = typeof input;

    switch(true) {
        case input === IGNORE:
            break;
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
            if(!keepLast) clear(anchor);
            break;
        case type === 'number':
        case type === 'bigint':
            input = `${input}`;
        // eslint-disable-next-line no-fallthrough
        case type === 'string':
            replace(anchor, input, keepLast);
            break;
        case input instanceof Node:
            if(props) Object.assign(input, props);
            if(slottable) input.slottable = slottable;
            replace(anchor, input, keepLast);
            break;
        case type === 'function': {
            // will throw if function is class,
            // unlike create or compose element
            let out = slottable
                ? input(props, slottable)
                : props ? input(props) : input();
            compose(anchor, out, keepLast);
            break;
        }
        case type !== 'object': {
            // ES2023: Symbol should be only type  
            throwTypeError(input, type);
            break;
        }
        case input instanceof Promise:
            input.then(value => compose(anchor, value, keepLast, props, slottable));
            break;
        case Array.isArray(input):
            composeArray(anchor, input, keepLast);
            break;
        // w/o the !! this causes intermittent failures :p maybe vitest/node thing?
        case !!input[Symbol.asyncIterator]:
            composeAsyncIterator(anchor, input, keepLast, props, slottable);
            break;
        case input instanceof ReadableStream:
            // no props and slottable propagation on streams
            composeStream(anchor, input, true);
            break;
        case isRenderObject(input): {
            let out = slottable
                ? input.render(props, slottable)
                : props ? input.render(props) : input.render();
            compose(anchor, out, keepLast);
            break;
        }
        // TODO:
        case !!input.subscribe:
        case !!input.on:
        default: {
            throwTypeErrorForObject(input);
        }
    }
}

const isRenderObject = obj => obj && typeof obj === 'object' && obj.render && typeof obj.render === 'function';

export function composeElement(anchor, Constructor, props, slottable) {
    create(Constructor, props, slottable, anchor);
}

export function createElement(Constructor, props, slottable) {
    const result = create(Constructor, props, slottable);
    // result is returned to caller, force to be of type Node
    // and convert strings and numbers into text nodes
    const type = typeof result;
    if(type === 'string' || type === 'number') {
        return document.createTextNode(result);
    }
    return result;
}

function create(input, props, slottable, anchor) {
    const type = typeof input;
    switch(true) {
        case input instanceof Node:
            if(props) Object.assign(input, props);
        // eslint-disable-next-line no-fallthrough
        case type === 'string':
        case type === 'number':
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
            return anchor ? void compose(anchor, input) : input;
        case !!(input.prototype?.constructor): {
            // eslint-disable-next-line new-cap
            const created = new input(props, slottable);
            return isRenderObject(created)
                ? create(created, props, slottable, anchor)
                : create(created, null, null, anchor);
        }
        case type === 'function':
            return create(input(props, slottable), null, null, anchor);
        case type !== 'object': {
            throwTypeError(input, type);
            break;
        }
        case !!input[Symbol.asyncIterator]:
            if(!anchor) anchor = document.createComment('0');
            composeAsyncIterator(anchor, input, false, props, slottable);
            return anchor;
        case isRenderObject(input):
            return create(input.render(props, slottable), null, null, anchor);
        case input instanceof Promise: {
            if(!anchor) anchor = document.createComment('0');
            input.then(value => {
                create(value, props, slottable, anchor);
            });
            return anchor;
        }
        case Array.isArray(input): {
            if(!anchor) anchor = document.createComment('0');
            compose(anchor, input, false);
            return anchor;
        }
        default: {
            throwTypeErrorForObject(input, type);
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

function composeArray(anchor, array, keepLast) {
    if(!keepLast) clear(anchor);
    // TODO: optimize arrays here if Node[]
    for(let i = 0; i < array.length; i++) {
        compose(anchor, array[i], true);
    }
}

async function composeStream(anchor, stream, keepLast) {
    stream.pipeTo(new WritableStream({
        write(chunk) {
            compose(anchor, chunk, keepLast);
        }
    }));
}

async function composeAsyncIterator(anchor, iterator, keepLast, props, slottable) {
    // TODO: use iterator and intercept system messages
    for await(const value of iterator) {
        compose(anchor, value, keepLast, props, slottable);
    }
}

/* thrown errors */

function throwTypeError(input, type, footer = '') {
    // Passing Symbol to `{...}` throws!
    if(type === 'symbol') input = 'Symbol';
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
