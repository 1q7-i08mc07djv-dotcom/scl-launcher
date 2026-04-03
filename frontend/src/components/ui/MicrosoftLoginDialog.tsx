import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MyButton from './MyButton';

interface MicrosoftLoginDialogProps {
  onLoginSuccess: (account: { type: 'microsoft'; username: string; uuid: string; token: string }) => void;
  onCancel: () => void;
}

const DEVICE_CODE_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode';
const TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
const XBL_AUTH_URL = 'https://user.auth.xboxlive.com/user/authenticate';
const XSTS_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize';
const MC_LOGIN_URL = 'https://api.minecraftservices.com/authentication/login';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  interval: number;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

export default function MicrosoftLoginDialog({ onLoginSuccess, onCancel }: MicrosoftLoginDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'input' | 'code' | 'loading' | 'error'>('input');
  const [clientId, setClientId] = useState('');
  const [userCode, setUserCode] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [error, setError] = useState('');

  const startAuth = async () => {
    if (!clientId.trim()) {
      setError('请输入应用程序客户端 ID');
      return;
    }
    setError('');
    setStep('loading');

    try {
      const dcRes = await fetch(DEVICE_CODE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId.trim(),
          response_type: 'device_code',
          scope: 'XboxLive.SignIn XboxLive.offline_access',
        }),
      });
      if (!dcRes.ok) throw new Error('无法连接 Azure AD，请检查客户端 ID');

      const dcData: DeviceCodeResponse = await dcRes.json();
      setUserCode(dcData.user_code);
      setVerifyUrl(dcData.verification_uri);
      setStep('code');

      const pollDelay = (dcData.interval ?? 5) * 1000;
      let pollTimer: ReturnType<typeof setTimeout> | null = null;
      let finished = false;

      const doPoll = async () => {
        if (finished) return;
        try {
          const tokenRes = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
              client_id: clientId.trim(),
              device_code: dcData.device_code,
            }),
          });

          const tokenData: TokenResponse = await tokenRes.json();

          if (tokenData.error === 'authorization_pending') {
            pollTimer = setTimeout(doPoll, pollDelay);
            return;
          }

          if (tokenData.error || !tokenData.access_token) {
            finished = true;
            setError(tokenData.error_description || tokenData.error || '认证失败');
            setStep('error');
            return;
          }

          finished = true;
          if (pollTimer) clearTimeout(pollTimer);
          await getXboxToken(tokenData.access_token);
        } catch (e) {
          finished = true;
          if (pollTimer) clearTimeout(pollTimer);
          setError(String(e));
          setStep('error');
        }
      };

      pollTimer = setTimeout(doPoll, pollDelay);

    } catch (e) {
      setError(String(e));
      setStep('error');
    }
  };

  const getXboxToken = async (msToken: string) => {
    setStep('loading');
    try {
      const xblRes = await fetch(XBL_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Properties: {
            AuthMethod: 'RPS',
            SiteName: 'user.auth.xboxlive.com',
            RpsTicket: `d=${msToken}`,
          },
          RelyingParty: 'http://auth.xboxlive.com',
          TokenType: 'JWT',
        }),
      });
      if (!xblRes.ok) throw new Error('Xbox 认证失败');
      const xblData = await xblRes.json();

      const xstsRes = await fetch(XSTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Properties: {
            SandboxId: 'RETAIL',
            UserTokens: [xblData.Token],
          },
          RelyingParty: 'rp://api.minecraftservices.com/',
          TokenType: 'JWT',
        }),
      });
      if (!xstsRes.ok) throw new Error('XSTS 认证失败');
      const xstsData = await xstsRes.json();

      const xboxToken = xstsData.Token;
      const userHash = xstsData.DisplayClaims?.xui[0]?.uhs || '';

      const mcRes = await fetch(MC_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityToken: `XBL3.0 x=${userHash};${xboxToken}`,
          ensureLegacyEnabled: true,
        }),
      });
      if (!mcRes.ok) throw new Error('Minecraft 认证失败');
      const mcData = await mcRes.json();

      const profileRes = await fetch('https://api.minecraftservices.com/minecraft/profile', {
        headers: { Authorization: `Bearer ${mcData.access_token}` },
      });
      if (!profileRes.ok) throw new Error('无法获取 Minecraft 档案');
      const profile = await profileRes.json();

      onLoginSuccess({
        type: 'microsoft',
        username: profile.name,
        uuid: profile.id,
        token: mcData.access_token,
      });
    } catch (e) {
      setError(String(e));
      setStep('error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="w-full max-w-md rounded p-6"
        style={{
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--color-text)' }}>
          {t('account.microsoft')}
        </h2>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Azure AD 应用程序客户端 ID
              </div>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="例如: 1a2b3c4d-5e6f-..."
                className="w-full h-9 px-3 rounded border text-sm"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                  outline: 'none',
                }}
              />
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                在 Azure Portal → Azure Active Directory → 应用注册 中获取
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                配置步骤：
              </div>
              <ol className="text-xs space-y-1 list-decimal list-inside" style={{ color: 'var(--color-text-muted)' }}>
                <li>访问 <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-highlight)' }}>portal.azure.com</a></li>
                <li>Azure Active Directory → 新建注册</li>
                <li>名称填 "SCL Launcher"，重定向 URI 选"公共客户端"</li>
                <li>填 <span style={{ color: 'var(--color-highlight)' }}>https://login.microsoftonline.com/common/oauth2/nativeclient</span></li>
                <li>复制"应用程序(客户端)ID"</li>
                <li>在"API 权限"中添加"Xbox Sign-in API"</li>
              </ol>
            </div>

            {error && (
              <div className="text-xs p-2 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <MyButton text="取消" colorType="black" height={32} onClick={onCancel} className="flex-1" />
              <MyButton text="开始登录" colorType="highlight" height={32} onClick={startAuth} className="flex-1" />
            </div>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <div className="text-sm" style={{ color: 'var(--color-text)' }}>
                请在浏览器中打开以下网址：
              </div>
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs px-3 py-2 rounded border break-all"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-highlight)',
                }}
              >
                {verifyUrl}
              </a>
              <div className="text-sm font-bold" style={{ color: 'var(--color-highlight)' }}>
                代码：<span className="text-base">{userCode}</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                输入上述代码并登录 Microsoft 账户后，此窗口将自动完成认证
              </div>
            </div>
            <div className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              等待登录完成...
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="text-center py-8 space-y-2">
            <div className="text-sm" style={{ color: 'var(--color-text)' }}>认证中...</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>请在浏览器中完成授权</div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <div className="text-sm p-3 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
              认证失败：{error}
            </div>
            <div className="flex gap-3">
              <MyButton text="取消" colorType="black" height={32} onClick={onCancel} className="flex-1" />
              <MyButton text="重试" colorType="highlight" height={32} onClick={() => { setStep('input'); setError(''); }} className="flex-1" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
