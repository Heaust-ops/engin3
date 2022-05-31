import { FunctionComponent, useState } from "react";
import styles from "./TransformsMenu.module.css";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";

interface TransformsMenuProps {}

const TransformsMenu: FunctionComponent<TransformsMenuProps> = () => {
  const [isHidden, setisHidden] = useState(true);
  return (
    <div className={`${styles.Wrapper}`}>
      <div className={`${styles.ArrowWrapper}`}>
        <ArrowRightIcon
          onClick={(ev) => {
            ev.stopPropagation();
            setisHidden(!isHidden);
          }}
          style={{
            width: "1.8rem",
            height: "1.8rem",
            transition: "0.5s",
            transform: `rotate(${isHidden ? 180 : 0}deg)`,
          }}
        />
      </div>
      <div
        style={{ width: `${isHidden ? 0 : 20}rem` }}
        className={`${styles.MenuBox}`}
      ></div>
    </div>
  );
};

export default TransformsMenu;
