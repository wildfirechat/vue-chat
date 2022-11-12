export default class AppServerError extends Error {
    errorCode;

    constructor(errorCode, message) {
        super(message);
        this.errorCode = errorCode;
    }

    toString() {
        return this.errorCode + '-' + this.message;
    }
}
