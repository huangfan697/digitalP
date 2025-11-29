<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Cyber Avatar Interface

React + Vite + Three.js (ReadyPlayerMe 模型) 的前端，已对接本地后端：
- WS：`ws://localhost:8899/ws/voice`
- HTTP：`http://localhost:8899/api/chat-tts`

## 本地运行
1) `cd static/cyberavatar-agent-interface`
2) `npm install`
3) `npm run dev`（默认端口 5173）
4) 确认后端已运行：`mvn spring-boot:run`（监听 8899）

## 交互说明
- 右侧聊天框点击 Connect 即会初始化音频并连到 `/ws/voice`。
- 输入文本发送：走 WS，后端返回 `TEXT`、`AUDIO`（PCM16k base64）。若 WS 未连，会 fallback 到 `/api/chat-tts`，返回文本+音频。
- 语音播放：`services/audioManager` 将 `AUDIO` 转为 AudioBuffer 串行播放；能量值驱动 Avatar 嘴型（`Avatar.tsx`）。
- 录音（可选）：点击麦克风开始/停止，推流到 WS（后端若未启用 ASR，可先不用）。

## 后端消息格式（对齐）
- `TEXT`：`{type:"TEXT", role:"asr|llm|system", text:"...", emotion?:string}`
- `AUDIO`：`{type:"AUDIO", audio:"<base64 pcm16k>"}`
- `EVENT`：`{type:"EVENT", event:"tts_complete"}`（可用于收尾）
- `VISEME`：预留，若后端提供嘴型时间轴可在 `Scene/Avatar` 优先使用；当前用音频能量兜底。
