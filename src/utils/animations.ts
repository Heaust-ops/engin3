export type AnimationFunction = (timeElapsedS: number) => void;

export const performAnimationStep = (timeElapsed: number) => {
  const timeElapsedS = timeElapsed * 0.001;

  if (!window.animationStack.length) return;

  window.animationStack.forEach((f) => {
    if (f) f(timeElapsedS);
  });
};

export const addAnimationStep = (f: AnimationFunction) => {
  /** Patch any holes */
  for (let i = 0; i < window.animationStack.length; i++)
    if (!window.animationStack[i]) return updateAnimationStep(i, f);

  /** Push if no holes */
  window.animationStack.push(f);
  /**
   * Return 'Id' of the Animations,
   * which is just its index
   */
  return window.animationStack.length - 1;
};

export const updateAnimationStep = (id: number, f: AnimationFunction) => {
  if (id < 0 || id > window.animationStack.length) return -1;
  window.animationStack[id] = f;
  return id;
};

export const removeAnimationStep = (id: number) => {
  if (id < 0 || id > window.animationStack.length) return false;
  window.animationStack[id] = null;
  return true;
};
