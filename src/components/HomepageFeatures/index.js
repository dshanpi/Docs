import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '全开源',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        在线文档更倾向于入门,对于深入部分我们会根据SOC特性设计专门对应的底板出相关的深入课程.
      </>
    ),
  },
  {
    title: '低价格',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
       东山Pi系列开发是深圳百问网公司为想学习嵌入式Linux开发同学专门设计定做的低价超高性价比开发板.    
      </>
    ),
  },
  {
    title: '多文档',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        丰富的源码使用文档，帮助您更快的上手使用.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
