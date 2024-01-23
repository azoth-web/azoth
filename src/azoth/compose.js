
export function compose(input, anchor, keepLast = false) {
    const type = typeof input;
    switch(true) {
        case input === undefined:
        case input === null:
        case input === true:
        case input === false:
        case input === '':
            if(!keepLast) removePrior(anchor);
            break;
        case type === 'string':
        case type === 'number':
        case input instanceof Node: {
            inject(input, anchor, keepLast);
            break;
        }
        case type === 'function':
            compose(input(), anchor, keepLast);
            break;
        case input instanceof Promise:
            input.then(v => compose(v, anchor, keepLast));
            break;
        case Array.isArray(input):
            composeArray(input, anchor, keepLast);
            break;
        default: {
            throwInvalidType(input, type);
        }

    }
}

function throwInvalidType(input, type) {
    let json = '';
    try {
        if(type === 'object') json = JSON.stringify(input, null, 2);
    }
    finally { /* empty */ }

    let message = `Invalid dom-block compose input type "${type}", value ${input}.`;
    if(json) message += `\n\nReceived as:\n\n${json}\n\n`;

    throw new TypeError(message);
}

function removePrior(anchor) {
    const count = +anchor.data;
    if(count > 0 && tryRemovePrior(anchor)) anchor.data = `${count - 1}`;
}

function inject(input, anchor, keepLast) {
    let count = +anchor.data;
    if(!keepLast && count > 0 && tryRemovePrior(anchor)) count--;
    anchor.before(input);
    anchor.data = `${count + 1}`;
}

// TODO: array in array with replace param
function composeArray(array, anchor) {
    for(let i = 0; i < array.length; i++) {
        compose(array[i], anchor, true);
    }
}

function tryRemovePrior({ previousSibling }) {
    return previousSibling ? (previousSibling.remove(), true) : false;
}
