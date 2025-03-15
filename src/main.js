import Cosmq, { renderDOM, observe, compute, observableArray } from "cosmq-js";
import { areOverlapping, nodesMatch, addNode } from "./utils.js";
import "../style.css";

const STATES = {
  running: "running",
  gameover: "gameover",
  paused: "paused",
  win: "win",
};

const getFoodPos = (gridSize, exclude = []) => {
  const node = {
    x: Math.floor(Math.random() * gridSize.x),
    y: Math.floor(Math.random() * gridSize.y),
  };

  if (exclude.find((e) => nodesMatch(e, node))) {
    return getFoodPos(gridSize);
  }

  return node;
};

const Component_Food = ({ pos, size }) => {
  return (
    <span
      className="food"
      style={{
        background: "rgb(80, 67, 128)",
        width: compute(`${size}px`),
        height: compute(`${size}px`),
        position: "absolute",
        left: compute(`${pos.x * size}px`),
        top: compute(`${pos.y * size}px`),
        opacity: 0.8,
      }}
    />
  );
};

const Component_App = ({}) => {
  const nodes = observe([]);
  const direction = observe({ x: 1, y: 0 });
  const frame = observe(1);
  const gridSize = observe({ x: 10, y: 10 });
  const foodPos = observe(null);
  const state = observe(STATES.paused);
  const score = observe(0);
  const maxNodes = compute(gridSize.x * gridSize.y);

  const pixelSize = compute(() => {
    let size = 30;

    if (gridSize.x * size > window.innerWidth - 100) {
      size = (window.innerWidth - 100) / gridSize.x;
    }

    if (gridSize.y * size > window.innerHeight - 100) {
      size = (window.innerHeight - 100) / gridSize.y;
    }

    return size;
  });

  const initialLoopTimeout = 150;
  let loopTimeout = initialLoopTimeout;

  const resetGame = () => {
    state = STATES.running;
    score = 0;

    direction = { x: 1, y: 0 };
    foodPos = getFoodPos(gridSize, nodes);

    nodes = [
      {
        x: 1,
        y: 1,
      },

      {
        x: 0,
        y: 1,
      },
      {
        x: 0,
        y: 0,
      },
    ];
  };

  const changeDirection = (dir) => {
    if (state !== STATES.running) {
      resetGame();
      return;
    }

    let newDirection;
    switch (dir) {
      case "up":
        newDirection = { x: 0, y: -1 };
        break;
      case "down":
        newDirection = { x: 0, y: 1 };
        break;
      case "left":
        newDirection = { x: -1, y: 0 };
        break;
      case "right":
        newDirection = { x: 1, y: 0 };
        break;
    }

    if (newDirection) {
      const newPos = addNode(nodes[0], newDirection);

      if (nodes.find((n) => nodesMatch(n, newPos))) {
        // prevent moving backwards
        return;
      }

      if (nodesMatch(newDirection, direction)) {
        loopTimeout = loopTimeout * 0.9;
      } else {
        loopTimeout = initialLoopTimeout;
      }

      direction = newDirection;
    }
  };

  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    changeDirection(e.key.replace(/^(Arrow)/, "").toLocaleLowerCase());
  });

  let touchStart = { x: 0, y: 0 };
  let touchEnd = null;

  const handleTouchEnd = () => {
    if (touchEnd == null) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      changeDirection(deltaX > 0 ? "right" : "left");
    } else {
      changeDirection(deltaY > 0 ? "down" : "up");
    }

    touchEnd = null;
    window.removeEventListener("touchend", handleTouchEnd);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    touchEnd = { x: touch.clientX, y: touch.clientY };

    window.removeEventListener("touchmove", handleTouchMove);
  };

  window.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  });

  const loop = (cb) => {
    setTimeout(() => {
      cb();
      loop(cb);
    }, loopTimeout);
  };

  loop(() => {
    if (state === STATES.win && nodes.length > 0) {
      loopTimeout = 1;
      nodes = nodes.slice(0, nodes.length - 1);

      return;
    } else if (state !== STATES.running) {
      return;
    }

    frame = frame + 1;

    if (nodes.length >= maxNodes) {
      state = STATES.win;
      return;
    }

    let ateFood = false;
    let overlapping = false;

    const newNodes = nodes.map((n, i) => {
      let newPos;

      if (i === 0) {
        newPos = { x: n.x + direction.x, y: n.y + direction.y };
      } else {
        newPos = { x: nodes[i - 1].x, y: nodes[i - 1].y };
      }

      if (newPos.x > gridSize.x) {
        newPos.x = 0;
      }
      if (newPos.x < 0) {
        newPos.x = gridSize.x;
      }
      if (newPos.y > gridSize.y) {
        newPos.y = 0;
      }
      if (newPos.y < 0) {
        newPos.y = gridSize.y;
      }

      if (nodesMatch(foodPos, newPos)) {
        ateFood = true;
      }

      return newPos;
    });

    if (
      newNodes.find((a) =>
        newNodes.find((b) => a !== b && a.x === b.x && a.y === b.y),
      )
    ) {
      console.log(overlapping, newNodes);
      state = STATES.gameover;
      return;
    }

    if (ateFood) {
      score = score + 1;
      newNodes.push({ x: -9999, y: -9999 });
      foodPos = getFoodPos(gridSize, nodes);
    }

    nodes = newNodes;
  });

  return (
    <div className="container" style={{ height: "100vh" }}>
      <div
        className="bg"
        style={{
          position: "absolute",
          left: "50%",
          top: "40%",
          transform: "translateX(-50%) translateY(-40%)",
          width: compute(`${(gridSize.x + 1) * pixelSize}px`),
          height: compute(`${(gridSize.y + 1) * pixelSize}px`),
          backgroundImage: `linear-gradient(to right, rgb(239 95 204 / 25%) 1px, transparent 1px),
                            linear-gradient(to bottom, rgb(239 95 204 / 25%) 1px, transparent 1px)`,
          backgroundSize: compute(`${pixelSize}px ${pixelSize}px`),
          boxSizing: "border-box",
          boxShadow:
            "rgba(239, 95, 204, 0.55) 0px 0px 0px 3px, rgba(239, 95, 204, 0.55) 0px 0px 30px 0px",
        }}
      >
        {compute(() => {
          if (state === STATES.running) return "";

          return (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translateX(-50%) translateY(-50%)",
              }}
            >
              <h1>
                {state === STATES.win
                  ? "You win, Congrats!"
                  : state.toUpperCase()}
              </h1>

              <span className="code">
                {state === STATES.paused
                  ? "Press any button or swipe finger to start."
                  : "Press any button or swipe finger to restart."}
                <br />
                <br />
                {compute(
                  state === STATES.paused
                    ? "Use Arrow Keys or swipe finger to move."
                    : null,
                )}
              </span>
            </div>
          );
        })}
        {observableArray(
          nodes,
          {
            getKey: (item) => `${item.x}-${item.y}`,
          },

          (item, i) => (
            <span
              className="snake"
              style={{
                background: "rgb(28, 240, 152)",
                width: compute(`${pixelSize}px`),
                height: compute(`${pixelSize}px`),
                position: "absolute",
                left: compute(`${item.x * pixelSize}px`),
                top: compute(`${item.y * pixelSize}px`),
                opacity: 0.7,
              }}
            />
          ),
        )}

        {compute(
          foodPos ? (
            <span>
              <Component_Food pos={foodPos} size={pixelSize} />
            </span>
          ) : null,
        )}
      </div>
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          placeItems: "anchor-center",
          padding: "10px 20px",
          position: "fixed",
          bottom: "0px",
          left: "0px",
        }}
      >
        <select
          handle:change={(e) => {
            e.target.blur();
            const [x, y] = e.target.value.split("x");
            gridSize = { x: parseInt(x, 10), y: parseInt(y, 10) };
            resetGame();
          }}
        >
          {["10x10", "20x20", "30x30", "40x40", "50x50"].map((dimensions) => (
            <option value={dimensions}>{dimensions}</option>
          ))}
        </select>

        <h4>Score: {score}</h4>
      </div>
    </div>
  );
};

console.time("render app");
renderDOM(<Component_App />, "root");
console.timeEnd("render app");
