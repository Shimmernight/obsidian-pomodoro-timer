# Obsidian 番茄钟插件 | Pomodoro Timer Plugin

[English](#english) | [中文](#中文)

---

<a name="english"></a>
## English

A simple Pomodoro Timer plugin for Obsidian that helps you manage your time and improve productivity.

### Features

- Display a Pomodoro timer in the Obsidian status bar
- Automatic switching between work and break periods
- Fully customizable work duration, short breaks, and long breaks
- Notifications when Pomodoro sessions and breaks are completed
- Start/pause timer by clicking the status bar icon
- Support for customizable long break intervals
- Option to automatically start breaks and next Pomodoro sessions
- System-level notifications that work even when Obsidian is not in focus
- Relaxing music during break periods with support for custom music files (saved within the plugin folder)

### Installation

#### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Pomodoro Timer"
4. Install the plugin and enable it

#### Manual Installation

1. Download the latest release from the GitHub repository
2. Extract the files to your Obsidian plugins folder: `.obsidian/plugins/pomodoro-timer/`
3. Restart Obsidian and enable the plugin in Settings → Community Plugins

### Usage

1. Start a Pomodoro session by:
   - Clicking the Pomodoro icon in the status bar
   - Using the command palette (Ctrl+P) and selecting "Start Pomodoro"
2. During a work session, the status bar will show the remaining time and "Working" status
3. When the work session ends, you'll receive a notification and a break will begin automatically (if enabled)
4. After the break, a new Pomodoro session will start automatically (if enabled)

### Settings

- **Work Duration**: Length of each Pomodoro work session (minutes)
- **Short Break Duration**: Length of short breaks (minutes)
- **Long Break Duration**: Length of long breaks (minutes)
- **Long Break Interval**: Number of Pomodoros to complete before a long break
- **Auto Start Breaks**: Automatically start breaks after Pomodoro sessions
- **Auto Start Pomodoros**: Automatically start new Pomodoro sessions after breaks
- **Use System Notifications**: Receive system-level notifications even when Obsidian window is not in focus
- **Play Music During Break**: Play relaxing music during break periods
- **Music Volume**: Adjust the volume of break music
- **Custom Music**: Select your own audio file to play during breaks (supports mp3, wav, ogg, m4a, flac formats). Music files will be stored in the plugin directory for stability across different devices.

### Commands

- **Start Pomodoro**: Start or resume the Pomodoro timer
- **Pause Pomodoro**: Pause the running timer
- **Reset Pomodoro**: Reset the timer

---

<a name="中文"></a>
## 中文

这是一个简单的番茄钟（Pomodoro Timer）插件，帮助你在 Obsidian 中实现时间管理，提高工作和学习效率。

### 功能特点

- 在 Obsidian 状态栏显示番茄钟计时器
- 支持工作时段和休息时段的自动切换
- 完全可自定义的工作时长、短休息和长休息时长
- 在完成番茄钟和休息时发送通知
- 可以通过点击状态栏快速开始/暂停番茄钟
- 支持自定义长休息间隔（每完成几个番茄钟后进行长休息）
- 支持设置是否自动开始休息和下一个番茄钟
- 支持系统级通知，即使 Obsidian 窗口不在前台也能收到提醒
- 休息期间播放舒缓音乐，支持自定义本地音乐文件（保存在插件目录下）

### 安装方法

#### 从 Obsidian 社区插件安装

1. 打开 Obsidian 设置
2. 进入社区插件并关闭安全模式
3. 点击浏览并搜索"番茄钟"
4. 安装插件并启用

#### 手动安装

1. 从 GitHub 仓库下载最新版本
2. 解压文件到 Obsidian 插件文件夹：`.obsidian/plugins/pomodoro-timer/`
3. 重启 Obsidian 并在设置→第三方插件中启用该插件

### 使用方法

1. 通过以下方式开始番茄钟：
   - 点击状态栏上的番茄钟图标
   - 使用命令面板（Ctrl+P）执行"开始番茄钟"命令
2. 工作期间，状态栏会显示剩余时间和"工作中"状态
3. 工作时段结束后，将收到通知并自动开始休息（如果开启了自动开始休息功能）
4. 休息结束后，将收到通知并自动开始下一个番茄钟（如果开启了自动开始番茄钟功能）

### 设置选项

- **工作时长**：每个番茄钟的工作时长（分钟）
- **短休息时长**：每个短休息的时长（分钟）
- **长休息时长**：每个长休息的时长（分钟）
- **长休息间隔**：完成多少个番茄钟后进行长休息
- **自动开始休息**：番茄钟结束后是否自动开始休息
- **自动开始番茄钟**：休息结束后是否自动开始下一个番茄钟
- **使用系统通知**：启用后即使 Obsidian 窗口不在前台也能收到系统级通知提醒
- **休息时播放音乐**：在休息时段播放舒缓音乐
- **音乐音量**：设置休息音乐的音量大小
- **自定义音乐**：从您的电脑中选择音频文件作为休息音乐 (支持 mp3, wav, ogg, m4a, flac 格式)。音乐文件将保存在插件目录下，以确保在不同设备间的稳定性。

### 命令

- **开始番茄钟**：开始或恢复番茄钟
- **暂停番茄钟**：暂停当前运行的番茄钟
- **重置番茄钟**：重置番茄钟计时器

## 开发

```
npm i
npm run dev
```

## 构建

```
npm run build
``` 