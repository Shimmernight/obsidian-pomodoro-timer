var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// main.ts
__export(exports, {
  default: () => PomodoroTimerPlugin
});
var import_obsidian = __toModule(require("obsidian"));
var DEFAULT_SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartPomodoros: true,
  useSystemNotifications: false
};
var PomodoroTimerPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.timer = 0;
    this.timeLeft = 0;
    this.isRunning = false;
    this.isWorkMode = true;
    this.pomodoroCount = 0;
  }
  onload() {
    return __async(this, null, function* () {
      yield this.loadSettings();
      this.loadStyles();
      this.statusBarEl = this.addStatusBarItem();
      this.statusBarEl.setText("\u{1F345} \u51C6\u5907\u5F00\u59CB");
      this.statusBarEl.addClass("pomodoro-statusbar-item");
      this.addCommand({
        id: "start-pomodoro",
        name: "\u5F00\u59CB\u756A\u8304\u949F",
        callback: () => this.startPomodoro()
      });
      this.addCommand({
        id: "pause-pomodoro",
        name: "\u6682\u505C\u756A\u8304\u949F",
        callback: () => this.pausePomodoro()
      });
      this.addCommand({
        id: "reset-pomodoro",
        name: "\u91CD\u7F6E\u756A\u8304\u949F",
        callback: () => this.resetPomodoro()
      });
      this.addSettingTab(new PomodoroSettingTab(this.app, this));
      this.statusBarEl.addEventListener("click", () => {
        if (this.isRunning) {
          this.pausePomodoro();
        } else {
          this.startPomodoro();
        }
      });
      if (this.settings.useSystemNotifications) {
        this.requestNotificationPermission();
      }
    });
  }
  onunload() {
    this.clearTimer();
  }
  requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }
  sendSystemNotification(title, body) {
    if (!this.settings.useSystemNotifications)
      return;
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
      });
    }
  }
  loadStyles() {
    document.head.appendChild(Object.assign(document.createElement("style"), {
      id: "pomodoro-timer-styles",
      textContent: `.pomodoro-statusbar-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.pomodoro-statusbar-item:hover {
  background-color: var(--interactive-hover);
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.pomodoro-statusbar-item.running {
  animation: pulse 2s infinite;
}`
    }));
  }
  loadSettings() {
    return __async(this, null, function* () {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
    });
  }
  saveSettings() {
    return __async(this, null, function* () {
      yield this.saveData(this.settings);
    });
  }
  startPomodoro() {
    if (this.isRunning)
      return;
    this.isRunning = true;
    this.statusBarEl.addClass("running");
    if (this.timeLeft === 0) {
      if (this.isWorkMode) {
        this.timeLeft = this.settings.workDuration * 60;
      } else {
        if (this.pomodoroCount % this.settings.longBreakInterval === 0) {
          this.timeLeft = this.settings.longBreakDuration * 60;
        } else {
          this.timeLeft = this.settings.shortBreakDuration * 60;
        }
      }
    }
    this.timer = window.setInterval(() => this.updateTimer(), 1e3);
    this.updateStatusBar();
  }
  pausePomodoro() {
    this.isRunning = false;
    this.statusBarEl.removeClass("running");
    this.clearTimer();
    this.updateStatusBar();
  }
  resetPomodoro() {
    this.clearTimer();
    this.isRunning = false;
    this.statusBarEl.removeClass("running");
    this.timeLeft = 0;
    this.updateStatusBar();
  }
  clearTimer() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = 0;
    }
  }
  updateTimer() {
    if (this.timeLeft > 0) {
      this.timeLeft--;
      this.updateStatusBar();
    } else {
      this.clearTimer();
      if (this.isWorkMode) {
        this.pomodoroCount++;
        new import_obsidian.Notice(`\u{1F345} \u756A\u8304\u949F\u5B8C\u6210\uFF01\u4F11\u606F\u4E00\u4E0B\u5427`);
        this.sendSystemNotification("\u756A\u8304\u949F\u5B8C\u6210", "\u5DE5\u4F5C\u65F6\u95F4\u7ED3\u675F\uFF0C\u73B0\u5728\u53EF\u4EE5\u4F11\u606F\u4E00\u4E0B\u4E86\uFF01");
        this.isWorkMode = false;
        this.isRunning = false;
        if (this.settings.autoStartBreaks) {
          if (this.pomodoroCount % this.settings.longBreakInterval === 0) {
            this.timeLeft = this.settings.longBreakDuration * 60;
            new import_obsidian.Notice(`\u5F00\u59CB\u957F\u4F11\u606F (${this.settings.longBreakDuration} \u5206\u949F)`);
          } else {
            this.timeLeft = this.settings.shortBreakDuration * 60;
            new import_obsidian.Notice(`\u5F00\u59CB\u77ED\u4F11\u606F (${this.settings.shortBreakDuration} \u5206\u949F)`);
          }
          this.startPomodoro();
        } else {
          this.statusBarEl.removeClass("running");
        }
      } else {
        new import_obsidian.Notice("\u4F11\u606F\u7ED3\u675F\uFF01");
        this.sendSystemNotification("\u4F11\u606F\u7ED3\u675F", "\u4F11\u606F\u65F6\u95F4\u7ED3\u675F\uFF0C\u51C6\u5907\u5F00\u59CB\u65B0\u7684\u5DE5\u4F5C\u5468\u671F\uFF01");
        this.isWorkMode = true;
        this.isRunning = false;
        if (this.settings.autoStartPomodoros) {
          this.timeLeft = this.settings.workDuration * 60;
          this.startPomodoro();
          new import_obsidian.Notice(`\u5F00\u59CB\u65B0\u7684\u756A\u8304\u949F (${this.settings.workDuration} \u5206\u949F)`);
        } else {
          this.statusBarEl.removeClass("running");
        }
      }
      this.updateStatusBar();
    }
  }
  updateStatusBar() {
    if (this.timeLeft === 0) {
      this.statusBarEl.setText("\u{1F345} \u51C6\u5907\u5F00\u59CB");
      return;
    }
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    if (this.isWorkMode) {
      this.statusBarEl.setText(`\u{1F345} ${formattedTime} - \u5DE5\u4F5C\u4E2D`);
    } else {
      this.statusBarEl.setText(`\u2615 ${formattedTime} - \u4F11\u606F\u4E2D`);
    }
  }
};
var PomodoroSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "\u756A\u8304\u949F\u8BBE\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("\u5DE5\u4F5C\u65F6\u957F\uFF08\u5206\u949F\uFF09").setDesc("\u6BCF\u4E2A\u756A\u8304\u949F\u7684\u5DE5\u4F5C\u65F6\u957F").addText((text) => text.setValue(this.plugin.settings.workDuration.toString()).onChange((value) => __async(this, null, function* () {
      this.plugin.settings.workDuration = Number(value) || DEFAULT_SETTINGS.workDuration;
      yield this.plugin.saveSettings();
    })));
    new import_obsidian.Setting(containerEl).setName("\u77ED\u4F11\u606F\u65F6\u957F\uFF08\u5206\u949F\uFF09").setDesc("\u6BCF\u4E2A\u77ED\u4F11\u606F\u7684\u65F6\u957F").addText((text) => text.setValue(this.plugin.settings.shortBreakDuration.toString()).onChange((value) => __async(this, null, function* () {
      this.plugin.settings.shortBreakDuration = Number(value) || DEFAULT_SETTINGS.shortBreakDuration;
      yield this.plugin.saveSettings();
    })));
    new import_obsidian.Setting(containerEl).setName("\u957F\u4F11\u606F\u65F6\u957F\uFF08\u5206\u949F\uFF09").setDesc("\u6BCF\u4E2A\u957F\u4F11\u606F\u7684\u65F6\u957F").addText((text) => text.setValue(this.plugin.settings.longBreakDuration.toString()).onChange((value) => __async(this, null, function* () {
      this.plugin.settings.longBreakDuration = Number(value) || DEFAULT_SETTINGS.longBreakDuration;
      yield this.plugin.saveSettings();
    })));
    new import_obsidian.Setting(containerEl).setName("\u957F\u4F11\u606F\u95F4\u9694").setDesc("\u591A\u5C11\u4E2A\u756A\u8304\u949F\u540E\u8FDB\u884C\u957F\u4F11\u606F").addText((text) => text.setValue(this.plugin.settings.longBreakInterval.toString()).onChange((value) => __async(this, null, function* () {
      this.plugin.settings.longBreakInterval = Number(value) || DEFAULT_SETTINGS.longBreakInterval;
      yield this.plugin.saveSettings();
    })));
    new import_obsidian.Setting(containerEl).setName("\u81EA\u52A8\u5F00\u59CB\u4F11\u606F").setDesc("\u756A\u8304\u949F\u7ED3\u675F\u540E\u81EA\u52A8\u5F00\u59CB\u4F11\u606F").addToggle((toggle) => toggle.setValue(this.plugin.settings.autoStartBreaks).onChange((value) => __async(this, null, function* () {
      this.plugin.settings.autoStartBreaks = value;
      yield this.plugin.saveSettings();
    })));
    new import_obsidian.Setting(containerEl).setName("\u81EA\u52A8\u5F00\u59CB\u756A\u8304\u949F").setDesc("\u4F11\u606F\u7ED3\u675F\u540E\u81EA\u52A8\u5F00\u59CB\u4E0B\u4E00\u4E2A\u756A\u8304\u949F").addToggle((toggle) => toggle.setValue(this.plugin.settings.autoStartPomodoros).onChange((value) => __async(this, null, function* () {
      this.plugin.settings.autoStartPomodoros = value;
      yield this.plugin.saveSettings();
    })));
    new import_obsidian.Setting(containerEl).setName("\u4F7F\u7528\u7CFB\u7EDF\u901A\u77E5").setDesc("\u5373\u4F7F\u4E0D\u5728Obsidian\u7A97\u53E3\u4E5F\u80FD\u6536\u5230\u901A\u77E5\u63D0\u9192").addToggle((toggle) => toggle.setValue(this.plugin.settings.useSystemNotifications).onChange((value) => __async(this, null, function* () {
      this.plugin.settings.useSystemNotifications = value;
      yield this.plugin.saveSettings();
      if (value) {
        this.plugin.requestNotificationPermission();
      }
    })));
  }
};
