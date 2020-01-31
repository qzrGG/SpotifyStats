const Comparer = (x: number, y: number): number => {
  return x < y ? -1 : x === y ? 0 : 1;
}

export default Comparer;