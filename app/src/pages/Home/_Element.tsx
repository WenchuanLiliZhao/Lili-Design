import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProgressCircle } from '../../design-system/ui-components/General';

export const Element: React.FC = () => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedProgress(prev => (prev >= 100 ? 0 : prev + 1));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const pages = [
    { name: 'Timeline Demo', path: '/timeline', description: '时间轴组件演示' },
    { name: 'Material Icons Debug', path: '/icon-debug', description: 'Material Icons 图标测试页面' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Tristan-UI Component Showcase</h1>
      <p>欢迎使用 Tristan-UI 设计系统组件库！</p>

      <div style={{ marginTop: '2rem' }}>
        <h2>可用页面</h2>
        <div style={{ 
          display: 'grid', 
          gap: '1rem', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          marginTop: '1rem'
        }}>
          {pages.map((page) => (
            <Link 
              key={page.path}
              to={page.path}
              style={{
                textDecoration: 'none',
                padding: '1.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
                transition: 'all 0.2s ease',
                display: 'block'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#007bff' }}>
                {page.name}
              </h3>
              <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
                {page.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ 
        marginTop: '3rem', 
        padding: '1.5rem', 
        backgroundColor: '#f0f8ff', 
        borderRadius: '8px',
        border: '1px solid #007bff'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#007bff' }}>
          📦 最新更新 - Material Icons 集成
        </h3>
        <p style={{ margin: '0 0 1rem 0' }}>
          Tristan-UI 现已集成 Google Material Icons！无需额外依赖，超过 200+ 精美图标开箱即用。
        </p>
        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '4px', border: '1px solid #ddd' }}>
          <code>npm install tristan-ui</code>
          <br />
          <code style={{ marginTop: '0.5rem', display: 'block' }}>
            {`import { Icon } from 'tristan-ui';`}
          </code>
          <code style={{ marginTop: '0.5rem', display: 'block' }}>
            {`<Icon name="home" size="large" color="#007bff" />`}
          </code>
        </div>
        <p style={{ margin: '1rem 0 0 0', fontSize: '0.9rem', color: '#6c757d' }}>
          访问 <strong>Material Icons Debug</strong> 页面查看所有可用图标和使用示例。
        </p>
      </div>

      <div style={{ 
        marginTop: '3rem', 
        padding: '1.5rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #6592F2'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#6592F2' }}>
          🔄 新组件 - ProgressCircle 进度圆圈
        </h3>
        <p style={{ margin: '0 0 1rem 0' }}>
          基于 SVG 的可配置进度圆圈组件，支持自定义颜色、大小和动画效果。
        </p>
        
        <div style={{ 
          display: 'grid', 
          gap: '2rem', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          marginTop: '1.5rem'
        }}>
          <div>
            <h4 style={{ margin: '0 0 1rem 0' }}>不同尺寸</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ProgressCircle progress={75} size="small" />
              <ProgressCircle progress={75} size="medium" />
              <ProgressCircle progress={75} size="large" />
              <ProgressCircle progress={75} size={48} />
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 1rem 0' }}>不同颜色</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ProgressCircle progress={60} color="primary" />
              <ProgressCircle progress={60} color="success" />
              <ProgressCircle progress={60} color="warning" />
              <ProgressCircle progress={60} color="error" />
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 1rem 0' }}>显示文字</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ProgressCircle progress={85} showText size="large" />
              <ProgressCircle progress={50} showText text="50%" size="large" />
              <ProgressCircle progress={100} showText text="完成" size="large" color="success" />
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 1rem 0' }}>动画效果</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ProgressCircle 
                progress={animatedProgress} 
                showText 
                size="large" 
                color="primary"
                animationDuration={100}
              />
              <ProgressCircle 
                progress={animatedProgress} 
                showText 
                size={40} 
                color="#ff6b6b"
                strokeWidth={3}
              />
            </div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#fff', 
          padding: '1rem', 
          borderRadius: '4px', 
          border: '1px solid #ddd',
          marginTop: '1.5rem'
        }}>
          <code style={{ display: 'block', marginBottom: '0.5rem' }}>
            {`import { ProgressCircle } from 'tristan-ui';`}
          </code>
          <code style={{ display: 'block', marginBottom: '0.5rem' }}>
            {`<ProgressCircle progress={75} size="large" color="primary" showText />`}
          </code>
          <code style={{ display: 'block' }}>
            {`<ProgressCircle progress={50} size={32} color="#6592F2" strokeWidth={3} />`}
          </code>
        </div>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#6c757d' }}>
        <p>
          <strong>版本:</strong> 0.2.1<br />
          <strong>文档:</strong> 查看各组件页面了解详细使用方法<br />
          <strong>源码:</strong> <a href="https://github.com/wenchuanlilizhao/tristan-ui" target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
      </div>
    </div>
  );
};