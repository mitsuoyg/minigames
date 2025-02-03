import Vector from './Vector';

class Camera {
  position: Vector;
  size: Vector;

  constructor(position: Vector = Vector.zero(), size: Vector) {
    this.position = position;
    this.size = size;
  }

  setTarget(entity: { position: Vector }) {
    this.position = entity.position;
  }

  setSize(size: Vector) {
    this.size = size;
  }
}

export default Camera;
