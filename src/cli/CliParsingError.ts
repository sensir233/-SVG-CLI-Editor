export class CliParsingError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "CliParsingError";
  }
}
