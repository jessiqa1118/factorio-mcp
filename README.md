# Factorio MCP Server

Factorioゲームサーバーの状態を問い合わせるためのModel Context Protocol (MCP) サーバーです。このサーバーは、`factorio-rcon`コマンドを使用してFactorioサーバーと通信し、サーバーの状態、プレイヤーリスト、ゲーム内時間などの情報を取得します。

## 機能

このMCPサーバーは以下のツールを提供します：

- `get_server_status`: Factorioサーバーの状態を取得
- `list_players`: 現在接続しているプレイヤーの一覧を取得
- `get_game_time`: 現在のゲーム内時間を取得
- `execute_command`: 任意のFactorioコマンドを実行

## 前提条件

- Node.js 18以上
- TypeScript
- factorio-rconコマンドがインストールされていること

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/factorio-mcp.git
cd factorio-mcp

# 依存関係をインストール
npm install

# ビルド
npm run build
```

## 設定

以下の環境変数を設定することで、Factorioサーバーへの接続情報を指定できます：

- `FACTORIO_SERVER_IP`: Factorioサーバーのアドレス（デフォルト: 127.0.0.1）
- `FACTORIO_RCON_PORT`: RCONポート（デフォルト: 27015）
- `FACTORIO_RCON_PASSWORD`: RCONパスワード

## 実装の詳細

このMCPサーバーは、最新のMCP SDK（v1.8.0）を使用して実装されています。主な実装ポイントは以下の通りです：

1. `McpServer`クラスを使用して、MCPサーバーを作成
2. 各ツールは`server.tool()`メソッドを使用して定義
3. `factorio-rcon`コマンドは`child_process.exec`を使用して実行
4. エラーハンドリングを各ツールに実装し、エラーが発生した場合は適切なエラーメッセージを返す

## MCPサーバーの設定

Claudeの設定ファイルに以下の設定を追加します：

### Cline（VSCode拡張機能）の場合

`cline_mcp_settings.json`ファイルに以下を追加：

```json
{
  "mcpServers": {
    "factorio": {
      "command": "node",
      "args": ["パス/factorio-mcp/build/index.js"],
      "env": {
        "FACTORIO_SERVER_IP": "あなたのサーバーIP",
        "FACTORIO_RCON_PORT": "27015",
        "FACTORIO_RCON_PASSWORD": "あなたのパスワード"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Claude Desktop Appの場合

`claude_desktop_config.json`ファイルに以下を追加：

```json
{
  "mcpServers": {
    "factorio": {
      "command": "node",
      "args": ["パス/factorio-mcp/build/index.js"],
      "env": {
        "FACTORIO_SERVER_IP": "あなたのサーバーIP",
        "FACTORIO_RCON_PORT": "27015",
        "FACTORIO_RCON_PASSWORD": "あなたのパスワード"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## 使用方法

MCPサーバーを設定した後、Claudeに以下のようなコマンドを使用できます：

```
サーバーの状態を教えて
```

または、特定のツールを直接呼び出すこともできます：

```
factorioサーバーのプレイヤーリストを表示して
```

## 開発

```bash
# 開発モードで実行
npm run dev
```

## トラブルシューティング

### factorio-rconコマンドが見つからない場合

factorio-rconコマンドがインストールされていることを確認してください。Factorioサーバーがインストールされているディレクトリにあるはずです。

### 接続エラーが発生する場合

環境変数が正しく設定されていることを確認してください。特に、サーバーIPアドレス、RCONポート、RCONパスワードが正しいことを確認してください。

## ライセンス

MIT
