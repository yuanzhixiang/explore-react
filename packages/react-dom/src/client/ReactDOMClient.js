import ReactVersion from "shared/ReactVersion";

function createRoot(container, options) {
  console.log("React Version:", ReactVersion);
  throw new Error("Not implemented");
}

function hydrateRoot(container, initialChildren, options) {
  throw new Error("Not implemented");
}

export { ReactVersion as version, createRoot, hydrateRoot };
