export default class OrganizationServerError extends Error {
    errorCode;

    constructor(errorCode, message) {
        super(message);
        this.errorCode = errorCode;
    }

    toString() {
        return this.errorCode + '-' + this.message;
    }
}
