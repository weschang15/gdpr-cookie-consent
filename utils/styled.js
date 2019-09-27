import { kababCase } from "./kababCase";

const styled = (styles = {}) => {
  return Object.keys(styles)
    .map(key => {
      const kababbed = kababCase(key);
      return `${kababbed}:${styles[key]}`;
    })
    .join(";");
};

export default styled;
