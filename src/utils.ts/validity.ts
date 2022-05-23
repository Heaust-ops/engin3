export const isSelectedMesh = () =>
  window.selectedItem && ["Mesh"].includes(window.selectedItem.type);

export const isSelectedType = (...args: string[]) =>
  window.selectedItem && args.includes(window.selectedItem.type);

export const isMesh = (arg: any) =>
  arg?.type && typeof arg.type === "string" && ["Mesh"].includes(arg.type);

export const isType = (arg: any, ...args: string[]) =>
  arg?.type && typeof arg.type === "string" && args.includes(arg.type);
