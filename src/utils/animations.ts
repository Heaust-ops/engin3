export type AnimationFunction = (timeElapsedS: number) => void;

const animationStack = [] as (AnimationFunction | null)[];

export const performAnimationStep = (timeElapsed: number) => {
  const timeElapsedS = timeElapsed * 0.001;

  if (!animationStack.length) return;

  animationStack.forEach((f) => {
    if (f) f(timeElapsedS);
  });
};

export const addAnimationStep = (f: AnimationFunction) => {
  /** Patch any holes */
  for (let i = 0; i < animationStack.length; i++)
    if (!animationStack[i]) return updateAnimationStep(i, f);

  /** Push if no holes */
  animationStack.push(f);
  /**
   * Return 'Id' of the Animations,
   * which is just its index
   */
  return animationStack.length - 1;
};

export const updateAnimationStep = (id: number, f: AnimationFunction) => {
  if (id < 0 || id > animationStack.length) return -1;
  animationStack[id] = f;
  return id;
};

export const removeAnimationStep = (id: number) => {
  if (id < 0 || id > animationStack.length) return false;
  animationStack[id] = null;
  return true;
};
