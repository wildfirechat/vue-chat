<!--只运行在electron里面-->
<template>
  <div id="window-controls">

    <div class="button" id="min-button" @click="minimize">
      <img class="icon"
           srcset="@/assets/windows_control_icons/min-k-10.png 1x, @/assets/windows_control_icons/min-k-12.png 1.25x, @/assets/windows_control_icons/min-k-15.png 1.5x, @/assets/windows_control_icons/min-k-15.png 1.75x, @/assets/windows_control_icons/min-k-20.png 2x, @/assets/windows_control_icons/min-k-20.png 2.25x, @/assets/windows_control_icons/min-k-24.png 2.5x, @/assets/windows_control_icons/min-k-30.png 3x, @/assets/windows_control_icons/min-k-30.png 3.5x"
           draggable="false" alt=""/>
    </div>

    <div class="button" id="max-button" @click="maximize">
      <img class="icon"
           srcset="@/assets/windows_control_icons/max-k-10.png 1x, @/assets/windows_control_icons/max-k-12.png 1.25x, @/assets/windows_control_icons/max-k-15.png 1.5x, @/assets/windows_control_icons/max-k-15.png 1.75x, @/assets/windows_control_icons/max-k-20.png 2x, @/assets/windows_control_icons/max-k-20.png 2.25x, @/assets/windows_control_icons/max-k-24.png 2.5x, @/assets/windows_control_icons/max-k-30.png 3x, @/assets/windows_control_icons/max-k-30.png 3.5x"
           draggable="false" alt=""/>
    </div>

    <div class="button" id="restore-button" @click="maximize">
      <img class="icon"
           srcset="@/assets/windows_control_icons/restore-k-10.png 1x, @/assets/windows_control_icons/restore-k-12.png 1.25x, @/assets/windows_control_icons/restore-k-15.png 1.5x, @/assets/windows_control_icons/restore-k-15.png 1.75x, @/assets/windows_control_icons/restore-k-20.png 2x, @/assets/windows_control_icons/restore-k-20.png 2.25x, @/assets/windows_control_icons/restore-k-24.png 2.5x, @/assets/windows_control_icons/restore-k-30.png 3x, @/assets/windows_control_icons/restore-k-30.png 3.5x"
           draggable="false" alt=""/>
    </div>

    <div class="button" id="close-button" @click="close">
      <img class="icon"
           srcset="@/assets/windows_control_icons/close-k-10.png 1x, @/assets/windows_control_icons/close-k-12.png 1.25x, @/assets/windows_control_icons/close-k-15.png 1.5x, @/assets/windows_control_icons/close-k-15.png 1.75x, @/assets/windows_control_icons/close-k-20.png 2x, @/assets/windows_control_icons/close-k-20.png 2.25x, @/assets/windows_control_icons/close-k-24.png 2.5x, @/assets/windows_control_icons/close-k-30.png 3x, @/assets/windows_control_icons/close-k-30.png 3.5x"
           draggable="false" alt=""/>
    </div>

  </div>
</template>

<script>
import {remote} from "@/platform";

export default {
  name: "ElectronWindowsControlButtonView",
  methods: {
    minimize() {
      const win = remote.getCurrentWindow();
      win.minimize();
    },
    maximize() {
      const win = remote.getCurrentWindow();
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
      this.$nextTick(() => {
        this.toggleMaxRestoreButtons();
      });
    },
    close() {
      const win = remote.getCurrentWindow();
      win.close();
    },
    toggleMaxRestoreButtons() {
      const win = remote.getCurrentWindow();
      if (win.isMaximized()) {
        document.body.classList.add('maximized');
      } else {
        document.body.classList.remove('maximized');
      }
    }

  }
}
</script>

<style lang="css" scoped>
#window-controls {
  display: grid;
  grid-template-columns: repeat(3, 46px);
  /*position: absolute;*/
  /*top: 0;*/
  /*right: 0;*/
  height: 30px;
}

#window-controls {
  -kebkit-app-region: no-drag;
}

#window-controls .button {
  grid-row: 1 / span 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

@media (-kebkit-device-pixel-ratio: 1.5), (device-pixel-ratio: 1.5),
(-kebkit-device-pixel-ratio: 2), (device-pixel-ratio: 2),
(-kebkit-device-pixel-ratio: 3), (device-pixel-ratio: 3) {
  #window-controls .icon {
    width: 10px;
    height: 10px;
  }
}

#window-controls .button {
  user-select: none;
}

#window-controls .button:hover {
  background: rgba(255, 255, 255, 0.1);
}

#window-controls .button:active {
  background: rgba(255, 255, 255, 0.2);
}

#min-button:hover {
  background: #d6d6d6 !important;
}

#max-button:hover {
  background: #d6d6d6 !important;
}

#restore-button:hover {
  background: #d6d6d6 !important;
}

#close-button:hover {
  background: #E81123 !important;
}

#close-button:active {
  background: #F1707A !important;
}

#close-button:active .icon {
  filter: invert(1);
}

#min-button {
  grid-column: 1;
}

#max-button, #restore-button {
  grid-column: 2;
}

#close-button {
  grid-column: 3;
}

#restore-button {
  display: none !important;
}

.maximized #restore-button {
  display: flex !important;
}

.maximized #max-button {
  display: none;
}

</style>
