import Collision from './modules/Collision';
import Physics from './modules/Physics';
import Vector from './Vector';

type Component = Physics | Collision;

class Entity {
  tag: string;
  position: Vector;
  size: Vector;
  components: Component[];
  color: string;
  velocity: Vector;
  listeners: { [key: string]: Function };
  [key: string]:
    | undefined
    | number
    | string
    | Vector
    | Function
    | Component[]
    | { [key: string]: Function };

  constructor(
    tag: string,
    position: Vector,
    size: Vector,
    components: Component[] = [],
    color: string = '#000'
  ) {
    this.tag = tag;
    this.position = position;
    this.size = size;
    this.components = components;
    this.color = color;
    this.velocity = Vector.zero();
    this.listeners = {};
  }

  addComponent(component: Component) {
    this.components.push(component);
  }

  getComponent<T>(componentClass: new (...args: any[]) => T): T | undefined {
    return this.components.find(
      (component) => component instanceof componentClass
    ) as T | undefined;
  }

  on(listener: string, callback: Function) {
    this.listeners[listener] = callback;
  }

  static distance(entity1: Entity, entity2: Entity): Vector {
    const vectorA = Vector.subtract(
      Vector.add(entity1.position, Vector.divide(entity1.size, 2)),
      Vector.subtract(entity2.position, Vector.divide(entity2.size, 2))
    );
    const vectorB = Vector.subtract(
      Vector.subtract(entity1.position, Vector.divide(entity1.size, 2)),
      Vector.add(entity2.position, Vector.divide(entity2.size, 2))
    );
    const distanceX =
      Math.abs(vectorA.x) < Math.abs(vectorB.x) ? vectorA.x : vectorB.x;
    const distanceY =
      Math.abs(vectorA.y) < Math.abs(vectorB.y) ? vectorA.y : vectorB.y;
    return new Vector(distanceX, distanceY);
  }

  _beforeUpdate(entities: Entity[]) {
    this.beforeUpdate(this, entities);
    this.components.forEach((component) => {
      if (component.beforeUpdate) component.beforeUpdate(this, entities);
    });
  }

  _update(entities: Entity[]) {
    this.update(this, entities);
    this.components.forEach((component) => {
      if (component.update) component.update(this, entities);
    });
    this.position.add(this.velocity);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(entity: Entity, entities: Entity[]) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  beforeUpdate(entity: Entity, entities: Entity[]) {}
}

export default Entity;
