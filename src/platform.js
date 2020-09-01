
import { ContextMenu, MenuItem } from "react-contextmenu";
import wfc from './wfc/client/wfc'

export function isElectron() {
    // Renderer process
    if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
        return true;
    }

    // Main process
    if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
        return true;
    }

    // Detect the user agent when the `nodeIntegration` option is set to true
    if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
        return true;
    }

    return false;
}

// 后两个参数是针对web的
export function popMenu(templates, data, menuId) {
    if (isElectron()) {
        let menu;
        menu = new remote.Menu.buildFromTemplate(templates);
        menu.popup(remote.getCurrentWindow());
    } else {
        return showBrowserMenu(templates, data, menuId);
    }
}

export function showBrowserMenu(menuTemplates = [], data, menuId) {
    let items = menuTemplates.map((template) => {
        return (
            <MenuItem key={template.label} data={{ data: data }} onClick={template.click}>
                {template.label}
            </MenuItem>
        );
    });
    return (
        <ContextMenu id={menuId} >
            {
                items
            }
        </ContextMenu>
    );
}

export function connect(userId, token) {
    wfc.connect(userId, token);
}

// pc
export const remote = null;
export const ipcRenderer = null;
export const ipcMain = null;
export const fs = null;
export const currentWindow = null;
export const BrowserWindow = null;
export const AppPath = null;
export const desktopCapturer = null;

// for web
export const ContextMenuTrigger = require("react-contextmenu").ContextMenuTrigger;
export const hideMenu = require("react-contextmenu").hideMenu;
export const PostMessageEventEmitter = require('./ui/windowEmitter');
