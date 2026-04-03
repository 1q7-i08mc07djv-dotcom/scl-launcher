import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import MyButton from './MyButton';

interface PrivacyDialogProps {
  onAgree: () => void;
}

const PRIVACY_POLICY_ZH = `SCL 启动器隐私协议

最后更新：2026年4月3日

感谢您使用 SCL 启动器（以下简称"本软件"）。本软件由 SCL 团队（以下简称"我们"）开发和运营。我们非常重视您的个人隐私保护。

一、信息收集与使用

1. 本地数据存储
   - 本软件所有配置数据（账户信息、游戏设置、下载源偏好等）均存储在您本地计算机的 ~/.SCL/ 目录下
   - 我们不会上传您的个人配置、账户信息或游戏数据到任何服务器

2. 游戏版本列表
   - 本软件向第三方镜像服务器（BMCLAPI、GitCode、MCBBS、阿里云、腾讯云等）请求游戏版本元数据
   - 这些请求仅用于获取版本信息，不包含任何个人身份信息

3. 账户信息
   - 您输入的离线账户用户名和 UUID 仅存储在本地
   - 微软账户认证通过官方 Microsoft OAuth 2.0 接口完成，我们不会存储您的微软凭据
   - 第三方皮肤站 Token 仅在您明确授权时存储在本地

4. 遥测数据
   - 本软件不收集任何使用遥测、崩溃报告或分析数据

二、信息共享

我们不会与任何第三方共享、出售或出租您的个人信息。

三、数据安全

我们通过以下措施保护您的数据安全：
- 本地存储采用文件系统标准权限保护
- 敏感信息（如第三方 Token）建议您妥善保管，不要向他人透露

四、第三方服务

本软件使用的第三方服务：
- Microsoft OAuth（微软正版登录）
- 各游戏下载镜像站（BMCLAPI、GitCode 等）
- 本地 Minecraft 安装目录（由您指定或系统默认路径）

这些服务的隐私政策由各服务提供方独立制定，请参阅各服务提供方的条款。

五、您的权利

您可以随时：
- 查看 ~/.SCL/ 目录下的所有本地存储数据
- 删除 ~/.SCL/ 目录清除所有本地存储数据
- 拒绝使用需要网络的功能（游戏下载、微软登录等）

六、联系我们

如果您对本隐私协议有任何疑问，请通过 GitHub Issues 与我们联系。

七、协议更新

我们可能会不时更新本隐私协议。更新版本将在本软件中公告，请在使用前仔细阅读。`;

const PRIVACY_POLICY_EN = `SCL Launcher Privacy Policy

Last updated: April 3, 2026

Thank you for using SCL Launcher ("the Software"). The Software is developed and operated by the SCL Team ("we", "us"). We take your privacy seriously.

1. Information Collection and Use

1.1 Local Data Storage
   - All configuration data (account info, game settings, download source preferences, etc.) is stored locally in the ~/.SCL/ directory on your computer
   - We do NOT upload your personal configuration, account information, or game data to any server

1.2 Game Version Metadata
   - The Software requests game version metadata from third-party mirror servers (BMCLAPI, GitCode, MCBBS, Aliyun, Tencent Cloud, etc.)
   - These requests are only for version information and do NOT contain any personal identification information

1.3 Account Information
   - Offline account usernames and UUIDs you enter are stored only locally
   - Microsoft account authentication uses the official Microsoft OAuth 2.0 interface — we do NOT store your Microsoft credentials
   - Third-party skin server tokens are stored locally only with your explicit authorization

1.4 Telemetry
   - This software does NOT collect any usage telemetry, crash reports, or analytics data

2. Information Sharing

We do NOT share, sell, or rent your personal information to any third parties.

3. Data Security

We protect your data through:
   - Standard filesystem permissions for local storage
   - Recommendation to keep sensitive information (e.g., third-party tokens) confidential

4. Third-Party Services

Third-party services used by this software:
   - Microsoft OAuth (Microsoft account login)
   - Game download mirrors (BMCLAPI, GitCode, etc.)
   - Local Minecraft installation directory (user-specified or system default)

The privacy policies of these services are governed by their respective providers.

5. Your Rights

You may at any time:
   - View all locally stored data in the ~/.SCL/ directory
   - Delete the ~/.SCL/ directory to clear all local data
   - Refuse to use features requiring network access (game downloads, Microsoft login, etc.)

6. Contact Us

If you have any questions about this Privacy Policy, please contact us via GitHub Issues.

7. Policy Updates

We may update this Privacy Policy from time to time. Updated versions will be announced in the Software. Please read carefully before use.`;

export default function PrivacyDialog({ onAgree }: PrivacyDialogProps) {
  const { t, i18n } = useTranslation();
  const privacyAgreed = useAppStore((s) => s.privacyAgreed);
  const setPrivacyAgreed = useAppStore((s) => s.setPrivacyAgreed);
  const [canAgree, setCanAgree] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lang = i18n.language || 'zh-CN';
  const policy = lang.startsWith('zh') ? PRIVACY_POLICY_ZH : PRIVACY_POLICY_EN;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    setCanAgree(atBottom);
  };

  const handleAgree = () => {
    setPrivacyAgreed(true);
    onAgree();
  };

  if (privacyAgreed) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] rounded flex flex-col"
        style={{
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            {lang.startsWith('zh') ? '隐私协议' : 'Privacy Policy'}
          </h2>
        </div>

        {/* Content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4"
        >
          <pre
            className="text-xs leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'inherit' }}
          >
            {policy}
          </pre>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {!canAgree && (
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {lang.startsWith('zh') ? '请滚动阅读完整协议' : 'Please scroll to read the full policy'}
            </span>
          )}
          <MyButton
            text={t('common.agree')}
            colorType="highlight"
            height={32}
            onClick={handleAgree}
            disabled={!canAgree}
          />
        </div>
      </div>
    </div>
  );
}
