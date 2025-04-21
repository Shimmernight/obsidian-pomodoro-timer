import { App, Notice, Plugin, PluginSettingTab, Setting, normalizePath, TFile, TAbstractFile } from 'obsidian';

interface PomodoroSettings {
	workDuration: number;
	shortBreakDuration: number;
	longBreakDuration: number;
	longBreakInterval: number;
	autoStartBreaks: boolean;
	autoStartPomodoros: boolean;
	useSystemNotifications: boolean;
	playMusicDuringBreak: boolean;
	musicVolume: number;
	customMusicPath: string;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
	workDuration: 25,
	shortBreakDuration: 5,
	longBreakDuration: 15,
	longBreakInterval: 4,
	autoStartBreaks: true,
	autoStartPomodoros: true,
	useSystemNotifications: false,
	playMusicDuringBreak: false,
	musicVolume: 0.5,
	customMusicPath: ''
}

export default class PomodoroTimerPlugin extends Plugin {
	settings: PomodoroSettings;
	statusBarEl: HTMLElement;
	audioPlayer: HTMLAudioElement | null = null;
	
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

		// 请求通知权限（如果用户已启用系统通知）
		if (this.settings.useSystemNotifications) {
			this.requestNotificationPermission();
		}
		
		// 创建音频播放器
		this.createAudioPlayer();
	}
	
	onunload() {
		this.clearTimer();
		this.stopMusic();
	}
	
	// 请求系统通知权限
	requestNotificationPermission() {
		if ("Notification" in window && Notification.permission !== "granted") {
			Notification.requestPermission();
		}
	}
	
	// 发送系统通知
	sendSystemNotification(title: string, body: string) {
		if (!this.settings.useSystemNotifications) return;
		
		if ("Notification" in window && Notification.permission === "granted") {
			new Notification(title, {
				body: body,
				icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
			});
		}
	}
	
	// 创建音频播放器
	createAudioPlayer() {
		if (!this.audioPlayer) {
			this.audioPlayer = new Audio();
			this.audioPlayer.loop = true;
			this.audioPlayer.volume = this.settings.musicVolume;
		}
	}
	
	// 播放音乐
	async playMusic() {
		if (!this.settings.playMusicDuringBreak || !this.audioPlayer) return;
		
		try {
			// 如果用户设置了自定义音乐路径
			if (this.settings.customMusicPath) {
				// 构建音乐文件在插件目录中的完整路径
				const pluginId = this.manifest.id;
				const musicPath = normalizePath(`.obsidian/plugins/${pluginId}/${this.settings.customMusicPath}`);
				
				// 使用adapter检查文件是否存在
				const exists = await this.app.vault.adapter.exists(musicPath);
				if (exists) {
					// 读取二进制文件
					const data = await this.app.vault.adapter.readBinary(musicPath);
					// 创建blob URL
					const blob = new Blob([data], { type: this.getMimeType(musicPath) });
					const url = URL.createObjectURL(blob);
					this.audioPlayer.src = url;
					
					await this.audioPlayer.play();
				} else {
					// 文件不存在，提示用户
					new Notice("未找到音乐文件，请在设置中选择音乐文件");
					this.settings.playMusicDuringBreak = false;
					await this.saveSettings();
				}
			} else {
				// 没有设置音乐，提示用户
				new Notice("未设置音乐文件，请在设置中选择音乐文件");
				this.settings.playMusicDuringBreak = false;
				await this.saveSettings();
			}
		} catch (error) {
			console.error("播放音乐失败:", error);
			new Notice("播放音乐失败，请检查音乐文件设置");
			this.settings.playMusicDuringBreak = false;
			await this.saveSettings();
		}
	}
	
	// 获取文件的MIME类型
	getMimeType(filePath: string): string {
		const ext = filePath.split('.').pop()?.toLowerCase() || 'mp3';
		switch (ext) {
			case 'mp3': return 'audio/mpeg';
			case 'wav': return 'audio/wav';
			case 'ogg': return 'audio/ogg';
			case 'm4a': return 'audio/mp4';
			case 'flac': return 'audio/flac';
			default: return 'audio/mpeg';
		}
	}
	
	// 停止音乐
	stopMusic() {
		if (this.audioPlayer) {
			this.audioPlayer.pause();
			this.audioPlayer.currentTime = 0;
			
			// 如果使用了 URL.createObjectURL，需要释放资源
			if (this.audioPlayer.src.startsWith('blob:')) {
				URL.revokeObjectURL(this.audioPlayer.src);
			}
		}
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
		
		// 更新音量
		if (this.audioPlayer) {
			this.audioPlayer.volume = this.settings.musicVolume;
		}
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
		
		// 如果进入休息模式，播放音乐
		if (!this.isWorkMode && this.settings.playMusicDuringBreak) {
			this.playMusic();
		}
		
		this.timer = window.setInterval(() => this.updateTimer(), 1000);
		this.updateStatusBar();
	}
	
	pausePomodoro() {
		this.isRunning = false;
		this.statusBarEl.removeClass('running');
		this.clearTimer();
		
		// 如果当前是休息模式，暂停也会停止音乐
		if (!this.isWorkMode) {
			this.stopMusic();
		}
		
		this.updateStatusBar();
	}
	
	resetPomodoro() {
		this.clearTimer();
		this.isRunning = false;
		this.statusBarEl.removeClass('running');
		this.timeLeft = 0;
		this.stopMusic();
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
				
				// 发送系统通知
				this.sendSystemNotification(
					"番茄钟完成", 
					"工作时间结束，现在可以休息一下了！"
				);
				
				this.isWorkMode = false;
				this.isRunning = false;
				
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
					this.statusBarEl.removeClass('running');
				}
			} else {
				// 休息结束
				new Notice('休息结束！');
				
				// 停止音乐
				this.stopMusic();
				
				// 发送系统通知
				this.sendSystemNotification(
					"休息结束", 
					"休息时间结束，准备开始新的工作周期！"
				);
				
				this.isWorkMode = true;
				this.isRunning = false;
				
				// 是否自动开始下一个番茄钟
				if (this.settings.autoStartPomodoros) {
					this.timeLeft = this.settings.workDuration * 60;
					this.startPomodoro();
					new Notice(`开始新的番茄钟 (${this.settings.workDuration} 分钟)`);
				} else {
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
				
		new Setting(containerEl)
			.setName('使用系统通知')
			.setDesc('即使不在Obsidian窗口也能收到通知提醒')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useSystemNotifications)
				.onChange(async (value) => {
					this.plugin.settings.useSystemNotifications = value;
					await this.plugin.saveSettings();
					
					// 如果启用，请求通知权限
					if (value) {
						this.plugin.requestNotificationPermission();
					}
				}));
		
		containerEl.createEl('h3', {text: '休息音乐设置'});
		
		new Setting(containerEl)
			.setName('休息时播放音乐')
			.setDesc('在休息时段播放舒缓音乐')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.playMusicDuringBreak)
				.onChange(async (value) => {
					this.plugin.settings.playMusicDuringBreak = value;
					await this.plugin.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('音乐音量')
			.setDesc('设置休息音乐的音量')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.musicVolume)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.musicVolume = value;
					await this.plugin.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('自定义音乐')
			.setDesc('选择库中的音乐文件作为休息音乐 (支持 mp3, wav, ogg, m4a, flac 格式)')
			.addText(text => {
				text.setValue(this.plugin.settings.customMusicPath)
					.setPlaceholder('例如: music/relax.mp3')
					.onChange(async (value) => {
						this.plugin.settings.customMusicPath = value;
						await this.plugin.saveSettings();
					});
				
				// 添加选择文件按钮
				this.addFileSelectionButton(containerEl, text);
				
				return text;
			});
	}
	
	// 添加文件选择按钮
	private addFileSelectionButton(containerEl: HTMLElement, textComponent: any) {
		const buttonEl = containerEl.createEl('button', {
			text: '选择文件',
			cls: 'mod-cta'
		});
		
		buttonEl.addEventListener('click', () => {
			// 创建文件选择器
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'audio/*';
			
			// 点击文件选择器
			input.click();
			
			// 文件选择后触发
			input.onchange = async () => {
				const files = input.files;
				if (files && files.length > 0) {
					const file = files[0];
					
					// 检查文件格式
					const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac'];
					if (!validTypes.includes(file.type)) {
						new Notice('不支持的音频格式，请使用mp3、wav、ogg、m4a或flac格式');
						return;
					}
					
					try {
						// 读取文件内容
						const buffer = await file.arrayBuffer();
						
						// 获取插件ID
						const pluginId = this.plugin.manifest.id;
						
						// 创建音乐文件夹路径
						const musicDirPath = normalizePath(`.obsidian/plugins/${pluginId}/music`);
						
						// 确保音乐文件夹存在
						if (!(await this.plugin.app.vault.adapter.exists(musicDirPath))) {
							await this.plugin.app.vault.adapter.mkdir(musicDirPath);
						}
						
						// 先尝试清理之前的音乐文件
						await this.cleanupOldMusicFile();
						
						// 文件保存路径
						const fileName = file.name;
						const musicDirName = 'music';
						const filePath = `${musicDirName}/${fileName}`;
						const fullPath = normalizePath(`.obsidian/plugins/${pluginId}/${filePath}`);
						
						// 保存到文件系统
						try {
							await this.plugin.app.vault.adapter.writeBinary(fullPath, buffer);
							
							// 更新设置
							this.plugin.settings.customMusicPath = filePath;
							await this.plugin.saveSettings();
							
							// 更新文本框显示
							textComponent.setValue(filePath);
							
							new Notice(`音乐文件已保存至插件目录: ${filePath}`);
						} catch (err) {
							console.error('保存音乐文件失败:', err);
							new Notice('保存音乐文件失败');
						}
					} catch (err) {
						console.error('读取或保存音乐文件失败:', err);
						new Notice('读取或保存音乐文件失败');
					}
				}
			};
		});
		
		// 添加清空按钮
		const clearBtnEl = containerEl.createEl('button', {
			text: '清空',
			cls: 'mod-warning'
		});
		
		clearBtnEl.addEventListener('click', async () => {
			// 清空当前设置的音乐
			this.plugin.settings.customMusicPath = '';
			await this.plugin.saveSettings();
			textComponent.setValue('');
			
			// 清理音乐文件
			await this.cleanupOldMusicFile();
			
			new Notice('已清空音乐设置');
		});
	}
	
	// 清理旧的音乐文件
	private async cleanupOldMusicFile() {
		try {
			// 如果有之前的音乐文件设置
			if (this.plugin.settings.customMusicPath) {
				const pluginId = this.plugin.manifest.id;
				const oldMusicPath = normalizePath(`.obsidian/plugins/${pluginId}/${this.plugin.settings.customMusicPath}`);
				
				// 检查文件是否存在
				if (await this.plugin.app.vault.adapter.exists(oldMusicPath)) {
					// 删除旧文件
					await this.plugin.app.vault.adapter.remove(oldMusicPath);
					console.log(`已删除旧的音乐文件: ${oldMusicPath}`);
				}
			}
		} catch (err) {
			console.error('清理旧音乐文件失败:', err);
		}
	}
} 