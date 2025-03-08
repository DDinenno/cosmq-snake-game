export const areOverlapping = (node1, node2) => {
  // Calculate overlap along x-axis
  const xOverlap = Math.max(
    0,
    Math.min(node1.x + 1, node2.x + 1) - Math.max(node1.x, node2.x),
  );

  // Calculate overlap along y-axis
  const yOverlap = Math.max(
    0,
    Math.min(node1.y + 1, node2.y + 1) - Math.max(node1.y, node2.y),
  );

  // Check if overlap meets the minimum required amount on both axes
  return xOverlap && yOverlap;
};

export const nodesMatch = (a, b) => a.x === b.x && a.y === b.y;

export const addNode = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
