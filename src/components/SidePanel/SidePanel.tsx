import { FunctionComponent } from "react";
import { AllViewportSidePanelTabs } from "../../utils/constants";
import GetIcon from "./Icons";
import styles from "./SidePanel.module.css";

interface SidePanelProps {}

const SidePanel: FunctionComponent<SidePanelProps> = () => {
  return (
    <div className={`${styles.sidePanel}`}>
      <div className={`${styles.objectList}`}></div>
      <div className={`${styles.properties}`}>
        <div className={`${styles.iconTab}`}>
          {AllViewportSidePanelTabs.map((tab, index) => (
            <div key={index} className={styles.iconWrapper}>{GetIcon(tab)}</div>
          ))}
        </div>
        <div className={`${styles.propertyTab}`}></div>
      </div>
    </div>
  );
};

export default SidePanel;
