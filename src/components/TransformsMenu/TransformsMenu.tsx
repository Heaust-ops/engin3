import { FunctionComponent, useState } from "react";
import styles from "./TransformsMenu.module.css";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import TransformPropertyMenu from "./TransformPropertyMenu";

interface TransformsMenuProps {}

const TransformsMenu: FunctionComponent<TransformsMenuProps> = () => {
  const [isHidden, setisHidden] = useState(true);
  const [selectedMenu, setselectedMenu] = useState<
    "position" | "rotation" | "scale"
  >("position");
  return (
    <div
      onWheel={(ev) => {
        /**
         * Scroll state that drivers rely upon.
         *
         * Putting this here as it's a safe space to test
         * scroll, because scroll does nothing else here.
         */
        const direction =
          Math.sign(ev.deltaY) < 0 ? 1 /** Scroll Up */ : -1; /** Scroll Down */

        const tmpScrollY = window.scrolly - direction;
        if (tmpScrollY >= 0 && tmpScrollY <= window.scrollyLimit)
          window.scrolly = tmpScrollY;
      }}

      className={`${styles.Wrapper}`}
    >
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

      {/**
       * Property Selection menu
       */}
      <div
        style={{ width: `${isHidden ? 0 : 20}rem` }}
        className={`${styles.MenuBox}`}
      >
        <div className={`${styles.submenuWrapper}`}>
          <button
            onClick={() => setselectedMenu("position")}
            className={`${styles.submenuButton} ${styles.position} ${
              selectedMenu === "position" ? styles.active : ""
            }`}
            style={
              isHidden
                ? { width: 0, pointerEvents: "none", opacity: 0 }
                : {
                    backgroundColor: "#1e1e1e",
                  }
            }
          >
            Position
          </button>
          <button
            onClick={() => setselectedMenu("rotation")}
            className={`${styles.submenuButton} ${styles.rotation} ${
              selectedMenu === "rotation" ? styles.active : ""
            }`}
            style={
              isHidden
                ? { width: 0, pointerEvents: "none", opacity: 0 }
                : {
                    backgroundColor: "#1e1e1e",
                  }
            }
          >
            Rotation
          </button>
          <button
            onClick={() => setselectedMenu("scale")}
            className={`${styles.submenuButton} ${styles.scale} ${
              selectedMenu === "scale" ? styles.active : ""
            }`}
            style={
              isHidden
                ? { width: 0, pointerEvents: "none", opacity: 0 }
                : {
                    backgroundColor: "#1e1e1e",
                  }
            }
          >
            Scale
          </button>
        </div>
        <TransformPropertyMenu isHidden={isHidden} property={selectedMenu} />
      </div>
    </div>
  );
};

export default TransformsMenu;
