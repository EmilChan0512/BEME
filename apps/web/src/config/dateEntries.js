export const dateEntries = [
    {
        date: '2026-06-09',
        title: '把首页改成每日记录站',
        summary: '今天把导航和路由思路彻底改了，网站开始真正围绕日期组织内容。',
        note: '原本站点还是通用企业模板，今天先把方向掰正成 daily log。接下来每一天都可以是一张独立页面，像在时间轴上留下一个截面。',
        highlights: [
            '确认日期会同时作为 tab 名称和路由路径',
            '开始梳理页面结构，准备接入按天记录的数据模型',
            '为 liquid glass 头部继续做了更透明的视觉调整',
        ],
        tags: ['routing', 'journal', 'design'],
    },
    {
        date: '2026-06-08',
        title: '把头部做成玻璃质感',
        summary: '导航区已经有了基础的液态玻璃风格，开始接近个人操作系统的感觉。',
        note: '今天主要在头部细节上来回调整透明度、模糊和高光层次。玻璃感不是单靠背景透明，而是要靠前景高光、阴影和页面背景一起配合。',
        highlights: [
            '重做 header 容器和 tab 胶囊视觉',
            '补了 hover 与 active 的高光层',
            '移动端也保留了胶囊滚动体验',
        ],
        tags: ['ios', 'glass', 'ui'],
    },
    {
        date: '2026-06-07',
        title: '拆掉单文件样式',
        summary: '把一整份全局 CSS 拆成基础层、布局层、组件层和转场层，后续维护舒服很多。',
        note: '这一步虽然不显眼，但对长期写作站点很重要。页面会越来越多，如果样式还堆在一个文件里，很快就会失控。',
        highlights: [
            '拆分 base、layout、header、transition 四层样式',
            '让组件样式跟组件走，减少全局污染',
            '保留了当前构建和页面结构的稳定性',
        ],
        tags: ['css', 'refactor', 'architecture'],
    },
    {
        date: '2026-06-06',
        title: '给路由切换加一点仪式感',
        summary: '页面切换不再只是瞬间替换，而是有了更完整的过渡表达。',
        note: '个人网站不一定要复杂，但有节奏感会让浏览体验更像翻阅日志。今天保留了转场系统，为之后的每日页面切换继续服务。',
        highlights: [
            '保留 route progress 和 overlay 动画能力',
            '让导航切换不再显得生硬',
            '为未来每日页面之间的跳转留足空间',
        ],
        tags: ['transition', 'ux', 'motion'],
    },
];
export const latestDateEntry = dateEntries[0];
export function getDateEntry(date) {
    return dateEntries.find((entry) => entry.date === date);
}
