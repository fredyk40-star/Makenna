/** Shared arcade scoring used by single-player and co-op mechanics. */
export const resultFor = (correct, total, incorrect = 0) => {
  const score = Math.round((correct / Math.max(total, 1)) * 100);
  return {
    score,
    stars: score >= 90 ? 5 : score >= 70 ? 3 : 1,
    correct,
    incorrect,
  };
};

export default resultFor;
