interface DagNode<ID extends string | number, Data = unknown> {
  id: ID;
  data: Data;
}

export class Dag<ID extends string | number, Data = unknown> {
  private nodes: Map<ID, DagNode<ID, Data>> = new Map();
  private edges: Map<ID, ID[]> = new Map();

  addNode(node: DagNode<ID, Data>) {
    this.nodes.set(node.id, node);
  }

  addEdge(from: ID, to: ID) {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      throw new Error("Node not found");
    }

    const edges = this.edges.get(from) || [];
    if (edges.includes(to)) {
      throw new Error("Edge already exists");
    }

    this.edges.set(from, [...edges, to]);
  }

  topologicalSort(): ID[] {
    // calculate in-degree for each node
    const inDegree = new Map<ID, number>();
    this.nodes.forEach((_, node) => inDegree.set(node, 0));
    this.edges.forEach((edges) => {
      edges.forEach((edge) => {
        inDegree.set(edge, (inDegree.get(edge) ?? 0) + 1);
      });
    });

    // kahn's algorithm
    const queue: ID[] = Array.from(inDegree.keys()).filter(
      (node) => inDegree.get(node) === 0
    );
    const order: ID[] = [];

    while (queue.length > 0) {
      const current = queue.shift() as ID;
      order.push(current);

      const neighbors = this.edges.get(current) || [];
      neighbors.forEach((neighbor) => {
        inDegree.set(neighbor, (inDegree.get(neighbor) as number) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }

    return order;
  }

  inverted(): Dag<ID, Data> {
    const inverted = new Dag<ID, Data>();
    this.nodes.forEach((_, node) => inverted.addNode(this.nodes.get(node)!));
    this.edges.forEach((edges, node) => {
      edges.forEach((edge) => inverted.addEdge(edge, node));
    });
    return inverted;
  }
}
