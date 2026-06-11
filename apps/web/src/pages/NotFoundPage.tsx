import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section>
      <h1>404</h1>
      <p>页面不存在，回到首页继续浏览。</p>
      <Link to="/">回到首页</Link>
    </section>
  );
}
