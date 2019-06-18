module.exports = {
    onRequest: (test, request) => {
        jest.resetModules();
        request.requestFiltered = true;
    },
}