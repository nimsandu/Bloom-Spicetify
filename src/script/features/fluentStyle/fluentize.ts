import { fluentStyleSettingId } from "../../shared/constants/constants";
import controlFeatureStyles from "../../shared/modules/controlFeatureStyles";
import { settingImageUrlInputId } from "./constants/constants";
import addBackgroundImage from "./modules/addBackgroundImage";
import addFluentSettings from "./modules/addFluentSettings";

function fluentize() {
  const [colorScheme, colorSchemeVariant] = Spicetify.Config.color_scheme.split("_");

  if (colorScheme === "fluent") {
    controlFeatureStyles.enable(fluentStyleSettingId);
    document.documentElement.classList.add(colorSchemeVariant);
    const settings = addFluentSettings();
    addBackgroundImage(settings.getFieldValue(settingImageUrlInputId));
  }
}

export default fluentize;
