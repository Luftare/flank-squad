import Polygon from "./Polygon";

export default class Obstacle {
  constructor(nodes) {
    this.polygon = new Polygon(nodes);
    this.center = this.polygon.center;
    this.boundingRadius = nodes.reduce((radius, node) => {
      const distanceToCenter = node.distance(this.center);
      return distanceToCenter > radius ? distanceToCenter : radius;
    }, 0);
  }

  pointInside(point) {
    return this.polygon.pointInside(point);
  }
}