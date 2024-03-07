import CoolLightBox from "./components/CoolLightBox.vue";

function install(app) {
  if (install.installed) return;
  install.installed = true;
  app.component("CoolLightBox", CoolLightBox);
}

export const plugin = {
  install
};

export default CoolLightBox;