const nanoId = require('nanoId');

export function id_gen(category) {
    return category + "_" + nanoId.nanoid(10);
}