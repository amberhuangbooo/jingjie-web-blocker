# 清净网页屏蔽器

电脑 Chrome 插件和 iPhone 描述文件都由同一个 `blocklist.txt` 生成。所有处理均在本地完成。为避免影响 VPN 和正常搜索，iPhone 描述文件只屏蔽名单中的域名，不启用苹果的自动内容识别。

## 修改屏蔽名单

1. 打开 `blocklist.txt`。
2. 每行填写一个域名，例如 `example.com`。
3. 双击 `生成屏蔽配置.command`。

生成后会得到：

- Chrome 规则：`generated/chrome-rules.json`
- iPhone 描述文件：`清净网页屏蔽器-iPhone.mobileconfig`

## 安装电脑 Chrome 插件

1. 打开 `chrome://extensions/`。
2. 开启右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本文件夹。

以后名单发生变化时，再次运行生成程序，然后在 `chrome://extensions/` 中点击插件的“重新加载”。

## 安装 iPhone 描述文件

1. 运行生成程序。
2. 用 AirDrop 把 `清净网页屏蔽器-iPhone.mobileconfig` 发送到 iPhone。
3. 在 iPhone 上打开文件并允许下载描述文件。
4. 打开“设置” → “通用” → “VPN 与设备管理”。
5. 选择“清净网页屏蔽器”，点击“安装”。
6. 分别使用 Safari 和 Chrome 测试名单中的网站。

更新名单时，应先删除旧的“清净网页屏蔽器”描述文件，再安装新生成的文件。如果系统直接允许覆盖，也可以直接安装新版。

## 注意事项

- iPhone 内置网页过滤最多接受 500 个 URL。本项目为每个域名生成 HTTP 和 HTTPS 两条，因此最多支持 250 个域名。
- 成人及“吃瓜”网站经常更换域名，不存在永久完整的名单；遇到漏网网站时，把它的真实主域名追加到 `blocklist.txt` 后重新生成。
- iPhone 通过字符串规则匹配 URL；网站重定向到其他域名时，需要把重定向后的域名也加入名单。
- 描述文件是未签名的个人本地配置，安装时 iPhone 会显示相关提示。
- Apple 当前允许在 iOS 上手动安装该类型配置。iOS 16 及以上的未受监管设备需要 `ContentFilterUUID`，生成文件已经包含。
