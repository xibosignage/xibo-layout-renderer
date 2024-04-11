
export function nextId(options: { idCounter: number; }) {
    if (options.idCounter > 500) {
        options.idCounter = 0;
    }

    options.idCounter = options.idCounter + 1;
    return options.idCounter;
}
