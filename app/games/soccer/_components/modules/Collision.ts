import Entity from '../Entity';
import Vector from '../Vector';

class Collision {
  constructor() {}

  // TODO: improve cause is not called when is called willcolliding
  update(entity: Entity, entities: Entity[]) {
    // listeners: collision
    entities.forEach((other_entity) => {
      if (
        entity !== other_entity &&
        Collision.isColliding(entity, other_entity)
      ) {
        const collisionListener = entity.listeners.collision;
        if (collisionListener) collisionListener(other_entity);
      }
    });
  }

  static isColliding(entity1: Entity, entity2: Entity): boolean {
    return Collision._isColliding(
      entity1.position,
      entity1.size,
      entity2.position,
      entity2.size
    );
  }

  static willBeColliding(
    entity1: Entity,
    entity2: Entity,
    velocity1: Vector
  ): boolean {
    const new_entity1_position = Vector.add(entity1.position, velocity1);
    return Collision._isColliding(
      new_entity1_position,
      entity1.size,
      entity2.position,
      entity2.size
    );
  }

  static _isColliding(
    position1: Vector,
    size1: Vector,
    position2: Vector,
    size2: Vector
  ): boolean {
    return (
      position1.x - size1.x / 2 < position2.x + size2.x / 2 &&
      position1.x + size1.x / 2 > position2.x - size2.x / 2 &&
      position1.y - size1.y / 2 < position2.y + size2.y / 2 &&
      position1.y + size1.y / 2 > position2.y - size2.y / 2
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  beforeUpdate(entity: Entity, entities: Entity[]) {}
}

export default Collision;
