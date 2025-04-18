import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface PomodoroSettings {
	workDuration: number;
	shortBreakDuration: number;
	longBreakDuration: number;
	longBreakInterval: number;
	autoStartBreaks: boolean;
	autoStartPomodoros: boolean;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
	workDuration: 25,
	shortBreakDuration: 5,
	longBreakDuration: 15,
	longBreakInterval: 4,
	autoStartBreaks: true,
	autoStartPomodoros: true
}

export default class PomodoroTimerPlugin extends Plugin {
	settings: PomodoroSettings;
	statusBarEl: HTMLElement;
	
	timer: number = 0;
	timeLeft: number = 0;
	isRunning: boolean = false;
	isWorkMode: boolean = true;
	pomodoroCount: number = 0;
	
	async onload() {
		await this.loadSettings();
		
		// 加载 CSS 样式
		this.loadStyles();
		
		// 添加状态栏
		this.statusBarEl = this.addStatusBarItem();
		this.statusBarEl.setText('🍅 准备开始');
		this.statusBarEl.addClass('pomodoro-statusbar-item');
		
		// 添加命令
		this.addCommand({
			id: 'start-pomodoro',
			name: '开始番茄钟',
			callback: () => this.startPomodoro(),
		});
		
		this.addCommand({
			id: 'pause-pomodoro',
			name: '暂停番茄钟',
			callback: () => this.pausePomodoro(),
		});
		
		this.addCommand({
			id: 'reset-pomodoro',
			name: '重置番茄钟',
			callback: () => this.resetPomodoro(),
		});
		
		// 添加设置选项卡
		this.addSettingTab(new PomodoroSettingTab(this.app, this));
		
		// 点击状态栏的事件
		this.statusBarEl.addEventListener('click', () => {
			if (this.isRunning) {
				this.pausePomodoro();
			} else {
				this.startPomodoro();
			}
		});
	}
	
	onunload() {
		this.clearTimer();
	}
	
	loadStyles() {
		// 使用 Obsidian 的标准方式加载样式文件
		document.head.appendChild(
			Object.assign(document.createElement('style'), {
				id: 'pomodoro-timer-styles',
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
			})
		);
	}
	
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	
	async saveSettings() {
		await this.saveData(this.settings);
	}
	
	startPomodoro() {
		if (this.isRunning) return;
		
		this.isRunning = true;
		this.statusBarEl.addClass('running');
		
		if (this.timeLeft === 0) {
			// 如果计时器被重置，重新设置时间
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
		
		this.timer = window.setInterval(() => this.updateTimer(), 1000);
		this.updateStatusBar();
	}
	
	pausePomodoro() {
		this.isRunning = false;
		this.statusBarEl.removeClass('running');
		this.clearTimer();
		this.updateStatusBar();
	}
	
	resetPomodoro() {
		this.clearTimer();
		this.isRunning = false;
		this.statusBarEl.removeClass('running');
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
				// 完成一个番茄钟
				this.pomodoroCount++;
				new Notice(`🍅 番茄钟完成！休息一下吧`);
				this.isWorkMode = false;
				
				// 是否自动开始休息
				if (this.settings.autoStartBreaks) {
					if (this.pomodoroCount % this.settings.longBreakInterval === 0) {
						this.timeLeft = this.settings.longBreakDuration * 60;
						new Notice(`开始长休息 (${this.settings.longBreakDuration} 分钟)`);
					} else {
						this.timeLeft = this.settings.shortBreakDuration * 60;
						new Notice(`开始短休息 (${this.settings.shortBreakDuration} 分钟)`);
					}
					this.startPomodoro();
				} else {
					this.isRunning = false;
					this.statusBarEl.removeClass('running');
				}
			} else {
				// 休息结束
				new Notice('休息结束！');
				this.isWorkMode = true;
				
				// 是否自动开始下一个番茄钟
				if (this.settings.autoStartPomodoros) {
					this.timeLeft = this.settings.workDuration * 60;
					this.startPomodoro();
					new Notice(`开始新的番茄钟 (${this.settings.workDuration} 分钟)`);
				} else {
					this.isRunning = false;
					this.statusBarEl.removeClass('running');
				}
			}
			
			this.updateStatusBar();
		}
	}
	
	updateStatusBar() {
		if (this.timeLeft === 0) {
			this.statusBarEl.setText('🍅 准备开始');
			return;
		}
		
		const minutes = Math.floor(this.timeLeft / 60);
		const seconds = this.timeLeft % 60;
		const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		
		if (this.isWorkMode) {
			this.statusBarEl.setText(`🍅 ${formattedTime} - 工作中`);
		} else {
			this.statusBarEl.setText(`☕ ${formattedTime} - 休息中`);
		}
	}
}

class PomodoroSettingTab extends PluginSettingTab {
	plugin: PomodoroTimerPlugin;
	
	constructor(app: App, plugin: PomodoroTimerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	
	display(): void {
		const {containerEl} = this;
		
		containerEl.empty();
		
		containerEl.createEl('h2', {text: '番茄钟设置'});
		
		new Setting(containerEl)
			.setName('工作时长（分钟）')
			.setDesc('每个番茄钟的工作时长')
			.addText(text => text
				.setValue(this.plugin.settings.workDuration.toString())
				.onChange(async (value) => {
					this.plugin.settings.workDuration = Number(value) || DEFAULT_SETTINGS.workDuration;
					await this.plugin.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('短休息时长（分钟）')
			.setDesc('每个短休息的时长')
			.addText(text => text
				.setValue(this.plugin.settings.shortBreakDuration.toString())
				.onChange(async (value) => {
					this.plugin.settings.shortBreakDuration = Number(value) || DEFAULT_SETTINGS.shortBreakDuration;
					await this.plugin.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('长休息时长（分钟）')
			.setDesc('每个长休息的时长')
			.addText(text => text
				.setValue(this.plugin.settings.longBreakDuration.toString())
				.onChange(async (value) => {
					this.plugin.settings.longBreakDuration = Number(value) || DEFAULT_SETTINGS.longBreakDuration;
					await this.plugin.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('长休息间隔')
			.setDesc('多少个番茄钟后进行长休息')
			.addText(text => text
				.setValue(this.plugin.settings.longBreakInterval.toString())
				.onChange(async (value) => {
					this.plugin.settings.longBreakInterval = Number(value) || DEFAULT_SETTINGS.longBreakInterval;
					await this.plugin.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('自动开始休息')
			.setDesc('番茄钟结束后自动开始休息')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoStartBreaks)
				.onChange(async (value) => {
					this.plugin.settings.autoStartBreaks = value;
					await this.plugin.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('自动开始番茄钟')
			.setDesc('休息结束后自动开始下一个番茄钟')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoStartPomodoros)
				.onChange(async (value) => {
					this.plugin.settings.autoStartPomodoros = value;
					await this.plugin.saveSettings();
				}));
	}
} 