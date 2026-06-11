export const siteConfig = {
    brand: {
        name: 'Chen Yi',
        monogram: 'CY',
        role: 'Product Engineer',
        tagline: '把产品、界面与前端体验做得更有温度。',
        location: 'Shanghai / Remote',
    },
    hero: {
        eyebrow: 'Personal Website',
        title: '设计感、内容感与交互节奏并重的个人站点',
        description: '这里展示我的项目、写作、服务能力与联系方式。整体风格会偏克制、干净，保留一点品牌化的光感和层次。',
        status: 'Currently available for selected freelance and product collaborations.',
        stats: [
            { label: 'Focus', value: 'Web Experience' },
            { label: 'Mode', value: 'Design + Frontend' },
            { label: 'Output', value: 'Portfolio / Notes / Services' },
        ],
    },
    about: {
        intro: '我关注产品叙事、信息结构与细节交互，希望让一个站点既能清楚传达内容，也能保留个人审美气质。',
        highlights: [
            '偏好简洁但有节奏的视觉系统',
            '擅长从信息架构延伸到页面表现',
            '会把动效当成叙事的一部分，而不是装饰',
        ],
    },
    contact: {
        email: 'hello@chenyi.design',
        availability: '开放项目咨询 / 作品合作 / 设计工程顾问',
    },
    theme: {
        background: '#f5f7fb',
        backgroundAccent: 'rgba(96, 165, 250, 0.16)',
        surface: 'rgba(255, 255, 255, 0.72)',
        surfaceStrong: 'rgba(255, 255, 255, 0.92)',
        border: 'rgba(148, 163, 184, 0.24)',
        headerBackground: 'rgba(15, 23, 42, 0.78)',
        headerBorder: 'rgba(148, 163, 184, 0.18)',
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        textMuted: '#64748b',
        accent: '#2563eb',
        accentSoft: 'rgba(37, 99, 235, 0.12)',
        accentStrong: '#1d4ed8',
        shadow: '0 24px 80px rgba(15, 23, 42, 0.10)',
    },
};
export function getSiteThemeCssVariables() {
    const { theme } = siteConfig;
    return {
        '--site-background': theme.background,
        '--site-background-accent': theme.backgroundAccent,
        '--site-surface': theme.surface,
        '--site-surface-strong': theme.surfaceStrong,
        '--site-border': theme.border,
        '--site-header-background': theme.headerBackground,
        '--site-header-border': theme.headerBorder,
        '--site-text-primary': theme.textPrimary,
        '--site-text-secondary': theme.textSecondary,
        '--site-text-muted': theme.textMuted,
        '--site-accent': theme.accent,
        '--site-accent-soft': theme.accentSoft,
        '--site-accent-strong': theme.accentStrong,
        '--site-shadow': theme.shadow,
    };
}
