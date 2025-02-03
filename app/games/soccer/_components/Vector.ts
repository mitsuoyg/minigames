class Vector {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(vector: Vector): void {
    this.x += vector.x;
    this.y += vector.y;
  }

  // Static Methods
  static zero(): Vector {
    return new Vector(0, 0);
  }

  static magnitude(vector: Vector): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  }

  static normalize(vector: Vector): Vector {
    let magnitude = this.magnitude(vector);
    return this.divide(vector, magnitude);
  }

  static add(vector1: Vector, vector2: Vector): Vector {
    return new Vector(vector1.x + vector2.x, vector1.y + vector2.y);
  }

  static subtract(vector1: Vector, vector2: Vector): Vector {
    return new Vector(vector1.x - vector2.x, vector1.y - vector2.y);
  }

  static multiply(vector: Vector, number: number): Vector {
    return new Vector(vector.x * number, vector.y * number);
  }

  static divide(vector: Vector, number: number): Vector {
    if (number == 0) return Vector.zero();
    return new Vector(vector.x / number, vector.y / number);
  }

  static distance(vector1: Vector, vector2: Vector): number {
    return Math.sqrt(
      Math.pow(vector1.x - vector2.x, 2) + Math.pow(vector1.y - vector2.y, 2)
    );
  }
}

export default Vector;
