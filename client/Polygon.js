import Vector from 'vector';

export default class Polygon {
  constructor(nodes) {
    if (Vector === undefined) throw new Error("No Vector class defined.");
    this.nodes = nodes;
  }

  get center() {
    const center = new Vector(0, 0);
    this.nodes.forEach(n => center.add(n));
    return center.scale(1 / this.nodes.length);
  }

  pointInside(p) {
    let intersects = 0;
    const pointEnd = (new Vector()).set(p.x, 99999999999);
    this.nodes.forEach((n, i) => {
      let nextIndex = (i + 1) % this.nodes.length;
      let nextNode = this.nodes[nextIndex];
      if (this._linesIntersect(n, nextNode, p, pointEnd)) {
        intersects += 1;
      }
    });
    return !!(intersects % 2);
  }

  segmentIntersects(start, end) {
    let intersects = this.nodes.find((n, i) => {
      let nextIndex = (i + 1) % this.nodes.length;
      let nextNode = this.nodes[nextIndex];
      return this._linesIntersect(n, nextNode, start, end);
    });
    return !!intersects;
  }

  scale(a) {
    this.nodes.forEach(n => n.scale(a));
    return this;
  }

  closestVertex(p) {
    const normal = new Vector();
    let minSq = Infinity;
    let minIndex = 0;
    this.nodes.forEach((n, i) => {
      let nextIndex = (i + 1) % this.nodes.length;
      let distSq = n.segmentDistanceSq(this.nodes[nextIndex], p);
      if (distSq < minSq) {
        minSq = distSq;
        minIndex = i;
      }
    });
    let nextIndex = (minIndex + 1) % this.nodes.length;
    return {
      distance: Math.sqrt(minSq),
      index: minIndex,
      nextIndex
    };
  }

  closestNormal(p) {
    const normal = new Vector();
    let minSq = Infinity;
    let minIndex = 0;
    this.nodes.forEach((n, i) => {
      let nextIndex = (i + 1) % this.nodes.length;
      let distSq = n.segmentDistanceSq(this.nodes[nextIndex], p);
      if (distSq < minSq) {
        minSq = distSq;
        minIndex = i;
      }
    });
    let nextIndex = (minIndex + 1) % this.nodes.length;
    return normal.substraction(this.nodes[nextIndex], this.nodes[minIndex]).toNormal().normalize();
  }

  pointDistance(p) {
    let minSq = Infinity;
    let minIndex = 0;
    this.nodes.forEach((n, i) => {
      let nextIndex = (i + 1) % this.nodes.length;
      let distSq = n.segmentDistanceSq(this.nodes[nextIndex], p);
      if (distSq < minSq) {
        minSq = distSq;
        minIndex = i;
      }
    });
    return Math.sqrt(minSq);
  }

  scaleAbout(a, about = this.center) {
    this.nodes.forEach(n => {
      n.substract(about).scale(a).add(about);
    });
    return this;
  }

  translate(x, y) {
    if (x instanceof Vector) {
      this.nodes.forEach(n => n.add(x));
    } else {
      this.nodes.forEach(n => {
        n.x += x;
        n.y += y;
      });
    }
    return this;
  }

  rotate(a, about = this.center) {
    let fromAbout = new Vector();
    this.nodes.forEach(n => {
      fromAbout.substraction(n, about).rotate(a).add(about);
      n.set(fromAbout);
    });
    return this;
  }

  _linesIntersect(start0, end0, start1, end1) {
    let s1_x, s1_y, s2_x, s2_y, s, t;
    s1_x = end0.x - start0.x;
    s1_y = end0.y - start0.y;
    s2_x = end1.x - start1.x;
    s2_y = end1.y - start1.y;

    s = (-s1_y * (start0.x - start1.x) + s1_x * (start0.y - start1.y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = (s2_x * (start0.y - start1.y) - s2_y * (start0.x - start1.x)) / (-s2_x * s1_y + s1_x * s2_y);
    return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
  }
}