import Collision from './Collision';
import Entity from '../Entity';
import Vector from '../Vector';

class Physics {
  type: string;

  constructor(type: string = 'normal') {
    this.type = type;
  }

  clone<T>(instance: T): T {
    return Object.assign(
      Object.create(Object.getPrototypeOf(instance)),
      JSON.parse(JSON.stringify(instance))
    );
  }

  update(entity: Entity, entities: Entity[]): void {
    if (this.type === 'normal') {
      entities.forEach((other_entity) => {
        if (other_entity.getComponent(Physics) && entity !== other_entity) {
          if (
            Collision.willBeColliding(
              entity,
              other_entity,
              new Vector(entity.velocity.x, 0)
            )
          ) {
            entity.velocity.x = -Entity.distance(entity, other_entity).x;
          } else if (
            Collision.willBeColliding(
              entity,
              other_entity,
              new Vector(0, entity.velocity.y)
            )
          ) {
            entity.velocity.y = -Entity.distance(entity, other_entity).y;
          }
        }
      });
    }
    if (this.type === 'bounce') {
      entities.forEach((other_entity) => {
        if (other_entity.getComponent(Physics) && entity !== other_entity) {
          if (
            Collision.willBeColliding(
              entity,
              other_entity,
              new Vector(entity.velocity.x, 0)
            )
          ) {
            entity.velocity.x *= -1;
          } else if (
            Collision.willBeColliding(
              entity,
              other_entity,
              new Vector(0, entity.velocity.y)
            )
          ) {
            entity.velocity.y *= -1;
          }
        }
      });
    }
  }

  beforeUpdate(_entity: Entity, _entities: Entity[]) {}
}

export default Physics;
