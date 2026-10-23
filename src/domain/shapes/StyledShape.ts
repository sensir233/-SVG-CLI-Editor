import { Shape } from "../Shape.js";

export abstract class StyledShape extends Shape {
  private _fill: string | undefined;
  private _stroke: string | undefined;
  private _strokeWidth: number | undefined;

  protected constructor(
    id: string,
    fill?: string,
    stroke?: string,
    strokeWidth?: number
  ) {
    super(id);

    this._fill = fill;
    this._stroke = stroke;
    this._strokeWidth =
      strokeWidth === undefined
        ? undefined
        : StyledShape.parseNonNegativeNumber("stroke-width", strokeWidth);
  }

  public get fill(): string | undefined {
    return this._fill;
  }

  public get stroke(): string | undefined {
    return this._stroke;
  }

  public get strokeWidth(): number | undefined {
    return this._strokeWidth;
  }

  public override setAttribute(attribute: string, value: string): void {
    if (this.applyStyleAttribute(attribute, value)) {
      return;
    }

    this.setOwnAttribute(attribute, value);
  }

  protected abstract setOwnAttribute(attribute: string, value: string): void;

  private applyStyleAttribute(attribute: string, value: string): boolean {
    if (attribute === "fill") {
      this._fill = value;
      return true;
    }

    if (attribute === "stroke") {
      this._stroke = value;
      return true;
    }

    if (attribute === "stroke-width") {
      this._strokeWidth = StyledShape.parseNonNegativeNumber(attribute, value);
      return true;
    }

    return false;
  }
}
