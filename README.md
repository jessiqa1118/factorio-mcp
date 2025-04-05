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

## サーバーの起動

MCPサーバーを直接起動するには、以下のコマンドを使用します：

```bash
# ビルド後に実行
npm run start

# または
node build/index.js

# 開発モード（ビルドと実行を同時に行う）
npm run dev
```

## WSL上での実行とClineからの接続

WSL上でMCPサーバーを実行し、Windows上のCline（VSCode拡張機能）から接続するには、以下の手順で設定します：

1. WSL上でMCPサーバーをビルドして実行します：
   ```bash
   cd /path/to/factorio-mcp
   npm install
   npm run build
   npm run start
   ```

2. Clineの設定ファイルを編集します。このファイルは通常以下の場所にあります：
   ```
   C:\Users\jessiqa\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
   ```

3. 設定ファイルに以下のようなエントリを追加します：
   ```json
   {
     "mcpServers": {
       "factorio": {
         "command": "wsl",
         "args": ["-e", "node", "/path/to/factorio-mcp/build/index.js"],
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

4. `/path/to/factorio-mcp/` を実際のWSL内のパスに置き換えてください。
5. VSCodeを再起動するか、Cline拡張機能を再読み込みして、設定を反映させます。

## 使用方法

MCPサーバーを設定した後、Claudeに以下のようなコマンドを使用できます：

```
サーバーの状態を教えて
```

または、特定のツールを直接呼び出すこともできます：

```
factorioサーバーのプレイヤーリストを表示して
```

## トラブルシューティング

### rconコマンドの設定

このプロジェクトは`rcon`コマンドを使用してFactorioサーバーと通信します。正しく動作させるには、以下の設定が必要です：

1. **rcon.yamlファイルの作成**
   ```bash
   mkdir -p ~/.config/rcon
   cat > ~/.config/rcon/rcon.yaml << EOF
   default:
     address: 127.0.0.1:27015
     password: あなたのパスワード
   EOF
   ```

   注意: YAMLの形式が重要です。特にインデントに注意してください。

2. **設定ファイルの権限確認**
   ```bash
   chmod 600 ~/.config/rcon/rcon.yaml
   ```

### WSL上での環境変数の設定

WSL上でMCPサーバーを実行する場合、環境変数の設定方法に注意が必要です：

1. **一時的な設定（セッション中のみ有効）**
   ```bash
   export FACTORIO_SERVER_IP="127.0.0.1"
   export FACTORIO_RCON_PORT="27015"
   export FACTORIO_RCON_PASSWORD="あなたのパスワード"
   ```

2. **永続的な設定（.profileに追加）**
   ```bash
   echo 'export FACTORIO_RCON_PASSWORD="あなたのパスワード"' >> ~/.profile
   source ~/.profile
   ```

3. **非対話型シェルでの注意点**
   - `.bashrc`に設定を追加しても、非対話型シェルでは読み込まれない場合があります
   - 代わりに`.profile`または`.bash_profile`に設定を追加してください

### 接続のテストと確認

接続に問題がある場合、以下の手順で確認できます：

1. **環境変数の確認**
   ```bash
   echo $FACTORIO_RCON_PASSWORD
   env | grep FACTORIO
   ```

2. **直接コマンドを実行してテスト**
   ```bash
   rcon -c ~/.config/rcon/rcon.yaml "serverinfo"
   ```

3. **設定ファイルの内容確認**
   ```bash
   cat ~/.config/rcon/rcon.yaml
   ```

### 一般的なエラーと解決方法

1. **「rcon.yaml: no such file or directory」エラー**
   - 設定ファイルが存在しないか、パスが間違っています
   - `~/.config/rcon/rcon.yaml`ファイルを作成してください

2. **「cannot unmarshal !!str into config.Session」エラー**
   - 設定ファイルの形式が正しくありません
   - 上記の正しい形式で設定ファイルを作成し直してください

3. **「authentication failed」エラー**
   - パスワードが間違っているか、設定されていません
   - 設定ファイルとFactorioサーバーのパスワードが一致しているか確認してください

4. **「factorio-rcon: command not found」エラー**
   - このプロジェクトは`rcon`コマンドを使用するように更新されています
   - `rcon`コマンドがインストールされているか確認してください

### 応答が表示されない問題

Factorioサーバーはコマンドを実行してゲーム内にメッセージを表示しますが、RCONプロトコルを通じて応答を返さない場合があります。これはFactorioの仕様であり、MCPサーバーの問題ではありません。

コマンドが正常に実行されているかどうかは、ゲーム内のメッセージを確認してください。

## ライセンス

MIT
