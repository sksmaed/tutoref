'use client'

import React from 'react';
import { FileText } from 'lucide-react';
import { articles, packages } from '../../types/package'

type ResourceLink = {
  name: string
  url: string
}

const allLinks = packages.flatMap((pkg) => pkg.links)

const findLink = (keyword: string): ResourceLink | null => {
  const result = allLinks.find((link) => link.name.includes(keyword))
  return result ?? null
}

const resourceSections: { title: string; links: ResourceLink[] }[] = [
  {
    title: '教案相關',
    links: [
      findLink('關於教案驗收的一些想法'),
      findLink('優良教案紙參考'),
    ].filter((link): link is ResourceLink => link !== null),
  },
  {
    title: '投影片相關',
    links: [
      findLink('投影片技巧'),
      findLink('投影片免費素材'),
    ].filter((link): link is ResourceLink => link !== null),
  },
  {
    title: '學習單相關',
    links: [
      findLink('學習單製作說明簡報'),
      findLink('學習單範例'),
    ].filter((link): link is ResourceLink => link !== null),
  },
  {
    title: '教學相關',
    links: [
      findLink('優良課程錄影'),
      findLink('教學情境短劇'),
    ].filter((link): link is ResourceLink => link !== null),
  },
]

const PackagePage = () => {
  const articleListRef = React.useRef<HTMLDivElement | null>(null)
  const [articleListHeight, setArticleListHeight] = React.useState(0)

  React.useEffect(() => {
    const target = articleListRef.current
    if (!target) return

    const updateHeight = () => {
      setArticleListHeight(Math.round(target.getBoundingClientRect().height))
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(target)
    window.addEventListener('resize', updateHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return (
    <div className="min-h-[calc(100vh-60px)] bg-black-100">
      <div className="mx-auto w-full max-w-[1128px] px-4 pb-[clamp(56px,8vw,80px)] pt-[clamp(40px,6vw,56px)] lg:px-0">
        <h1 className="text-center text-[clamp(28px,4vw,40px)] font-bold leading-[150%] text-black-900">
          學習資源
        </h1>

        <section className="mt-[clamp(28px,5vw,56px)] grid gap-[clamp(12px,2vw,20px)] lg:grid-cols-[minmax(240px,33.5%)_minmax(0,1fr)] lg:items-stretch">
          <div className="flex w-full justify-center lg:h-full">
            <div
              className="aspect-square w-full max-w-full overflow-hidden rounded-lg shadow-[2px_2px_10px_rgba(0,0,0,0.1)] lg:h-auto lg:w-auto"
              style={
                articleListHeight > 0
                  ? { width: `${articleListHeight}px`, height: `${articleListHeight}px` }
                  : undefined
              }
            >
              <img
                src="/tp_resource.png"
                alt="學習資源插圖"
                className="block h-full w-full object-cover object-center"
              />
            </div>
          </div>

          <div ref={articleListRef} className="space-y-[clamp(10px,1.5vw,16px)] self-start">
            {articles.map((article) => (
              <a
                key={article.number}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[clamp(48px,5vw,56px)] items-center justify-between rounded-lg bg-white px-[clamp(14px,2vw,20px)] shadow-[2px_2px_10px_rgba(0,0,0,0.1)] transition-colors hover:bg-primary-100"
              >
                <div className="flex min-w-0 items-center gap-[clamp(8px,1.4vw,12px)]">
                  <FileText size={16} className="shrink-0 text-black-900" />
                  <span className="truncate text-[clamp(14px,1.6vw,16px)] font-normal leading-[150%] text-black-900">
                    {article.title}
                  </span>
                </div>
                <span className="ml-4 shrink-0 text-[clamp(12px,1.3vw,14px)] leading-[150%] text-black-500">
                  {article.readTime.replace(' read', '')}
                </span>
              </a>
            ))}
          </div>
        </section>

        <h2 className="mt-[clamp(40px,6vw,64px)] text-center text-[clamp(22px,3vw,25px)] font-bold leading-[150%] text-black-900">
          其他補充資源
        </h2>

        <section className="mt-[clamp(20px,3vw,40px)] grid gap-[clamp(12px,2vw,20px)] md:grid-cols-2">
          {resourceSections.map((section) => (
            <div
              key={section.title}
              className="rounded-lg bg-white px-[clamp(20px,3vw,36px)] py-[clamp(18px,2.5vw,28px)] shadow-[2px_2px_10px_rgba(0,0,0,0.1)]"
            >
              <h3 className="text-[clamp(18px,2.3vw,20px)] font-medium leading-[150%] text-black-900">
                {section.title}
              </h3>

              <ul className="mt-[clamp(14px,2vw,24px)] space-y-1">
                {section.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-[clamp(14px,1.8vw,16px)] font-bold leading-[150%] text-primary-900 transition-colors hover:text-primary-700"
                    >
                      <FileText size={16} className="shrink-0" />
                      <span>{link.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default PackagePage;
