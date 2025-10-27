class ErrorResponse extends Error {
  constructor(code, message, description) {
    super(message);
    this.code = code;
    this.description = description;
  }
  
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      description: this.description
    };
  }
}

module.exports = { ErrorResponse };
