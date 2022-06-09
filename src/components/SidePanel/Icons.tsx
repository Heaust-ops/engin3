import { ViewportSidePanelTabs } from "../../enums";
import PublicIcon from "@mui/icons-material/Public";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import LightbulbCircleIcon from "@mui/icons-material/LightbulbCircle";
import HandymanIcon from "@mui/icons-material/Handyman";
import AnimationIcon from "@mui/icons-material/Animation";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import VideoCameraBackIcon from "@mui/icons-material/VideoCameraBack";

const GetIcon = (arg: ViewportSidePanelTabs) => {
  switch (arg) {
    case ViewportSidePanelTabs.world:
      return <PublicIcon style={{ color: "#A9575F", width: "4rem" }} />;

    case ViewportSidePanelTabs.object:
      return <ViewInArIcon style={{ color: "#6287d1", width: "4rem" }} />;

    case ViewportSidePanelTabs.material:
      return <ImageSearchIcon style={{ color: "#70a41c", width: "4rem" }} />;

    case ViewportSidePanelTabs.light:
      return (
        <LightbulbCircleIcon style={{ color: "#e09558", width: "4rem" }} />
      );

    case ViewportSidePanelTabs.drivers:
      return <HandymanIcon style={{ color: "#cccccc", width: "4rem" }} />;

    case ViewportSidePanelTabs.sequences:
      return <AnimationIcon style={{ color: "#16949A", width: "4rem" }} />;

    case ViewportSidePanelTabs.states:
      return (
        <ConfirmationNumberIcon style={{ color: "#62B9D1", width: "4rem" }} />
      );

    case ViewportSidePanelTabs.camera:
      return (
        <VideoCameraBackIcon style={{ color: "#e0bc58", width: "4rem" }} />
      );
  }
};

export default GetIcon;
