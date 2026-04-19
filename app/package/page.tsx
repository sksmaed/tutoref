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

  return (
    <div className="min-h-[calc(100vh-60px)] bg-black-100">
      <div className="mx-auto w-full max-w-[1128px] px-4 pb-20 pt-14 lg:px-0">
        <h1 className="text-center text-[32px] font-bold leading-[150%] text-black-900 md:text-[40px]">
          學習資源
        </h1>

        <section className="mt-14 grid gap-5 lg:grid-cols-[378px_minmax(0,1fr)]">
          <div
            className="h-[272px] rounded-lg shadow-[2px_2px_10px_rgba(0,0,0,0.1)]"
            style={{
              backgroundImage:
                'linear-gradient(45deg,#f0f0f0 25%,transparent 25%),linear-gradient(-45deg,#f0f0f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f0f0f0 75%),linear-gradient(-45deg,transparent 75%,#f0f0f0 75%)',
              backgroundSize: '28px 28px',
              backgroundPosition: '0 0,0 14px,14px -14px,-14px 0px',
            }}
          />

          <div className="space-y-4">
            {articles.map((article) => (
              <a
                key={article.number}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 items-center justify-between rounded-lg bg-white px-5 shadow-[2px_2px_10px_rgba(0,0,0,0.1)] transition-colors hover:bg-primary-100"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={16} className="shrink-0 text-black-900" />
                  <span className="truncate text-[16px] font-normal leading-[150%] text-black-900">
                    {article.title}
                  </span>
                </div>
                <span className="ml-4 shrink-0 text-[14px] leading-[150%] text-black-500">
                  {article.readTime.replace(' read', '')}
                </span>
              </a>
            ))}
          </div>
        </section>

        <h2 className="mt-16 text-center text-[25px] font-bold leading-[150%] text-black-900">
          其他補充資源
        </h2>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          {resourceSections.map((section) => (
            <div
              key={section.title}
              className="rounded-lg bg-white px-9 py-7 shadow-[2px_2px_10px_rgba(0,0,0,0.1)]"
            >
              <h3 className="text-[20px] font-medium leading-[150%] text-black-900">
                {section.title}
              </h3>

              <ul className="mt-6 space-y-1">
                {section.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-[16px] font-bold leading-[150%] text-primary-900 transition-colors hover:text-primary-700"
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
