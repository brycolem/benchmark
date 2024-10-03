import 'fake-indexeddb/auto';
window.structuredClone = (item2Clone) => {
    return JSON.parse(JSON.stringify(item2Clone));
}